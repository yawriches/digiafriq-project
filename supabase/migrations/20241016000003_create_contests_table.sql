-- Create contests table
CREATE TABLE IF NOT EXISTS contests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('upcoming', 'running', 'ended')) DEFAULT 'upcoming',
    prize_amount DECIMAL(10,2),
    prize_description TEXT,
    target_referrals INTEGER NOT NULL DEFAULT 0,
    max_participants INTEGER,
    rules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contest_participations table
CREATE TABLE IF NOT EXISTS contest_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referrals_count INTEGER DEFAULT 0,
    rank INTEGER,
    prize_won TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contest_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contest_participations_contest_id ON contest_participations(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participations_user_id ON contest_participations(user_id);

-- Insert sample contest data
INSERT INTO contests (name, description, start_date, end_date, status, prize_amount, prize_description, target_referrals, max_participants, rules) VALUES
('25 Affiliate Sales Challenge', 'Refer 25 new affiliates to earn cash reward', '2024-10-01', '2024-12-31', 'running', 700.00, '700 Cedis', 25, 100, '["Sales must be verified and legitimate to count toward the contest", "Only new affiliate sign-ups during the contest period are eligible", "Multiple entries from the same referred affiliate will not be counted", "Prizes are awarded based on cumulative sales at the end of the contest period"]'),
('50 Affiliate Sales Challenge', 'Refer 50 new affiliates to unlock bigger rewards', '2024-10-01', '2024-12-31', 'running', 2000.00, '2,000 Cedis', 50, 50, '["Sales must be verified and legitimate to count toward the contest", "Only new affiliate sign-ups during the contest period are eligible", "Multiple entries from the same referred affiliate will not be counted"]'),
('250 Affiliate Sales - Laptop Prize', 'Refer 250 new affiliates to win cash or Macbook Air', '2024-10-01', '2024-12-31', 'running', 9000.00, '9,000 Cedis / Macbook Air 2020 (8GB, Core i7, 256GB SSD)', 250, 20, '["Sales must be verified and legitimate to count toward the contest", "Only new affiliate sign-ups during the contest period are eligible", "Winner can choose between cash prize or Macbook Air"]'),
('MINI IMPORTATION GOLDMINE', 'Import products from China and sell locally for profit', '2024-07-01', '2024-09-30', 'ended', 700.00, '700 Cedis', 25, 50, '["Contest focused on importation business model", "Participants must complete training modules", "Sales verification required"]'),
('Storywriting Profit Accelerator (SPA) Course Sales Challenge', 'Learn professional storywriting and monetize your skills', '2024-06-01', '2024-08-31', 'ended', 1500.00, '1,500 Cedis', 25, 40, '["Focus on storywriting course sales", "Creative writing skills development required", "Portfolio submission needed"]');

-- Enable Row Level Security
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contests (readable by all authenticated users)
CREATE POLICY "Contests are viewable by authenticated users" ON contests
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for contest_participations (users can only see their own participations)
CREATE POLICY "Users can view their own contest participations" ON contest_participations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contest participations" ON contest_participations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contest participations" ON contest_participations
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update contest status based on dates
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS void AS $$
BEGIN
    UPDATE contests 
    SET status = CASE 
        WHEN start_date > CURRENT_DATE THEN 'upcoming'
        WHEN end_date < CURRENT_DATE THEN 'ended'
        ELSE 'running'
    END
    WHERE status != CASE 
        WHEN start_date > CURRENT_DATE THEN 'upcoming'
        WHEN end_date < CURRENT_DATE THEN 'ended'
        ELSE 'running'
    END;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update contest status automatically
CREATE OR REPLACE FUNCTION trigger_update_contest_status()
RETURNS trigger AS $$
BEGIN
    PERFORM update_contest_status();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update contest status on startup
SELECT update_contest_status();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contest_participations_updated_at BEFORE UPDATE ON contest_participations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create sample contest participations for testing
CREATE OR REPLACE FUNCTION create_sample_contest_participations(user_uuid UUID)
RETURNS void AS $$
DECLARE
    contest_1_id UUID;
    contest_2_id UUID;
    contest_4_id UUID;
BEGIN
    -- Get contest IDs
    SELECT id INTO contest_1_id FROM contests WHERE name = '25 Affiliate Sales Challenge' LIMIT 1;
    SELECT id INTO contest_2_id FROM contests WHERE name = '50 Affiliate Sales Challenge' LIMIT 1;
    SELECT id INTO contest_4_id FROM contests WHERE name = 'MINI IMPORTATION GOLDMINE' LIMIT 1;
    
    -- Insert sample participations if contests exist
    IF contest_1_id IS NOT NULL THEN
        INSERT INTO contest_participations (contest_id, user_id, referrals_count, rank, joined_at)
        VALUES (contest_1_id, user_uuid, 12, 8, '2024-10-05T00:00:00Z')
        ON CONFLICT (contest_id, user_id) DO NOTHING;
    END IF;
    
    IF contest_2_id IS NOT NULL THEN
        INSERT INTO contest_participations (contest_id, user_id, referrals_count, rank, joined_at)
        VALUES (contest_2_id, user_uuid, 12, 15, '2024-10-05T00:00:00Z')
        ON CONFLICT (contest_id, user_id) DO NOTHING;
    END IF;
    
    IF contest_4_id IS NOT NULL THEN
        INSERT INTO contest_participations (contest_id, user_id, referrals_count, rank, prize_won, joined_at)
        VALUES (contest_4_id, user_uuid, 25, 8, '700 Cedis', '2024-07-05T00:00:00Z')
        ON CONFLICT (contest_id, user_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comment with instructions
-- To create sample participations for a user, run:
-- SELECT create_sample_contest_participations('your-user-uuid-here');
