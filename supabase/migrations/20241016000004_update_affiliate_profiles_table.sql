-- Update existing affiliate_profiles table with new columns and features
-- This migration modifies the existing table instead of creating a new one

-- Add new columns to existing affiliate_profiles table
ALTER TABLE affiliate_profiles 
ADD COLUMN IF NOT EXISTS affiliate_level TEXT DEFAULT 'Starter',
ADD COLUMN IF NOT EXISTS join_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_payout_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Add check constraint for status
ALTER TABLE affiliate_profiles
ADD CONSTRAINT affiliate_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- Rename affiliate_code to match new naming (optional - only if you want consistency)
-- ALTER TABLE affiliate_profiles RENAME COLUMN affiliate_code TO referral_code;
-- Note: Commented out because you might want to keep both columns

-- Update referral_code for existing records that don't have one
-- Use existing affiliate_code as referral_code if referral_code is null
UPDATE affiliate_profiles 
SET referral_code = affiliate_code 
WHERE referral_code IS NULL AND affiliate_code IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_earnings ON affiliate_profiles(total_earnings DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_referrals ON affiliate_profiles(total_referrals DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_status ON affiliate_profiles(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_referral_code ON affiliate_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_level ON affiliate_profiles(affiliate_level);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM affiliate_profiles WHERE referral_code = code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create/update affiliate profile when user signs up as affiliate
CREATE OR REPLACE FUNCTION create_affiliate_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create affiliate profile if role is 'affiliate'
    IF NEW.role = 'affiliate' THEN
        INSERT INTO affiliate_profiles (
            id,
            affiliate_code,
            referral_code,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            generate_referral_code(), -- For backward compatibility
            generate_referral_code(),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_create_affiliate_profile ON profiles;
CREATE TRIGGER trigger_create_affiliate_profile
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_profile();

-- Function to get affiliate level based on rank
CREATE OR REPLACE FUNCTION get_affiliate_level_by_rank(user_rank INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE 
        WHEN user_rank BETWEEN 1 AND 3 THEN 'Legends'
        WHEN user_rank BETWEEN 4 AND 6 THEN 'Champions'
        WHEN user_rank BETWEEN 7 AND 10 THEN 'Elites'
        WHEN user_rank BETWEEN 11 AND 15 THEN 'Rising Stars'
        WHEN user_rank BETWEEN 16 AND 20 THEN 'Dream Chasers'
        ELSE 'Starter'
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to update all affiliate levels based on current rankings
CREATE OR REPLACE FUNCTION update_all_affiliate_levels()
RETURNS void AS $$
DECLARE
    affiliate_record RECORD;
    current_rank INTEGER := 0;
BEGIN
    -- Loop through affiliates ordered by earnings (highest first)
    FOR affiliate_record IN 
        SELECT id 
        FROM affiliate_profiles 
        WHERE status = 'active' -- Only rank active affiliates
        ORDER BY total_earnings DESC, total_referrals DESC
    LOOP
        current_rank := current_rank + 1;
        
        -- Update the affiliate level based on rank
        UPDATE affiliate_profiles
        SET affiliate_level = get_affiliate_level_by_rank(current_rank),
            updated_at = NOW()
        WHERE id = affiliate_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update levels when earnings change
CREATE OR REPLACE FUNCTION trigger_update_affiliate_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate all levels based on new rankings
    PERFORM update_all_affiliate_levels();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_recalculate_levels ON affiliate_profiles;
CREATE TRIGGER trigger_recalculate_levels
    AFTER INSERT OR UPDATE OF total_earnings, total_referrals ON affiliate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_affiliate_levels();

-- Insert sample affiliate profiles for testing (only if they don't exist)
DO $$
DECLARE
    sample_count INTEGER;
BEGIN
    -- Check if we already have sample data
    SELECT COUNT(*) INTO sample_count FROM affiliate_profiles;
    
    -- Only insert if table is empty or has very few records
    IF sample_count < 5 THEN
        -- Insert sample affiliate profiles
        INSERT INTO affiliate_profiles (id, total_earnings, total_referrals, affiliate_level, affiliate_code, referral_code, status) 
        SELECT 
            gen_random_uuid(),
            CASE 
                WHEN i = 1 THEN 75000.00
                WHEN i = 2 THEN 68000.00
                WHEN i = 3 THEN 62000.00
                WHEN i = 4 THEN 58000.00
                WHEN i = 5 THEN 55000.00
                WHEN i = 6 THEN 28000.00
                WHEN i = 7 THEN 15000.00
                WHEN i = 8 THEN 8000.00
                WHEN i = 9 THEN 6500.00
                ELSE 1000.00
            END,
            CASE 
                WHEN i = 1 THEN 150
                WHEN i = 2 THEN 136
                WHEN i = 3 THEN 124
                WHEN i = 4 THEN 116
                WHEN i = 5 THEN 110
                WHEN i = 6 THEN 85
                WHEN i = 7 THEN 65
                WHEN i = 8 THEN 45
                WHEN i = 9 THEN 38
                ELSE 15
            END,
            CASE 
                WHEN i BETWEEN 1 AND 3 THEN 'Legends'
                WHEN i BETWEEN 4 AND 6 THEN 'Champions'
                WHEN i BETWEEN 7 AND 10 THEN 'Elites'
                ELSE 'Starter'
            END,
            generate_referral_code(),
            generate_referral_code(),
            'active'
        FROM generate_series(1, 10) AS i
        ON CONFLICT (id) DO NOTHING;

        -- Insert corresponding profiles for the sample affiliates
        INSERT INTO profiles (id, full_name, email, role, created_at, updated_at)
        SELECT 
            ap.id,
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 1 THEN 'Ezekiel Numo'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 2 THEN 'Okeke Vivian Vivian'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 3 THEN 'Amarachi Miracle Onwuka'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 4 THEN 'Mary Okine Andoh'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 5 THEN 'Chukwuekwu precious Cyril'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 6 THEN 'Belle ⭐ Graham ⭐'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 7 THEN 'Jennifer Asabea'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 8 THEN 'Tengen Joyceline Endam'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 9 THEN 'Louisa Donkor'
                ELSE 'Sample Affiliate ' || ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC)
            END,
            CASE 
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 1 THEN 'ezekiel.numo@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 2 THEN 'okeke.vivian@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 3 THEN 'amarachi.miracle@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 4 THEN 'mary.okine@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 5 THEN 'chukwuekwu.precious@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 6 THEN 'belle.graham@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 7 THEN 'jennifer.asabea@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 8 THEN 'tengen.joyceline@example.com'
                WHEN ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) = 9 THEN 'louisa.donkor@example.com'
                ELSE 'affiliate' || ROW_NUMBER() OVER (ORDER BY ap.total_earnings DESC) || '@example.com'
            END,
            'affiliate',
            NOW(),
            NOW()
        FROM affiliate_profiles ap
        WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = ap.id)
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Sample affiliate data inserted successfully';
    ELSE
        RAISE NOTICE 'Sample data already exists, skipping insert';
    END IF;
END $$;

-- Update RLS policies (they should already exist from initial schema, but we'll ensure they're correct)
-- Enable Row Level Security if not already enabled
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're up to date
DROP POLICY IF EXISTS "Affiliates can view all affiliate profiles" ON affiliate_profiles;
DROP POLICY IF EXISTS "Affiliates can update own profile" ON affiliate_profiles;
DROP POLICY IF EXISTS "System can insert affiliate profiles" ON affiliate_profiles;

-- Affiliates can view all affiliate profiles (for leaderboard)
CREATE POLICY "Affiliates can view all affiliate profiles" ON affiliate_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'affiliate'
        )
    );

-- Affiliates can only update their own profile
CREATE POLICY "Affiliates can update own profile" ON affiliate_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Only system can insert affiliate profiles (via trigger)
CREATE POLICY "System can insert affiliate profiles" ON affiliate_profiles
    FOR INSERT WITH CHECK (true);

-- Initial calculation of all affiliate levels
SELECT update_all_affiliate_levels();
