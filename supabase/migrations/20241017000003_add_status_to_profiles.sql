-- Add status column to profiles table
-- This allows tracking user account status (active, inactive, suspended)

-- Add status column with default value
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add check constraint to ensure valid status values
ALTER TABLE profiles
ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update existing profiles to have 'active' status
UPDATE profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN profiles.status IS 'User account status: active (default), inactive (user deactivated), suspended (admin action)';

-- Optional: Create a function to check if user is active
CREATE OR REPLACE FUNCTION is_user_active(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a function to suspend a user
CREATE OR REPLACE FUNCTION suspend_user(user_id UUID, reason TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET status = 'suspended',
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Log the suspension (you can add to an audit table if needed)
    RAISE NOTICE 'User % suspended. Reason: %', user_id, COALESCE(reason, 'No reason provided');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a function to reactivate a user
CREATE OR REPLACE FUNCTION reactivate_user(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET status = 'active',
        updated_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE 'User % reactivated', user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to consider status (optional but recommended)
-- Only allow active users to access certain features

-- Example: Update existing RLS policy to check status
-- DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
-- CREATE POLICY "Users can view own profile" ON profiles
--     FOR SELECT USING (
--         auth.uid() = id 
--         AND status = 'active'
--     );

-- Note: Uncomment and adjust the RLS policies above based on your needs
