-- ============================================================================
-- NUKE ALL OLD COMMISSION LOGIC FROM THE DATABASE
-- ============================================================================
-- Commissions are now handled EXCLUSIVELY by the centralized processor in:
--   src/lib/commissions/process-commission.ts
-- This migration removes every trigger and function that could create
-- duplicate or incorrect commission entries.
-- ============================================================================

-- ── 1. Drop ALL triggers on the payments table that could create commissions ──
DROP TRIGGER IF EXISTS create_commission_trigger ON payments;
DROP TRIGGER IF EXISTS create_commission ON payments;
DROP TRIGGER IF EXISTS trigger_create_commission ON payments;
DROP TRIGGER IF EXISTS on_payment_completed ON payments;
DROP TRIGGER IF EXISTS after_payment_update ON payments;
DROP TRIGGER IF EXISTS payment_commission_trigger ON payments;

-- ── 2. Drop the old TRIGGER version of create_commission() (no args) ──
--    CASCADE will also remove any triggers that depend on it.
DROP FUNCTION IF EXISTS public.create_commission() CASCADE;

-- ── 3. Drop the RPC version of create_commission(UUID,UUID,UUID,TEXT,TEXT) ──
--    This was called by referrals.ts and used the old 80% rate.
DROP FUNCTION IF EXISTS public.create_commission(UUID, UUID, UUID, TEXT, TEXT) CASCADE;

-- ── 4. Drop calculate_commission — no longer needed, rate is in app code ──
DROP FUNCTION IF EXISTS public.calculate_commission(UUID, UUID, TEXT) CASCADE;

-- ── 5. Drop process_payment_commission — old RPC with 80%/$2 logic ──
DROP FUNCTION IF EXISTS public.process_payment_commission(UUID, UUID, DECIMAL, VARCHAR, BOOLEAN) CASCADE;

-- ── 6. Drop convert_to_usd if it exists (was used by old commission functions) ──
DROP FUNCTION IF EXISTS public.convert_to_usd(DECIMAL, VARCHAR) CASCADE;

-- ── 7. Keep the trigger_update_affiliate_stats trigger on commissions table ──
--    This one is FINE — it just updates affiliate_profiles.total_earnings
--    when a commission row is inserted. It does NOT create commissions.
--    (Defined in 20241209100000_fix_commission_types_and_affiliate_links.sql)

-- ── 8. Verify: list all remaining triggers on payments ──
-- Run this SELECT manually in the SQL editor to confirm cleanup:
-- SELECT tgname, tgrelid::regclass, tgenabled
-- FROM pg_trigger
-- WHERE tgrelid = 'payments'::regclass AND NOT tgisinternal;
