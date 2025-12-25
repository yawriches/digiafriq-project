-- Migration: Calculate commissions in base currency (USD)
-- This ensures all commissions are calculated and stored in USD regardless of payment currency

-- Create currency_rates table if it doesn't exist
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate DECIMAL(10,6) NOT NULL,
    is_fixed BOOLEAN DEFAULT TRUE,
    provider TEXT,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, valid_from)
);

-- Delete existing rates to avoid conflicts, then insert fresh rates
DELETE FROM currency_rates WHERE to_currency = 'USD';

-- Insert current exchange rates (as of Dec 2024)
-- Rate = 1 / (1 USD in local currency) = how much USD you get for 1 unit of local currency
INSERT INTO currency_rates (from_currency, to_currency, rate, is_fixed, provider)
VALUES 
  ('GHS', 'USD', 0.1000, TRUE, 'manual'),    -- 1 GHS = 0.10 USD (1 USD = 10 GHS)
  ('NGN', 'USD', 0.001172, TRUE, 'manual'),  -- 1 NGN = 0.001172 USD (1 USD = 852.94 NGN)
  ('KES', 'USD', 0.007727, TRUE, 'manual'),  -- 1 KES = 0.007727 USD (1 USD = 129.4 KES)
  ('ZAR', 'USD', 0.058824, TRUE, 'manual'),  -- 1 ZAR = 0.058824 USD (1 USD = 17 ZAR)
  ('XOF', 'USD', 0.001786, TRUE, 'manual'),  -- 1 XOF = 0.001786 USD (1 USD = 560 XOF)
  ('XAF', 'USD', 0.001786, TRUE, 'manual'),  -- 1 XAF = 0.001786 USD (1 USD = 560 XAF)
  ('USD', 'USD', 1.0, TRUE, 'manual');       -- 1 USD = 1 USD

-- Drop ALL existing commission functions to avoid conflicts (multiple signatures may exist)
-- Use CASCADE to handle any dependencies
DO $$
DECLARE
  func_record RECORD;
BEGIN
  -- Drop all create_commission functions
  FOR func_record IN 
    SELECT oid::regprocedure as func_signature
    FROM pg_proc 
    WHERE proname = 'create_commission'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
  END LOOP;
  
  -- Drop all calculate_commission functions
  FOR func_record IN 
    SELECT oid::regprocedure as func_signature
    FROM pg_proc 
    WHERE proname = 'calculate_commission'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
  END LOOP;
END $$;

-- Function to convert amount to USD
CREATE OR REPLACE FUNCTION convert_to_usd(
  p_amount DECIMAL(12, 2),
  p_currency TEXT
)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_rate DECIMAL(10, 4);
  v_usd_amount DECIMAL(12, 2);
BEGIN
  -- If already USD, return as is
  IF UPPER(p_currency) = 'USD' THEN
    RETURN p_amount;
  END IF;
  
  -- Get the conversion rate from currency_rates table
  SELECT rate INTO v_rate
  FROM currency_rates
  WHERE from_currency = UPPER(p_currency)
    AND to_currency = 'USD'
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY valid_from DESC
  LIMIT 1;
  
  -- If no rate found, use fallback rates (Dec 2024)
  IF v_rate IS NULL THEN
    CASE UPPER(p_currency)
      WHEN 'GHS' THEN v_rate := 0.1000;    -- 1 USD = 10 GHS
      WHEN 'NGN' THEN v_rate := 0.001172;  -- 1 USD = 852.94 NGN
      WHEN 'KES' THEN v_rate := 0.007727;  -- 1 USD = 129.4 KES
      WHEN 'ZAR' THEN v_rate := 0.058824;  -- 1 USD = 17 ZAR
      WHEN 'XOF' THEN v_rate := 0.001786;  -- 1 USD = 560 XOF
      WHEN 'XAF' THEN v_rate := 0.001786;  -- 1 USD = 560 XAF
      ELSE v_rate := 1.0; -- Default to 1:1 if unknown currency
    END CASE;
  END IF;
  
  -- Calculate USD amount
  v_usd_amount := p_amount * v_rate;
  
  RETURN ROUND(v_usd_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- Updated function to calculate commission in USD (base currency)
CREATE OR REPLACE FUNCTION calculate_commission(
  p_payment_id UUID,
  p_referral_id UUID,
  p_commission_type TEXT
)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_payment RECORD;
  v_referral RECORD;
  v_commission_amount DECIMAL(12, 2) := 0;
  v_commission_rate DECIMAL(5, 4) := 0;
  v_usd_amount DECIMAL(12, 2);
BEGIN
  -- Get payment details
  SELECT * INTO v_payment
  FROM payments 
  WHERE id = p_payment_id;
  
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  -- Get referral details
  SELECT * INTO v_referral
  FROM referrals 
  WHERE id = p_referral_id;
  
  IF v_referral IS NULL THEN
    RAISE EXCEPTION 'Referral not found';
  END IF;
  
  -- Use base_currency_amount directly (already in USD from payment initialization)
  -- Default to 10 USD if not set (standard learner membership price)
  v_usd_amount := COALESCE(v_payment.base_currency_amount, 10);
  
  RAISE NOTICE 'Commission calculation: Base amount = % USD', v_usd_amount;
  
  -- Calculate commission based on type (using USD amount)
  CASE p_commission_type
    WHEN 'learner_referral' THEN
      -- 80% of learner fee in USD
      v_commission_rate := 0.8000;
      v_commission_amount := v_usd_amount * v_commission_rate;
      
    WHEN 'affiliate_referral' THEN
      -- 80% of learner fee in USD + $2 of affiliate upgrade fee
      -- Note: The $2 is handled in a separate commission record
      v_commission_rate := 0.8000;
      v_commission_amount := v_usd_amount * v_commission_rate;
      
    WHEN 'learner_renewal' THEN
      -- 20% of learner fee in USD (only if affiliate has active learner membership)
      IF EXISTS (
        SELECT 1 FROM user_memberships 
        WHERE user_id = v_referral.referrer_id 
        AND membership_type = 'learner' 
        AND status = 'active'
        AND expires_at > NOW()
      ) THEN
        v_commission_rate := 0.2000;
        v_commission_amount := v_usd_amount * v_commission_rate;
      ELSE
        v_commission_amount := 0;
      END IF;
      
    ELSE
      RAISE EXCEPTION 'Invalid commission type: %', p_commission_type;
  END CASE;
  
  RAISE NOTICE 'Commission calculated: % USD (rate: %)', v_commission_amount, v_commission_rate;
  
  RETURN ROUND(v_commission_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- Updated function to create commission record in USD
CREATE OR REPLACE FUNCTION create_commission(
  p_affiliate_id UUID,
  p_referral_id UUID,
  p_payment_id UUID,
  p_commission_type TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
  v_commission_amount DECIMAL(12, 2);
  v_commission_rate DECIMAL(5, 4);
  v_payment RECORD;
  v_usd_amount DECIMAL(12, 2);
BEGIN
  -- Get payment details
  SELECT * INTO v_payment
  FROM payments 
  WHERE id = p_payment_id;
  
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  -- Calculate commission (now returns USD amount)
  v_commission_amount := calculate_commission(p_payment_id, p_referral_id, p_commission_type);
  
  -- Get commission rate
  CASE p_commission_type
    WHEN 'learner_referral', 'affiliate_referral' THEN
      v_commission_rate := 0.8000;
    WHEN 'learner_renewal' THEN
      v_commission_rate := 0.2000;
    ELSE
      v_commission_rate := 0;
  END CASE;
  
  -- Use base_currency_amount directly (already in USD from payment initialization)
  -- Default to 10 USD if not set (standard learner membership price)
  v_usd_amount := COALESCE(v_payment.base_currency_amount, 10);
  
  -- Create commission record with USD amounts
  INSERT INTO commissions (
    affiliate_id, 
    referral_id, 
    payment_id, 
    commission_type, 
    commission_amount, 
    commission_currency,
    commission_rate,
    base_amount,
    base_currency,
    notes
  )
  VALUES (
    p_affiliate_id,
    p_referral_id,
    p_payment_id,
    p_commission_type,
    v_commission_amount,  -- Commission in USD
    'USD',                -- Commission currency is always USD now
    v_commission_rate,
    v_usd_amount,         -- Base amount in USD
    'USD',                -- Base currency is always USD
    p_notes
  )
  RETURNING id INTO v_commission_id;
  
  RAISE NOTICE 'Commission created: % USD for affiliate %', v_commission_amount, p_affiliate_id;
  
  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the change
COMMENT ON FUNCTION calculate_commission IS 'Calculates commission amount in USD (base currency) regardless of payment currency';
COMMENT ON FUNCTION create_commission IS 'Creates commission record with amounts in USD (base currency)';
COMMENT ON FUNCTION convert_to_usd IS 'Converts an amount from any supported currency to USD';
