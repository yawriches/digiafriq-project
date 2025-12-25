-- Add payment status tracking to affiliate_profiles
ALTER TABLE affiliate_profiles
ADD COLUMN IF NOT EXISTS has_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Add index for quick payment status lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_has_paid ON affiliate_profiles(has_paid);

-- Add comment
COMMENT ON COLUMN affiliate_profiles.has_paid IS 'Whether the affiliate has completed their initial payment to activate their account';
COMMENT ON COLUMN affiliate_profiles.payment_date IS 'Date when the affiliate completed their payment';
COMMENT ON COLUMN affiliate_profiles.payment_amount IS 'Amount paid for affiliate activation';
COMMENT ON COLUMN affiliate_profiles.payment_reference IS 'Payment reference or transaction ID';

-- Function to mark affiliate as paid
CREATE OR REPLACE FUNCTION mark_affiliate_paid(
  p_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_reference VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_profiles
  SET 
    has_paid = TRUE,
    payment_date = NOW(),
    payment_amount = p_payment_amount,
    payment_reference = p_payment_reference
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_affiliate_paid TO authenticated;
