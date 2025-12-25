-- Migration to create plans table for managing pricing plans
-- This allows admins to create and manage different plans with:
-- - Learner plans: Can be promoted by affiliates (you control which ones)
-- - Affiliate plans: For becoming an affiliate
-- - Learner fee and affiliate fee separation
-- - Features list for each plan
-- - Active/inactive status
-- - Promotable by affiliates control

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    learner_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    affiliate_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    package_type TEXT NOT NULL CHECK (package_type IN ('learner', 'affiliate')) DEFAULT 'learner',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    allowed_affiliate_plans JSONB DEFAULT '[]'::jsonb, -- Array of affiliate plan IDs that can promote this learner plan
    display_order INTEGER DEFAULT 0,
    duration_days INTEGER, -- NULL for lifetime access
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add allowed_affiliate_plans column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'allowed_affiliate_plans'
    ) THEN
        ALTER TABLE plans
        ADD COLUMN allowed_affiliate_plans JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Remove old is_promotable column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'is_promotable'
    ) THEN
        ALTER TABLE plans DROP COLUMN is_promotable;
    END IF;
END $$;

-- Add computed column for total price (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plans' AND column_name = 'total_price'
    ) THEN
        ALTER TABLE plans
        ADD COLUMN total_price DECIMAL(10,2) GENERATED ALWAYS AS (learner_fee + affiliate_fee) STORED;
    END IF;
END $$;

-- Update package_type constraint to remove 'bundle' if it exists
DO $$
BEGIN
    -- Drop the old constraint if it exists
    ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_package_type_check;
    
    -- Add the new constraint with only 'learner' and 'affiliate'
    ALTER TABLE plans ADD CONSTRAINT plans_package_type_check 
    CHECK (package_type IN ('learner', 'affiliate'));
EXCEPTION
    WHEN OTHERS THEN
        -- If constraint already exists with correct values, ignore
        NULL;
END $$;

COMMENT ON COLUMN plans.allowed_affiliate_plans IS 'For learner plans: array of affiliate plan IDs that are allowed to promote this plan. Empty array means no restrictions (all can promote).';

-- Create indexes for active plans (if not exists)
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_plans_package_type ON plans(package_type);
CREATE INDEX IF NOT EXISTS idx_plans_featured ON plans(is_featured);
CREATE INDEX IF NOT EXISTS idx_plans_allowed_affiliate_plans ON plans USING GIN (allowed_affiliate_plans);

-- Add trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans (only if plans table is empty)
INSERT INTO plans (name, description, learner_fee, affiliate_fee, package_type, features, is_active, is_featured, allowed_affiliate_plans, display_order, duration_days)
SELECT 
    name::TEXT,
    description::TEXT,
    learner_fee::DECIMAL(10,2),
    affiliate_fee::DECIMAL(10,2),
    package_type::TEXT,
    features::JSONB,
    is_active::BOOLEAN,
    is_featured::BOOLEAN,
    allowed_affiliate_plans::JSONB,
    display_order::INTEGER,
    duration_days::INTEGER
FROM (VALUES 
-- Learner Plans (can be promoted by affiliates)
(
    'Basic Learner',
    'Essential access to courses and learning materials',
    100.00,
    0.00,
    'learner',
    '[
        "Access to all courses",
        "Lifetime access",
        "Course certificates",
        "Community access",
        "Mobile app access"
    ]'::jsonb,
    true,
    false,
    '[]'::jsonb, -- Empty array = all affiliate plans can promote
    1,
    NULL::INTEGER
),
(
    'Premium Learner',
    'Enhanced learning experience with additional benefits',
    200.00,
    0.00,
    'learner',
    '[
        "Everything in Basic Learner",
        "Priority support",
        "Exclusive webinars",
        "Downloadable resources",
        "1-on-1 mentorship session",
        "Advanced course materials"
    ]'::jsonb,
    true,
    true, -- Featured plan
    '[]'::jsonb, -- Empty array = all affiliate plans can promote
    2,
    NULL::INTEGER
),
(
    'VIP Learner',
    'Ultimate learning package with all premium features',
    500.00,
    0.00,
    'learner',
    '[
        "Everything in Premium Learner",
        "Unlimited 1-on-1 mentorship",
        "Custom learning path",
        "Direct instructor access",
        "Exclusive VIP community",
        "Early access to new courses",
        "Lifetime updates"
    ]'::jsonb,
    true,
    false,
    '[]'::jsonb, -- Will be updated later to restrict to specific affiliate plans
    3,
    NULL::INTEGER
),
-- Affiliate Plans (for becoming an affiliate)
(
    'Affiliate Starter',
    'Start your affiliate journey and earn commissions',
    100.00,
    150.00,
    'affiliate',
    '[
        "Everything in Basic Learner",
        "Become an affiliate",
        "Earn 100% commission on learner fees",
        "Affiliate dashboard",
        "Basic marketing materials",
        "Referral tracking",
        "Email support"
    ]'::jsonb,
    true,
    true, -- Featured
    '[]'::jsonb, -- Not applicable for affiliate plans
    4,
    NULL::INTEGER
),
(
    'Affiliate Pro',
    'Advanced affiliate package with premium tools',
    100.00,
    300.00,
    'affiliate',
    '[
        "Everything in Affiliate Starter",
        "Advanced marketing materials",
        "Custom referral landing pages",
        "Priority affiliate support",
        "Advanced analytics dashboard",
        "Promotional video templates",
        "Monthly strategy calls"
    ]'::jsonb,
    true,
    false,
    '[]'::jsonb, -- Not applicable for affiliate plans
    5,
    NULL::INTEGER
)
) AS default_plans(name, description, learner_fee, affiliate_fee, package_type, features, is_active, is_featured, allowed_affiliate_plans, display_order, duration_days)
WHERE NOT EXISTS (SELECT 1 FROM plans LIMIT 1);

-- Create function to get active plans
DROP FUNCTION IF EXISTS get_active_plans();
CREATE OR REPLACE FUNCTION get_active_plans()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    learner_fee DECIMAL,
    affiliate_fee DECIMAL,
    total_price DECIMAL,
    package_type TEXT,
    features JSONB,
    is_featured BOOLEAN,
    allowed_affiliate_plans JSONB,
    display_order INTEGER,
    duration_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.learner_fee,
        p.affiliate_fee,
        p.total_price,
        p.package_type,
        p.features,
        p.is_featured,
        p.allowed_affiliate_plans,
        p.display_order,
        p.duration_days
    FROM plans p
    WHERE p.is_active = true
    ORDER BY p.display_order ASC, p.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get promotable learner plans for a specific affiliate plan
DROP FUNCTION IF EXISTS get_promotable_learner_plans(UUID);
DROP FUNCTION IF EXISTS get_promotable_learner_plans();
CREATE OR REPLACE FUNCTION get_promotable_learner_plans(p_affiliate_plan_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    learner_fee DECIMAL,
    total_price DECIMAL,
    features JSONB,
    is_featured BOOLEAN,
    display_order INTEGER,
    duration_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.learner_fee,
        p.total_price,
        p.features,3
        p.is_featured,
        p.display_order,
        p.duration_days
    FROM plans p
    WHERE p.is_active = true
    AND p.package_type = 'learner'
    AND (
        -- Empty array means all affiliate plans can promote
        jsonb_array_length(p.allowed_affiliate_plans) = 0
        OR 
        -- Check if the affiliate plan ID is in the allowed list
        p.allowed_affiliate_plans @> jsonb_build_array(p_affiliate_plan_id::text)
    )
    ORDER BY p.display_order ASC, p.created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_promotable_learner_plans IS 'Returns learner plans that a specific affiliate plan is allowed to promote. Empty allowed_affiliate_plans array means all can promote.';

-- Create function to get plan statistics
DROP FUNCTION IF EXISTS get_plan_statistics(UUID);
CREATE OR REPLACE FUNCTION get_plan_statistics(p_plan_id UUID)
RETURNS TABLE (
    total_purchases INTEGER,
    total_revenue DECIMAL,
    total_commissions DECIMAL,
    platform_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT p.id)::INTEGER as total_purchases,
        COALESCE(SUM(p.amount), 0)::DECIMAL as total_revenue,
        COALESCE(SUM(c.amount), 0)::DECIMAL as total_commissions,
        COALESCE(SUM(c.platform_revenue), 0)::DECIMAL as platform_revenue
    FROM payments p
    LEFT JOIN commissions c ON c.payment_id = p.id
    WHERE p.course_id = p_plan_id
    AND p.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE plans IS 'Pricing plans with separated learner and affiliate fees';
COMMENT ON COLUMN plans.learner_fee IS 'Fee for learner access - affiliates get 100% commission on this';
COMMENT ON COLUMN plans.affiliate_fee IS 'Fee for affiliate access - platform keeps this';
COMMENT ON COLUMN plans.package_type IS 'Type of plan: learner, affiliate, or bundle';
COMMENT ON COLUMN plans.features IS 'JSON array of features included in the plan';
COMMENT ON COLUMN plans.total_price IS 'Computed: learner_fee + affiliate_fee';
COMMENT ON COLUMN plans.duration_days IS 'Access duration in days (NULL for lifetime)';
COMMENT ON FUNCTION get_active_plans IS 'Returns all active plans ordered by display_order';
COMMENT ON FUNCTION get_plan_statistics IS 'Returns purchase statistics for a specific plan';
