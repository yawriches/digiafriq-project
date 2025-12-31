-- Transactional email triggers (commission + payout)
-- Calls Supabase Edge Function `email-events`.

-- Enable net extension (required for HTTP calls from Postgres)
-- create extension if not exists pg_net with schema extensions;

-- Enable vault extension (required for securely storing/retrieving secrets)
create extension if not exists supabase_vault with schema vault;

-- NOTE:
-- DB-driven HTTP triggers have been disabled. Emails are sent from server-side routes
-- (payment verification, signup, payout completion) to avoid pg_net delivery issues
-- and to use Edge Function secrets safely.

drop trigger if exists trg_email_commission_insert on public.commissions;
drop function if exists public._email_on_commission_insert();

drop trigger if exists trg_email_payout_completed on public.payouts;
drop function if exists public._email_on_payout_completed();

drop function if exists public._email_call_edge_function(jsonb);
drop function if exists public._email_get_user_email(uuid);
