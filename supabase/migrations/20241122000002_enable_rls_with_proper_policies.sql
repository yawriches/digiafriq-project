-- Re-enable RLS on profiles table with proper policies (no circular dependencies)
-- This migration removes the temporary RLS disable and implements proper policies

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "service_role_all_access" ON profiles;
DROP POLICY IF EXISTS "allow_users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_admins_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_admins_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_admins_delete_profiles" ON profiles;

-- Create simple, non-circular RLS policies
-- Allow authenticated users to view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role (backend/migrations) to bypass RLS
CREATE POLICY "service_role_all_access" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Note: Admin access is now handled via service role key in backend
-- This avoids the circular dependency issue with is_admin() function
