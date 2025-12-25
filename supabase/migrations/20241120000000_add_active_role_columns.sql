-- Add missing columns to profiles table for multiple role support
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_role user_role DEFAULT 'learner',
ADD COLUMN IF NOT EXISTS available_roles user_role[] DEFAULT ARRAY['learner']::user_role[];

-- Create an index on active_role for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_active_role ON profiles(active_role);

-- Create an index on available_roles for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_available_roles ON profiles USING GIN(available_roles);
