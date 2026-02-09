-- Add missing columns to affiliate_profiles table
-- These columns were present in the original table but lost when the table was recreated
-- in migration 20241209000001_complete_affiliate_system.sql

ALTER TABLE affiliate_profiles
ADD COLUMN IF NOT EXISTS affiliate_level TEXT DEFAULT 'Starter';

ALTER TABLE affiliate_profiles
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 100.00;

ALTER TABLE affiliate_profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add check constraint for status (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliate_profiles_status_check'
  ) THEN
    ALTER TABLE affiliate_profiles
    ADD CONSTRAINT affiliate_profiles_status_check
    CHECK (status IN ('active', 'inactive', 'suspended'));
  END IF;
END $$;
