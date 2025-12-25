-- Add columns to profiles table for guest checkout flow
-- This migration adds columns needed for the guest checkout with temporary password flow

-- Add payment_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid';
  END IF;
END $$;

-- Add password_set column if it doesn't exist (tracks if user changed from temp password)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password_set'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_set BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add temp_password column to store the temporary password (encrypted or hashed for display)
-- This is used to show the user their temporary password on the success page
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'temp_password'
  ) THEN
    ALTER TABLE profiles ADD COLUMN temp_password VARCHAR(100);
  END IF;
END $$;

-- Add temp_password_expires_at column for security
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'temp_password_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN temp_password_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_password_set ON profiles(password_set);

-- Update existing users who have active memberships to have payment_status = 'paid'
UPDATE profiles 
SET payment_status = 'paid'
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM user_memberships 
  WHERE is_active = true
) AND (payment_status IS NULL OR payment_status = 'unpaid');

-- Update existing users to have password_set = true (they already have passwords)
UPDATE profiles 
SET password_set = true
WHERE password_set IS NULL OR password_set = false;

COMMENT ON COLUMN profiles.payment_status IS 'Payment status for guest checkout: unpaid, paid';
COMMENT ON COLUMN profiles.password_set IS 'Whether user has changed from temporary password to their own';
COMMENT ON COLUMN profiles.temp_password IS 'Temporary password for guest checkout users (shown once on success page)';
COMMENT ON COLUMN profiles.temp_password_expires_at IS 'When the temporary password expires (user should change it)';
