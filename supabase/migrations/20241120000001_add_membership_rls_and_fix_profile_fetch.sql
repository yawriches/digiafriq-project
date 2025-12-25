-- Enable RLS on membership tables
ALTER TABLE membership_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_course_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_promotion_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Membership packages policies (public read for active packages)
CREATE POLICY "Anyone can view active membership packages" ON membership_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage membership packages" ON membership_packages
    FOR ALL USING (is_admin());

-- Membership course access policies
CREATE POLICY "Anyone can view course access for active packages" ON membership_course_access
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM membership_packages 
            WHERE membership_packages.id = membership_course_access.membership_package_id
            AND membership_packages.is_active = true
        )
    );

CREATE POLICY "Admins can manage course access" ON membership_course_access
    FOR ALL USING (is_admin());

-- Membership promotion rights policies
CREATE POLICY "Anyone can view promotion rights for active packages" ON membership_promotion_rights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM membership_packages 
            WHERE membership_packages.id = membership_promotion_rights.membership_package_id
            AND membership_packages.is_active = true
        )
    );

CREATE POLICY "Admins can manage promotion rights" ON membership_promotion_rights
    FOR ALL USING (is_admin());

-- User memberships policies
CREATE POLICY "Users can view their own memberships" ON user_memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships" ON user_memberships
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships" ON user_memberships
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all memberships" ON user_memberships
    FOR ALL USING (is_admin());

CREATE POLICY "System can create memberships" ON user_memberships
    FOR INSERT WITH CHECK (true);

-- Drop existing problematic profile policies and recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Recreate profile policies with better handling
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Add a permissive policy for authenticated users to insert their own profile
-- This helps with the initial profile creation race condition
CREATE POLICY "Authenticated users can insert profiles" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
