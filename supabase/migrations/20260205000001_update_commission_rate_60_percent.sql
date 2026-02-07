-- Update commission calculation to use 60% rate for AI Cashflow program
-- This replaces the previous 80% rate

-- Update calculate_commission function
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
  
  -- Calculate commission based on type - 60% for AI Cashflow program
  CASE p_commission_type
    WHEN 'learner_referral' THEN
      -- 60% of AI Cashflow program fee
      v_commission_rate := 0.6000;
      v_commission_amount := v_base_amount * v_commission_rate;
      
    WHEN 'affiliate_referral' THEN
      -- 60% of AI Cashflow program fee
      v_commission_rate := 0.6000;
      v_commission_amount := v_base_amount * v_commission_rate;
      
    WHEN 'learner_renewal' THEN
      -- 20% of learner fee (only if affiliate has active learner membership)
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

-- Update create_commission function
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
  
  -- Get commission rate - 60% for AI Cashflow program
  CASE p_commission_type
    WHEN 'learner_referral', 'affiliate_referral' THEN
      v_commission_rate := 0.6000;
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
