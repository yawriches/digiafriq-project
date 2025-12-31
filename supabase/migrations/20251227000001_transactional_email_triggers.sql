-- Transactional email triggers (commission + payout)
-- Calls Supabase Edge Function `email-events`.

-- Enable net extension (required for HTTP calls from Postgres)
create extension if not exists pg_net with schema extensions;

-- Enable vault extension (required for securely storing/retrieving secrets)
create extension if not exists supabase_vault with schema vault;

-- Helper: resolve recipient email for an affiliate_id (auth.users id)
create or replace function public._email_get_user_email(p_user_id uuid)
returns text
language sql
stable
as $$
  select email from public.profiles where id = p_user_id;
$$;

-- Helper: call edge function (async) using pg_net
create or replace function public._email_call_edge_function(p_payload jsonb)
returns void
language plpgsql
security definer
as $$
declare
  v_url text;
  v_service_role_key text;
begin
  -- Hosted Supabase does not allow setting arbitrary app.settings.* parameters via SQL.
  -- Instead, read the required values from Supabase Vault.
  -- Create two vault secrets:
  -- - email_edge_functions_url  (e.g. https://<project-ref>.functions.supabase.co)
  -- - email_service_role_key    (your Supabase service role key)

  select secret
    into v_url
  from vault.decrypted_secrets
  where name = 'email_edge_functions_url'
  limit 1;

  v_url := regexp_replace(trim(coalesce(v_url, '')), '/+$', '');

  if v_url is null or length(v_url) = 0 then
    raise exception 'Missing vault secret: email_edge_functions_url';
  end if;

  select secret
    into v_service_role_key
  from vault.decrypted_secrets
  where name = 'email_service_role_key'
  limit 1;

  v_service_role_key := trim(coalesce(v_service_role_key, ''));

  if v_service_role_key is null or length(v_service_role_key) = 0 then
    raise exception 'Missing vault secret: email_service_role_key';
  end if;

  perform net.http_post(
    -- Expect v_url to be your Supabase Edge Functions base URL, e.g.
    -- https://<project-ref>.supabase.co/functions/v1
    -- (do NOT include the function name)
    url := v_url || '/Email-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := p_payload
  );
end;
$$;

-- Commission: AFTER INSERT -> send commission email
create or replace function public._email_on_commission_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_to text;
  v_source text;
  v_amount numeric;
  v_currency text;
  v_date text;
begin
  v_to := public._email_get_user_email(new.affiliate_id);
  if v_to is null then
    return new;
  end if;

  -- Prefer newer schema columns if they exist; fallback to legacy amount fields.
  v_amount := coalesce(new.commission_amount, new.amount);
  v_currency := coalesce(new.commission_currency, 'USD');
  v_source := coalesce(new.notes, new.commission_type, 'commission');
  v_date := coalesce(new.created_at::text, now()::text);

  perform public._email_call_edge_function(jsonb_build_object(
    'type', 'commission',
    'to', v_to,
    'amount', v_amount,
    'currency', v_currency,
    'source', v_source,
    'date', v_date
  ));

  return new;
end;
$$;

drop trigger if exists trg_email_commission_insert on public.commissions;
create trigger trg_email_commission_insert
after insert on public.commissions
for each row
execute function public._email_on_commission_insert();

-- Payout: AFTER UPDATE, when status changes to completed -> send payout email
create or replace function public._email_on_payout_completed()
returns trigger
language plpgsql
security definer
as $$
declare
  v_to text;
  v_method text;
  v_amount numeric;
  v_currency text;
  v_reference text;
  v_date text;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  v_to := public._email_get_user_email(new.affiliate_id);
  if v_to is null then
    return new;
  end if;

  v_amount := new.amount;
  v_currency := coalesce(new.currency, 'USD');
  v_reference := coalesce(new.reference, new.transaction_id, new.id::text);

  -- Map payout_method to your requested labels.
  -- (Your schema uses payout_method: bank/mobile_money; we map these to friendly values.)
  v_method := case
    when new.payout_method = 'bank' then 'Paystack/Bank'
    when new.payout_method = 'mobile_money' then 'Nkura/Mobile Money'
    else coalesce(new.payout_method, 'Manual')
  end;

  v_date := coalesce(new.completed_at::text, new.processed_at::text, now()::text);

  perform public._email_call_edge_function(jsonb_build_object(
    'type', 'payout',
    'to', v_to,
    'amount', v_amount,
    'currency', v_currency,
    'paymentMethod', v_method,
    'referenceId', v_reference,
    'date', v_date
  ));

  return new;
end;
$$;

drop trigger if exists trg_email_payout_completed on public.payouts;
create trigger trg_email_payout_completed
after update on public.payouts
for each row
execute function public._email_on_payout_completed();
