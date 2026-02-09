-- ============================================================================
-- Fix referral functions and constraints for live commission flow
-- ============================================================================
-- Issues fixed:
--   1. process_referral RPC inserts referral_type but table uses link_type
--   2. commission_type constraint may not include learner_referral/affiliate_referral
--   3. Ensure RLS INSERT policies exist for commissions and referrals (service role)
-- ============================================================================

-- ── 1. Fix commission_type constraint to include all needed types ─────────────
ALTER TABLE public.commissions
DROP CONSTRAINT IF EXISTS commissions_commission_type_check;

ALTER TABLE public.commissions
ADD CONSTRAINT commissions_commission_type_check CHECK (
  commission_type::text = ANY (ARRAY[
    'learner_initial'::text,
    'dcs_addon'::text,
    'learner_renewal'::text,
    'learner_referral'::text,
    'affiliate_referral'::text
  ])
);

-- ── 2. Fix process_referral RPC function for new schema ──────────────────────
-- The old function inserts referral_type but the current referrals table
-- uses link_type + initial_purchase_type columns instead.
CREATE OR REPLACE FUNCTION process_referral(
  p_referred_id UUID,
  p_referral_code TEXT,
  p_referral_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_referral_code_id UUID;
  v_referrer_id UUID;
  v_referral_id UUID;
  v_existing_referral UUID;
  v_link_type TEXT;
BEGIN
  -- Try referral_codes table first
  SELECT id, user_id INTO v_referral_code_id, v_referrer_id
  FROM referral_codes
  WHERE code = p_referral_code AND is_active = true;

  -- Fallback to affiliate_profiles
  IF v_referrer_id IS NULL THEN
    SELECT id INTO v_referrer_id
    FROM affiliate_profiles
    WHERE referral_code = p_referral_code;
  END IF;

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive referral code: %', p_referral_code;
  END IF;

  -- Check self-referral
  IF v_referrer_id = p_referred_id THEN
    RAISE EXCEPTION 'Cannot refer yourself';
  END IF;

  -- Check if user already has a referral
  SELECT id INTO v_existing_referral
  FROM referrals
  WHERE referred_id = p_referred_id;

  IF v_existing_referral IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a referral';
  END IF;

  -- Map referral_type to link_type for the new schema
  v_link_type := CASE
    WHEN p_referral_type IN ('dcs', 'affiliate') THEN 'dcs'
    ELSE 'learner'
  END;

  -- Create referral record using the NEW schema columns
  INSERT INTO referrals (referrer_id, referred_id, referral_code, link_type, initial_purchase_type, status)
  VALUES (v_referrer_id, p_referred_id, p_referral_code, v_link_type, 'learner', 'pending')
  RETURNING id INTO v_referral_id;

  -- Update referral code usage count
  IF v_referral_code_id IS NOT NULL THEN
    UPDATE referral_codes
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = v_referral_code_id;
  END IF;

  RETURN v_referral_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Ensure service role INSERT policies exist ─────────────────────────────
-- Without these, the service role client cannot insert referrals/commissions

-- Referrals: allow service role to insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'referrals' AND policyname = 'Service role full access on referrals'
  ) THEN
    CREATE POLICY "Service role full access on referrals" ON public.referrals
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Commissions: ensure service role insert policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'commissions' AND policyname = 'Service role can insert commissions'
  ) THEN
    CREATE POLICY "Service role can insert commissions" ON public.commissions
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Referral codes: ensure service role can read for lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'referral_codes' AND policyname = 'Anyone can read referral codes for validation'
  ) THEN
    CREATE POLICY "Anyone can read referral codes for validation" ON public.referral_codes
      FOR SELECT USING (true);
  END IF;
END $$;

-- ── 4. Grant execute on process_referral to authenticated users ──────────────
GRANT EXECUTE ON FUNCTION public.process_referral(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral(UUID, TEXT, TEXT) TO service_role;

DO $$ BEGIN RAISE NOTICE 'Referral functions and constraints fixed'; END $$;
