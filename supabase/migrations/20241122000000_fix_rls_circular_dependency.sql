-- Fix RLS circular dependency issue
-- The is_admin() function was causing timeouts when called from RLS policies on the profiles table
-- This migration removes the admin-related policies that call is_admin() from profiles table
-- and replaces them with more direct checks

-- Drop the problematic admin policies that call is_admin()
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "allow_admins_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_admins_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_admins_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_admins_delete_profiles" ON profiles;

-- The basic user policies remain:
-- "Users can view their own profile" - allows users to view their own profile
-- "Users can insert their own profile" - allows users to create their own profile
-- "Users can update their own profile" - allows users to update their own profile
-- "allow_users_view_own_profile" - duplicate of above
-- "allow_users_insert_own_profile" - duplicate of above
-- "allow_users_update_own_profile" - duplicate of above

-- For admin access, we'll rely on the service role key which bypasses RLS
-- This is the recommended approach for admin operations in Supabase

-- Clean up duplicate policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create single set of clean policies
CREATE POLICY "users_view_own_profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role (used by backend) to bypass RLS
CREATE POLICY "service_role_all_access" ON profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
