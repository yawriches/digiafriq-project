-- Update commission calculation to use 59.78% rate for AI Cashflow program
-- This replaces the previous 60% rate

-- Update calculate_commission function
CREATE OR REPLACE FUNCTION calculate_commission(
  p_payment_id UUID,
  p_referral_id UUID,
  p_commission_type TEXT
) RETURNS NUMERIC AS $$
DECLARE
  v_payment RECORD;
  v_base_amount NUMERIC;
  v_base_currency TEXT;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  v_base_amount := v_payment.amount;
  v_base_currency := v_payment.currency;
  
  -- Calculate commission based on type - 59.78% for AI Cashflow program
  CASE p_commission_type
    WHEN 'learner_referral' THEN
      -- 59.78% of AI Cashflow program fee
      v_commission_rate := 0.5978;
      v_commission_amount := v_base_amount * v_commission_rate;
      
    WHEN 'affiliate_referral' THEN
      -- 59.78% of AI Cashflow program fee
      v_commission_rate := 0.5978;
      v_commission_amount := v_base_amount * v_commission_rate;
      
    WHEN 'learner_renewal' THEN
      -- 20% of renewal fee
      v_commission_rate := 0.2000;
      v_commission_amount := v_base_amount * v_commission_rate;
      
    ELSE
      v_commission_rate := 0.5978;
      v_commission_amount := v_base_amount * v_commission_rate;
  END CASE;

  RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_commission function
CREATE OR REPLACE FUNCTION create_commission(
  p_affiliate_id UUID,
  p_referral_id UUID,
  p_payment_id UUID,
  p_commission_type TEXT DEFAULT 'learner_referral'
) RETURNS UUID AS $$
DECLARE
  v_commission_id UUID;
  v_commission_amount NUMERIC;
  v_commission_rate NUMERIC;
  v_payment RECORD;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found: %', p_payment_id;
  END IF;

  -- Calculate commission
  v_commission_amount := calculate_commission(p_payment_id, p_referral_id, p_commission_type);
  
  -- Get commission rate - 59.78% for AI Cashflow program
  CASE p_commission_type
    WHEN 'learner_referral', 'affiliate_referral' THEN
      v_commission_rate := 0.5978;
    WHEN 'learner_renewal' THEN
      v_commission_rate := 0.2000;
    ELSE
      v_commission_rate := 0.5978;
  END CASE;

  -- Insert commission record
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
    status,
    notes
  ) VALUES (
    p_affiliate_id,
    p_referral_id,
    p_payment_id,
    p_commission_type,
    v_commission_amount,
    v_payment.currency,
    v_commission_rate,
    v_payment.amount,
    v_payment.currency,
    'available',
    'AI Cashflow Sale (59.78% commission)'
  ) RETURNING id INTO v_commission_id;

  -- Update affiliate profile
  UPDATE affiliate_profiles
  SET 
    total_earnings = COALESCE(total_earnings, 0) + v_commission_amount,
    available_balance = COALESCE(available_balance, 0) + v_commission_amount,
    updated_at = NOW()
  WHERE id = p_affiliate_id;

  RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
