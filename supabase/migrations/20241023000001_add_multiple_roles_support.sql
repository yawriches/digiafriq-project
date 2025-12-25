-- Add support for multiple roles per user
-- This migration allows users to have both learner and affiliate roles
-- and switch between them using an active_role field

-- Add active_role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_role user_role DEFAULT 'learner';

-- Add available_roles array column to store all roles a user has access to
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS available_roles user_role[] DEFAULT ARRAY['learner']::user_role[];

-- Update existing users to have their current role in available_roles
UPDATE profiles 
SET available_roles = ARRAY[role]::user_role[],
    active_role = role
WHERE available_roles IS NULL OR available_roles = ARRAY[]::user_role[];

-- Create function to add a role to a user
CREATE OR REPLACE FUNCTION add_role_to_user(user_id UUID, new_role user_role)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET available_roles = array_append(available_roles, new_role)
    WHERE id = user_id
    AND NOT (new_role = ANY(available_roles));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to switch active role
CREATE OR REPLACE FUNCTION switch_active_role(user_id UUID, new_active_role user_role)
RETURNS void AS $$
BEGIN
    -- Check if user has access to the role
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND new_active_role = ANY(available_roles)
    ) THEN
        UPDATE profiles
        SET active_role = new_active_role
        WHERE id = user_id;
    ELSE
        RAISE EXCEPTION 'User does not have access to role: %', new_active_role;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, check_role user_role)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND check_role = ANY(available_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for active_role for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles(active_role);

-- Add comment to explain the new columns
COMMENT ON COLUMN profiles.active_role IS 'The currently active role for the user session';
COMMENT ON COLUMN profiles.available_roles IS 'Array of all roles the user has access to';

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION add_role_to_user(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION switch_active_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role(UUID, user_role) TO authenticated;
