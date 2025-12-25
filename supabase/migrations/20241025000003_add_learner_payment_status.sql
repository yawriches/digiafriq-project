-- Add payment status tracking to profiles table for learner membership
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS learner_has_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS learner_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS learner_payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS learner_payment_reference VARCHAR(255);

-- Add index for quick payment status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_learner_has_paid ON profiles(learner_has_paid);

-- Add comments
COMMENT ON COLUMN profiles.learner_has_paid IS 'Whether the user has completed their learner membership payment';
COMMENT ON COLUMN profiles.learner_payment_date IS 'Date when the user completed their learner membership payment';
COMMENT ON COLUMN profiles.learner_payment_amount IS 'Amount paid for learner membership';
COMMENT ON COLUMN profiles.learner_payment_reference IS 'Payment reference or transaction ID for learner membership';

-- Function to mark learner as paid
CREATE OR REPLACE FUNCTION mark_learner_paid(
  p_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_reference VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    learner_has_paid = TRUE,
    learner_payment_date = NOW(),
    learner_payment_amount = p_payment_amount,
    learner_payment_reference = p_payment_reference
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_learner_paid TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION mark_learner_paid IS 'Marks a user as having paid for learner membership';
