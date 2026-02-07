-- Add affiliate onboarding fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_user_motivation VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_experience_level VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_promotion_channels TEXT[];
