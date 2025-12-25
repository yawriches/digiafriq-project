-- Complete Affiliate System Migration
-- This creates a bulletproof affiliate system with proper tracking, commissions, and payouts

-- Drop existing tables if they exist to rebuild cleanly
DROP TABLE IF EXISTS payout_commissions CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS commissions CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS affiliate_links CASCADE;
DROP TABLE IF EXISTS affiliate_profiles CASCADE;

-- Create affiliate_profiles table
CREATE TABLE affiliate_profiles (
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

-- Create affiliate_links table for tracking link clicks
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('learner', 'dcs')),
  visitor_ip TEXT,
  visitor_country TEXT,
  visitor_device TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ
);

-- Create referrals table with proper tracking
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('learner', 'dcs')),
  initial_purchase_type VARCHAR(30) CHECK (initial_purchase_type IN ('learner', 'learner_dcs')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Ensure one referral per referred user
  UNIQUE(referred_id),
  -- Ensure referrer and referred are different
  CHECK (referrer_id != referred_id)
);

-- Create commissions table with detailed tracking
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  commission_type VARCHAR(30) NOT NULL CHECK (commission_type IN (
    'learner_initial',      -- 80% of learner membership
    'dcs_addon',           -- $2 from DCS addon
    'learner_renewal'      -- 20% of learner renewal
  )),
  base_amount DECIMAL(12, 2) NOT NULL,
  base_currency VARCHAR(3) NOT NULL,
  commission_rate DECIMAL(5, 4),
  commission_amount DECIMAL(12, 2) NOT NULL,
  commission_currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  payout_id UUID,
  notes TEXT,
  
  -- Prevent duplicate commissions
  UNIQUE(payment_id, commission_type)
);

-- Create payouts table
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method VARCHAR(20) NOT NULL CHECK (payout_method IN ('bank', 'mobile_money')),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  mobile_money_provider TEXT,
  mobile_money_number TEXT,
  reference VARCHAR(50) UNIQUE,
  transaction_id TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  notes TEXT
);

-- Create payout_commissions junction table
CREATE TABLE payout_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  commission_id UUID NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  UNIQUE(payout_id, commission_id)
);

-- Create indexes for performance
CREATE INDEX idx_affiliate_profiles_referral_code ON affiliate_profiles(referral_code);
CREATE INDEX idx_affiliate_links_affiliate_id ON affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_clicked_at ON affiliate_links(clicked_at);
CREATE INDEX idx_affiliate_links_converted ON affiliate_links(converted);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX idx_commissions_referral_id ON commissions(referral_id);
CREATE INDEX idx_commissions_payment_id ON commissions(payment_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_payouts_affiliate_id ON payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Enable RLS
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_profiles
CREATE POLICY "Users can view their own affiliate profile" ON affiliate_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own affiliate profile" ON affiliate_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all affiliate profiles" ON affiliate_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for affiliate_links
CREATE POLICY "Affiliates can view their own links" ON affiliate_links
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "Service role can manage all links" ON affiliate_links
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Service role can manage all referrals" ON referrals
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for commissions
CREATE POLICY "Affiliates can view their own commissions" ON commissions
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "Service role can manage all commissions" ON commissions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for payouts
CREATE POLICY "Affiliates can view their own payouts" ON payouts
  FOR SELECT USING (auth.uid() = affiliate_id);

CREATE POLICY "Affiliates can request payouts" ON payouts
  FOR INSERT WITH CHECK (auth.uid() = affiliate_id);

CREATE POLICY "Service role can manage all payouts" ON payouts
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for payout_commissions
CREATE POLICY "Affiliates can view their payout commissions" ON payout_commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payouts 
      WHERE payouts.id = payout_commissions.payout_id 
      AND payouts.affiliate_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all payout commissions" ON payout_commissions
  FOR ALL USING (auth.role() = 'service_role');

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Check if code exists
    EXIT WHEN NOT EXISTS (SELECT 1 FROM affiliate_profiles WHERE referral_code = code);
    
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique referral code';
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create affiliate profile when user gets DCS addon
CREATE OR REPLACE FUNCTION create_affiliate_profile_on_dcs()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_base_url TEXT := 'https://digiafriq.com'; -- Change to actual domain
BEGIN
  -- Only create if user has DCS addon and no existing affiliate profile
  IF NEW.has_digital_cashflow_addon = TRUE AND OLD.has_digital_cashflow_addon = FALSE THEN
    -- Check if affiliate profile already exists
    IF NOT EXISTS (SELECT 1 FROM affiliate_profiles WHERE id = NEW.user_id) THEN
      -- Generate unique referral code
      v_referral_code := generate_unique_referral_code();
      
      -- Create affiliate profile
      INSERT INTO affiliate_profiles (
        id,
        referral_code,
        learner_link,
        dcs_link
      ) VALUES (
        NEW.user_id,
        v_referral_code,
        v_base_url || '/join/learner?ref=' || v_referral_code,
        v_base_url || '/join/dcs?ref=' || v_referral_code
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic affiliate profile creation
CREATE TRIGGER create_affiliate_on_dcs_purchase
  AFTER UPDATE ON user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION create_affiliate_profile_on_dcs();

-- Function to process commission for a payment
CREATE OR REPLACE FUNCTION process_payment_commission(
  p_payment_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_currency VARCHAR(3),
  p_is_renewal BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_referral RECORD;
  v_referrer_membership RECORD;
  v_commission_amount DECIMAL;
  v_commission_type VARCHAR(30);
  v_has_dcs BOOLEAN;
BEGIN
  -- Get referral information
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = p_user_id
  AND status = 'completed';
  
  -- No referral, no commission
  IF v_referral IS NULL THEN
    RETURN;
  END IF;
  
  -- Check referrer's membership status
  SELECT 
    um.*,
    um.has_digital_cashflow_addon as has_dcs
  INTO v_referrer_membership
  FROM user_memberships um
  WHERE um.user_id = v_referral.referrer_id
  AND um.is_active = TRUE
  AND um.expires_at > NOW()
  ORDER BY um.created_at DESC
  LIMIT 1;
  
  -- Referrer must have active membership with DCS
  IF v_referrer_membership IS NULL OR NOT v_referrer_membership.has_dcs THEN
    RETURN;
  END IF;
  
  -- Determine commission type and amount
  IF p_is_renewal THEN
    -- Renewal: 20% commission
    v_commission_type := 'learner_renewal';
    v_commission_amount := p_amount * 0.20;
  ELSE
    -- Initial purchase: Check what was purchased
    IF v_referral.initial_purchase_type = 'learner_dcs' THEN
      -- They bought learner + DCS: 80% of learner + $2
      -- This function handles the learner portion
      v_commission_type := 'learner_initial';
      -- Assuming learner portion is (amount - 7) for DCS bundle
      v_commission_amount := (p_amount - 7) * 0.80;
      
      -- Create additional commission for DCS addon
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
        notes
      ) VALUES (
        v_referral.referrer_id,
        v_referral.id,
        p_payment_id,
        'dcs_addon',
        7.00,
        p_currency,
        0.2857, -- $2 out of $7
        2.00,
        p_currency,
        'available',
        '$2 commission for DCS addon referral'
      );
    ELSE
      -- They bought learner only: 80% commission
      v_commission_type := 'learner_initial';
      v_commission_amount := p_amount * 0.80;
    END IF;
  END IF;
  
  -- Create main commission record
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
    notes
  ) VALUES (
    v_referral.referrer_id,
    v_referral.id,
    p_payment_id,
    v_commission_type,
    p_amount,
    p_currency,
    CASE 
      WHEN v_commission_type = 'learner_renewal' THEN 0.20
      ELSE 0.80
    END,
    v_commission_amount,
    p_currency,
    'available',
    CASE 
      WHEN v_commission_type = 'learner_renewal' THEN 'Renewal commission'
      ELSE 'Initial purchase commission'
    END
  );
  
  -- Update affiliate profile balance
  UPDATE affiliate_profiles
  SET 
    available_balance = available_balance + v_commission_amount,
    total_earnings = total_earnings + v_commission_amount
  WHERE id = v_referral.referrer_id;
  
END;
$$ LANGUAGE plpgsql;

-- Function to validate referrer eligibility
CREATE OR REPLACE FUNCTION is_referrer_eligible(p_referrer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_membership BOOLEAN;
BEGIN
  -- Check if referrer has active membership with DCS addon
  SELECT EXISTS (
    SELECT 1 
    FROM user_memberships
    WHERE user_id = p_referrer_id
    AND is_active = TRUE
    AND has_digital_cashflow_addon = TRUE
    AND expires_at > NOW()
  ) INTO v_has_active_membership;
  
  RETURN v_has_active_membership;
END;
$$ LANGUAGE plpgsql;

-- Function to track affiliate link click
CREATE OR REPLACE FUNCTION track_affiliate_click(
  p_referral_code TEXT,
  p_link_type VARCHAR(20),
  p_visitor_ip TEXT DEFAULT NULL,
  p_visitor_country TEXT DEFAULT NULL,
  p_visitor_device TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_affiliate_id UUID;
  v_click_id UUID;
BEGIN
  -- Get affiliate ID from referral code
  SELECT id INTO v_affiliate_id
  FROM affiliate_profiles
  WHERE referral_code = p_referral_code;
  
  IF v_affiliate_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Record the click
  INSERT INTO affiliate_links (
    affiliate_id,
    link_type,
    visitor_ip,
    visitor_country,
    visitor_device
  ) VALUES (
    v_affiliate_id,
    p_link_type,
    p_visitor_ip,
    p_visitor_country,
    p_visitor_device
  ) RETURNING id INTO v_click_id;
  
  RETURN v_click_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON SCHEMA public IS 'Complete affiliate system with bulletproof tracking and commissions';
