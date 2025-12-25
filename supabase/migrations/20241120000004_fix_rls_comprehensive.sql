-- Re-enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create simple, permissive policies that should work
-- Allow authenticated users to view their own profile
CREATE POLICY "allow_users_view_own_profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "allow_users_insert_own_profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "allow_users_update_own_profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "allow_admins_view_all_profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Allow admins to update all profiles
CREATE POLICY "allow_admins_update_all_profiles" ON profiles
    FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Allow admins to insert profiles
CREATE POLICY "allow_admins_insert_profiles" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Allow admins to delete profiles
CREATE POLICY "allow_admins_delete_profiles" ON profiles
    FOR DELETE
    TO authenticated
    USING (is_admin());
