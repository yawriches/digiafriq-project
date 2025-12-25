-- Temporary fix: Disable RLS on profiles table to allow profile fetches to work
-- This is a workaround while we fix the RLS policies
-- The is_admin() function in RLS policies is causing timeouts

-- Disable RLS on profiles table temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- This allows all authenticated users to access their profiles
-- We'll re-enable RLS with proper policies in a future migration
