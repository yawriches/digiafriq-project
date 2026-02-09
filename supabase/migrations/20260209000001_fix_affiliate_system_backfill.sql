-- ============================================================================
-- Fix Affiliate System: Recreate referral_codes table & backfill data
-- ============================================================================
-- The migration 20241209000001 dropped referral_codes but never recreated it.
-- This migration:
--   1. Recreates the referral_codes table
--   2. Backfills affiliate_profiles for existing affiliates (from profiles table)
--   3. Syncs referral_codes from affiliate_profiles
--   4. Backfills referrals & commissions from payments with referral metadata
--   5. Fixes the process_referral function for the current schema
-- ============================================================================

-- ── 1. Recreate referral_codes table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT 1000,
  UNIQUE(user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can view their own referral codes') THEN
    CREATE POLICY "Users can view their own referral codes" ON referral_codes
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can insert their own referral codes') THEN
    CREATE POLICY "Users can insert their own referral codes" ON referral_codes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Users can update their own referral codes') THEN
    CREATE POLICY "Users can update their own referral codes" ON referral_codes
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_codes' AND policyname = 'Service role full access on referral_codes') THEN
    CREATE POLICY "Service role full access on referral_codes" ON referral_codes
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- ── 2. Backfill affiliate_profiles for existing affiliates ───────────────────
-- Find users who are affiliates (by role) but don't have an affiliate_profiles row
DO $$
DECLARE
  r RECORD;
  v_code TEXT;
  v_base_url TEXT := 'https://digiafriq.com';
BEGIN
  FOR r IN
    SELECT p.id
    FROM profiles p
    WHERE (
      p.role = 'affiliate'
      OR p.active_role = 'affiliate'
      OR p.available_roles::text LIKE '%affiliate%'
      OR p.affiliate_onboarding_completed = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM affiliate_profiles ap WHERE ap.id = p.id
    )
  LOOP
    -- Generate a unique referral code
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM affiliate_profiles WHERE referral_code = v_code) LOOP
      v_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
    END LOOP;

    INSERT INTO affiliate_profiles (
      id, referral_code, learner_link, dcs_link,
      total_earnings, available_balance, lifetime_referrals, active_referrals,
      created_at, updated_at
    ) VALUES (
      r.id, v_code,
      v_base_url || '/join/learner?ref=' || v_code,
      v_base_url || '/join/dcs?ref=' || v_code,
      0.00, 0.00, 0, 0,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created affiliate_profile for user % with code %', r.id, v_code;
  END LOOP;
END $$;

-- ── 3. Sync referral_codes from affiliate_profiles ───────────────────────────
-- For every affiliate_profile that has a referral_code, ensure a matching
-- referral_codes row exists so the guest-verify lookup works.
INSERT INTO referral_codes (user_id, code, is_active, created_at)
SELECT ap.id, ap.referral_code, true, COALESCE(ap.created_at, NOW())
FROM affiliate_profiles ap
WHERE ap.referral_code IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM referral_codes rc WHERE rc.code = ap.referral_code
  )
ON CONFLICT (code) DO NOTHING;

-- ── 4. Backfill referrals from payments with referral metadata ───────────────
-- Payments that have metadata.referral_code indicate a referral sale happened
-- but the referral record may be missing.
DO $$
DECLARE
  r RECORD;
  v_referrer_id UUID;
BEGIN
  FOR r IN
    SELECT
      p.id AS payment_id,
      p.user_id AS referred_id,
      p.metadata->>'referral_code' AS ref_code,
      p.amount,
      p.currency,
      p.created_at,
      COALESCE(p.metadata->>'base_currency_amount', p.amount::text) AS base_amount
    FROM payments p
    WHERE p.status = 'completed'
      AND p.metadata->>'referral_code' IS NOT NULL
      AND p.metadata->>'referral_code' != ''
  LOOP
    -- Find the referrer from referral_codes or affiliate_profiles
    SELECT user_id INTO v_referrer_id
    FROM referral_codes
    WHERE code = r.ref_code AND is_active = true
    LIMIT 1;

    IF v_referrer_id IS NULL THEN
      SELECT id INTO v_referrer_id
      FROM affiliate_profiles
      WHERE referral_code = r.ref_code
      LIMIT 1;
    END IF;

    IF v_referrer_id IS NULL THEN
      RAISE NOTICE 'No referrer found for code %, skipping payment %', r.ref_code, r.payment_id;
      CONTINUE;
    END IF;

    -- Skip if referrer = referred (self-referral)
    IF v_referrer_id = r.referred_id THEN
      RAISE NOTICE 'Self-referral detected for payment %, skipping', r.payment_id;
      CONTINUE;
    END IF;

    -- Create referral if it doesn't exist for this referred user
    BEGIN
      INSERT INTO referrals (
        referrer_id, referred_id, referral_code,
        link_type, initial_purchase_type,
        status, completed_at, created_at
      ) VALUES (
        v_referrer_id, r.referred_id, r.ref_code,
        'learner', 'learner',
        'completed', r.created_at, r.created_at
      )
      ON CONFLICT (referred_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create referral for payment %: %', r.payment_id, SQLERRM;
    END;

    -- Create commission if it doesn't exist for this payment
    BEGIN
      INSERT INTO commissions (
        affiliate_id,
        referral_id,
        payment_id,
        commission_type,
        base_amount,
        base_currency,
        commission_rate,
        commission_amount,
        commission_currency,
        status,
        created_at,
        notes
      )
      SELECT
        v_referrer_id,
        ref.id,
        r.payment_id,
        'learner_referral',
        COALESCE(r.base_amount::numeric, r.amount),
        COALESCE(r.currency, 'USD'),
        0.5978,
        COALESCE(r.base_amount::numeric, r.amount) * 0.5978,
        'USD',
        'available',
        r.created_at,
        'Backfilled commission (59.78%)'
      FROM referrals ref
      WHERE ref.referred_id = r.referred_id
        AND ref.referrer_id = v_referrer_id
      LIMIT 1
      ON CONFLICT (payment_id, commission_type) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create commission for payment %: %', r.payment_id, SQLERRM;
    END;

    RAISE NOTICE 'Processed referral payment % for referrer %', r.payment_id, v_referrer_id;
  END LOOP;
END $$;

-- ── 5. Update affiliate_profiles stats from commissions ──────────────────────
UPDATE affiliate_profiles ap
SET
  total_earnings = COALESCE(stats.total_earned, 0),
  available_balance = COALESCE(stats.available_earned, 0),
  lifetime_referrals = COALESCE(stats.referral_count, 0),
  active_referrals = COALESCE(stats.referral_count, 0),
  updated_at = NOW()
FROM (
  SELECT
    c.affiliate_id,
    SUM(c.commission_amount) AS total_earned,
    SUM(CASE WHEN c.status IN ('available', 'pending') THEN c.commission_amount ELSE 0 END) AS available_earned,
    COUNT(DISTINCT c.referral_id) AS referral_count
  FROM commissions c
  GROUP BY c.affiliate_id
) stats
WHERE ap.id = stats.affiliate_id;

-- ── 6. Update referral_codes usage counts ────────────────────────────────────
UPDATE referral_codes rc
SET
  usage_count = COALESCE(stats.ref_count, 0),
  last_used_at = stats.last_used
FROM (
  SELECT
    r.referral_code AS code,
    COUNT(*) AS ref_count,
    MAX(r.created_at) AS last_used
  FROM referrals r
  GROUP BY r.referral_code
) stats
WHERE rc.code = stats.code;

-- ── 7. Recreate trigger for auto-creating referral_codes for new affiliates ──
CREATE OR REPLACE FUNCTION create_referral_code_for_new_affiliate()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
BEGIN
  IF NEW.active_role = 'affiliate'
     OR NEW.affiliate_onboarding_completed = true
     OR 'affiliate' = ANY(NEW.available_roles)
  THEN
    -- Only create if no referral_code exists yet
    IF NOT EXISTS (SELECT 1 FROM referral_codes WHERE user_id = NEW.id) THEN
      v_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
      
      WHILE EXISTS (SELECT 1 FROM referral_codes WHERE code = v_code) LOOP
        v_code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
      END LOOP;

      INSERT INTO referral_codes (user_id, code, is_active)
      VALUES (NEW.id, v_code, true)
      ON CONFLICT (user_id, code) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_referral_code_for_new_affiliate ON profiles;
CREATE TRIGGER trigger_create_referral_code_for_new_affiliate
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_new_affiliate();

-- ── 8. Ensure the commission stats trigger exists ────────────────────────────
CREATE OR REPLACE FUNCTION public.update_affiliate_stats_on_commission()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.affiliate_profiles
  SET 
    total_earnings = total_earnings + NEW.commission_amount,
    available_balance = CASE 
      WHEN NEW.status = 'available' THEN available_balance + NEW.commission_amount
      ELSE available_balance
    END,
    lifetime_referrals = lifetime_referrals + 1,
    active_referrals = active_referrals + 1,
    updated_at = now()
  WHERE id = NEW.affiliate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON public.commissions;
CREATE TRIGGER trigger_update_affiliate_stats
  AFTER INSERT ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_affiliate_stats_on_commission();

DO $$ BEGIN RAISE NOTICE 'Affiliate system fix complete'; END $$;
