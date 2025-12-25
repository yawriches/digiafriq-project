-- Quick fix: Create just the affiliate_profiles table without running full migration
-- Run this in Supabase SQL Editor if you can't run the full migration yet

-- Create affiliate_profiles table
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  learner_link TEXT NOT NULL,
  dcs_link TEXT NOT NULL,
  total_earnings DECIMAL(12, 2) DEFAULT 0.00,
  available_balance DECIMAL(12, 2) DEFAULT 0.00,
  lifetime_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  mobile_money_provider TEXT,
  mobile_money_number TEXT,
  payout_method VARCHAR(20) CHECK (payout_method IN ('bank', 'mobile_money')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own affiliate profile"
  ON affiliate_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own affiliate profile"
  ON affiliate_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own affiliate profile"
  ON affiliate_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index on referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_referral_code 
  ON affiliate_profiles(referral_code);

-- Create index on user id
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_id 
  ON affiliate_profiles(id);

COMMENT ON TABLE affiliate_profiles IS 'Stores affiliate program data for users with DCS addon';
