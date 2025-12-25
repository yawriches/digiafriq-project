-- Create membership packages table
CREATE TABLE membership_packages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    duration_months INTEGER NOT NULL, -- Duration in months
    member_type user_role NOT NULL, -- 'learner' or 'affiliate'
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]'::jsonb, -- Array of features/benefits
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create membership package course access table (for learner memberships)
CREATE TABLE membership_course_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    membership_package_id UUID REFERENCES membership_packages(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(membership_package_id, course_id)
);

-- Create membership package promotion rights table (for affiliate memberships)
CREATE TABLE membership_promotion_rights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    membership_package_id UUID REFERENCES membership_packages(id) ON DELETE CASCADE,
    promotable_membership_id UUID REFERENCES membership_packages(id) ON DELETE CASCADE,
    commission_rate DECIMAL(5,2) DEFAULT 100.00, -- Commission rate for promoting this membership
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(membership_package_id, promotable_membership_id)
);

-- Create user memberships table (tracks active memberships)
CREATE TABLE user_memberships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    membership_package_id UUID REFERENCES membership_packages(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_membership_packages_type ON membership_packages(member_type);
CREATE INDEX idx_membership_packages_active ON membership_packages(is_active);
CREATE INDEX idx_membership_course_access_package ON membership_course_access(membership_package_id);
CREATE INDEX idx_membership_course_access_course ON membership_course_access(course_id);
CREATE INDEX idx_membership_promotion_rights_package ON membership_promotion_rights(membership_package_id);
CREATE INDEX idx_membership_promotion_rights_promotable ON membership_promotion_rights(promotable_membership_id);
CREATE INDEX idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_package ON user_memberships(membership_package_id);
CREATE INDEX idx_user_memberships_active ON user_memberships(is_active);
CREATE INDEX idx_user_memberships_expires ON user_memberships(expires_at);

-- Add updated_at triggers
CREATE TRIGGER update_membership_packages_updated_at 
    BEFORE UPDATE ON membership_packages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memberships_updated_at 
    BEFORE UPDATE ON user_memberships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check if user has access to a course through membership
CREATE OR REPLACE FUNCTION user_has_course_access_via_membership(user_uuid UUID, course_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_memberships um
        JOIN membership_course_access mca ON um.membership_package_id = mca.membership_package_id
        WHERE um.user_id = user_uuid 
        AND mca.course_id = course_uuid
        AND um.is_active = TRUE 
        AND um.expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's active memberships
CREATE OR REPLACE FUNCTION get_user_active_memberships(user_uuid UUID)
RETURNS TABLE (
    membership_id UUID,
    package_name TEXT,
    package_type user_role,
    expires_at TIMESTAMPTZ,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        um.id,
        mp.name,
        mp.member_type,
        um.expires_at,
        mp.features
    FROM user_memberships um
    JOIN membership_packages mp ON um.membership_package_id = mp.id
    WHERE um.user_id = user_uuid 
    AND um.is_active = TRUE 
    AND um.expires_at > NOW()
    ORDER BY um.expires_at DESC;
END;
$$ LANGUAGE plpgsql;
