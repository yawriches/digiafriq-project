-- Fix referral system migration issues
-- This migration handles cases where tables exist but columns are missing

-- First, ensure referrals table exists
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  referral_type VARCHAR(20) NOT NULL CHECK (referral_type IN ('learner', 'affiliate')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Ensure one referral per referred user
  UNIQUE(referred_id),
  
  -- Ensure referrer and referred are different users
  CHECK (referrer_id != referred_id)
);

-- Add missing columns to commissions table if they don't exist
DO $$
BEGIN
  -- Check if commissions table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') THEN
    -- Add referral_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'referral_id') THEN
      ALTER TABLE commissions ADD COLUMN referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL;
    END IF;
    
    -- Add other missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'commission_type') THEN
      ALTER TABLE commissions ADD COLUMN commission_type VARCHAR(30) NOT NULL DEFAULT 'learner_referral' CHECK (commission_type IN ('learner_referral', 'affiliate_referral', 'learner_renewal'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'commission_rate') THEN
      ALTER TABLE commissions ADD COLUMN commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0000;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'base_amount') THEN
      ALTER TABLE commissions ADD COLUMN base_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'base_currency') THEN
      ALTER TABLE commissions ADD COLUMN base_currency VARCHAR(3) NOT NULL DEFAULT 'USD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'notes') THEN
      ALTER TABLE commissions ADD COLUMN notes TEXT;
    END IF;
  ELSE
    -- Create commissions table if it doesn't exist
    CREATE TABLE commissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
      payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
      commission_type VARCHAR(30) NOT NULL CHECK (commission_type IN ('learner_referral', 'affiliate_referral', 'learner_renewal')),
      commission_amount DECIMAL(12, 2) NOT NULL,
      commission_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      commission_rate DECIMAL(5, 4) NOT NULL,
      base_amount DECIMAL(12, 2) NOT NULL,
      base_currency VARCHAR(3) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ,
      notes TEXT,
      
      -- Ensure unique commission per payment
      UNIQUE(payment_id, commission_type)
    );
  END IF;
END $$;

-- Ensure referral_codes table exists
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT 1000,
  
  -- Ensure one active code per user
  UNIQUE(user_id, code)
);

-- Add expires_at column to referral_codes if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referral_codes') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_codes' AND column_name = 'expires_at') THEN
      ALTER TABLE referral_codes ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
    END IF;
  END IF;
END $$;
