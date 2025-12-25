-- Add missing profile fields for city, gender, date_of_birth, and bio
-- Also add payment_methods JSONB column to store bank/mobile money details

-- Add city column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city VARCHAR(100);
  END IF;
END $$;

-- Add gender column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender VARCHAR(50);
  END IF;
END $$;

-- Add date_of_birth column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
  END IF;
END $$;

-- Add bio column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  END IF;
END $$;

-- Add payment_methods JSONB column to store bank and mobile money details
-- Structure: [{ type: 'bank'|'mobile', bankName?, accountNumber?, accountName?, network?, mobileNumber?, isDefault }]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'payment_methods'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_methods JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add index on payment_methods for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_payment_methods ON profiles USING GIN (payment_methods);

COMMENT ON COLUMN profiles.city IS 'User city of residence';
COMMENT ON COLUMN profiles.gender IS 'User gender (Male, Female, Other, Prefer not to say)';
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN profiles.bio IS 'User biography or description';
COMMENT ON COLUMN profiles.payment_methods IS 'JSON array of payment methods for affiliate withdrawals';
