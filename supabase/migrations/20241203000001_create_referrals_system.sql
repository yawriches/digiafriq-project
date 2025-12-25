-- Create referrals system for affiliate tracking
-- This migration creates tables for tracking referrals and commissions

-- Create referrals table to track referral relationships
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

-- Create commissions table to track affiliate earnings
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  commission_type VARCHAR(30) NOT NULL CHECK (commission_type IN ('learner_referral', 'affiliate_referral', 'learner_renewal')),
  commission_amount DECIMAL(12, 2) NOT NULL,
  commission_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  commission_rate DECIMAL(5, 4) NOT NULL, -- e.g., 0.8000 for 80%
  base_amount DECIMAL(12, 2) NOT NULL, -- original payment amount
  base_currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Ensure unique commission per payment
  UNIQUE(payment_id, commission_type)
);

-- Create referral_codes table for managing affiliate referral codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT 1000, -- prevent abuse
  
  -- Ensure one active code per user
  UNIQUE(user_id, code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_type ON referrals(referral_type);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referral_id ON commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_id ON commissions(payment_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON commissions(commission_type);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals (both sent and received)" ON referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR 
    auth.uid() = referred_id
  );

CREATE POLICY "Users can insert referrals they are the referrer for" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND active_role = 'admin'
    )
  );

-- RLS Policies for commissions
CREATE POLICY "Users can view their own commissions" ON commissions
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "Admins can view all commissions" ON commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND active_role = 'admin'
    )
  );

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all referral codes" ON referral_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND active_role = 'admin'
    )
  );

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(encode(gen_random_bytes(32), 'base64'), 1, 8));
    -- Remove special characters that might be confusing
    code := regexp_replace(code, '[+/=]', '', 'g');
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM referral_codes WHERE code = code) THEN
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique referral code after % attempts', max_attempts;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for user
CREATE OR REPLACE FUNCTION create_user_referral_code(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_code TEXT;
  v_referral_code_id UUID;
BEGIN
  -- Generate unique code
  v_code := generate_referral_code();
  
  -- Create referral code record
  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, v_code)
  RETURNING id INTO v_referral_code_id;
  
  RETURN v_referral_code_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate referral code and create referral
CREATE OR REPLACE FUNCTION process_referral(p_referred_id UUID, p_referral_code TEXT, p_referral_type TEXT)
RETURNS UUID AS $$
DECLARE
  v_referral_code_id UUID;
  v_referrer_id UUID;
  v_referral_id UUID;
  v_existing_referral UUID;
BEGIN
  -- Validate referral code
  SELECT id, user_id INTO v_referral_code_id, v_referrer_id
  FROM referral_codes 
  WHERE code = p_referral_code AND is_active = true;
  
  IF v_referral_code_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive referral code';
  END IF;
  
  -- Check if user already has a referral
  SELECT id INTO v_existing_referral
  FROM referrals 
  WHERE referred_id = p_referred_id;
  
  IF v_existing_referral IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a referral';
  END IF;
  
  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, referral_type)
  VALUES (v_referrer_id, p_referred_id, p_referral_code, p_referral_type)
  RETURNING id INTO v_referral_id;
  
  -- Update referral code usage
  UPDATE referral_codes 
  SET usage_count = usage_count + 1, 
      last_used_at = NOW()
  WHERE id = v_referral_code_id;
  
  RETURN v_referral_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission based on payment and referral
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
  v_base_amount DECIMAL(12, 2);
  v_base_currency VARCHAR(3);
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
  
  -- Set base amount and currency
  v_base_amount := v_payment.amount;
  v_base_currency := v_payment.currency;
  
  -- Calculate commission based on type
  CASE p_commission_type
    WHEN 'learner_referral' THEN
      -- 80% of learner fee
      v_commission_rate := 0.8000;
      v_commission_amount := v_base_amount * v_commission_rate;
      
    WHEN 'affiliate_referral' THEN
      -- 80% of learner fee + $2 of affiliate upgrade fee
      -- Note: This will be handled in two separate commission records
      v_commission_rate := 0.8000;
      v_commission_amount := v_base_amount * v_commission_rate;
      
    WHEN 'learner_renewal' THEN
      -- 20% of learner fee (only if affiliate has active learner membership)
      -- Check if referrer has active learner membership
      IF EXISTS (
        SELECT 1 FROM user_memberships 
        WHERE user_id = v_referral.referrer_id 
        AND membership_type = 'learner' 
        AND status = 'active'
        AND expires_at > NOW()
      ) THEN
        v_commission_rate := 0.2000;
        v_commission_amount := v_base_amount * v_commission_rate;
      ELSE
        v_commission_amount := 0;
      END IF;
      
    ELSE
      RAISE EXCEPTION 'Invalid commission type: %', p_commission_type;
  END CASE;
  
  RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to create commission record
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
BEGIN
  -- Get payment details
  SELECT * INTO v_payment
  FROM payments 
  WHERE id = p_payment_id;
  
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  -- Calculate commission
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
  
  -- Create commission record
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
    v_commission_amount,
    v_payment.currency,
    v_commission_rate,
    v_payment.amount,
    v_payment.currency,
    p_notes
  )
  RETURNING id INTO v_commission_id;
  
  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create referral codes for new affiliates
CREATE OR REPLACE FUNCTION create_referral_code_for_new_affiliate()
RETURNS TRIGGER AS $$
BEGIN
  -- Create referral code for new affiliate users
  IF NEW.active_role = 'affiliate' OR 'affiliate' = ANY(NEW.available_roles) THEN
    PERFORM create_user_referral_code(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_referral_code_for_new_affiliate
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_code_for_new_affiliate();
