-- Check and fix phone field in profiles table
-- This migration will help diagnose and fix phone number storage issues

-- First, let's check the current structure of the profiles table
-- and see if there are any constraints or issues

-- Check if phone field exists and its type
DO $$
BEGIN
    -- Check if phone column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        -- Add phone column if it doesn't exist
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to profiles table';
    ELSE
        RAISE NOTICE 'Phone column already exists in profiles table';
    END IF;
END $$;

-- Ensure the phone field can store international phone numbers (up to 20 characters)
-- and add an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Add a comment to document the phone field
COMMENT ON COLUMN profiles.phone IS 'User phone number including country code (e.g., +233 123456789)';

-- Optional: Add a check constraint to ensure phone numbers start with + (international format)
-- Uncomment the next line if you want to enforce international format
-- ALTER TABLE profiles ADD CONSTRAINT check_phone_format CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$');

-- Show current profiles with phone data for debugging
-- This will help you see what's currently stored
SELECT 
    id,
    email,
    full_name,
    phone,
    country,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
