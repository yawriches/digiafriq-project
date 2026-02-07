-- Add new profile fields for mandatory profile completion
-- These fields are required before users can access the platform

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN profiles.sex IS 'User sex (Male/Female)';
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth for age verification';
COMMENT ON COLUMN profiles.city IS 'User city of residence';
