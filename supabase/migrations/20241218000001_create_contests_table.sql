-- Migration: Create contests table for affiliate contests management
-- This migration creates the contests table and related tables for tracking contest participations

-- Create contests table if it doesn't exist
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'running', 'ended')),
  prize_amount DECIMAL(12, 2) DEFAULT 0,
  prize_description VARCHAR(255),
  target_referrals INTEGER DEFAULT 0,
  max_participants INTEGER,
  rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing contests table if they don't exist
DO $$ 
BEGIN
  -- Add campaign column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contests' AND column_name = 'campaign') THEN
    ALTER TABLE contests ADD COLUMN campaign VARCHAR(255) DEFAULT 'DigiAfriq Campaign';
  END IF;
  
  -- Add winner_criteria column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contests' AND column_name = 'winner_criteria') THEN
    ALTER TABLE contests ADD COLUMN winner_criteria VARCHAR(255) DEFAULT 'All target satisfied';
  END IF;
END $$;

-- Create contest_participations table to track user participation in contests
CREATE TABLE IF NOT EXISTS contest_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrals_count INTEGER DEFAULT 0,
  rank INTEGER,
  prize_won VARCHAR(255),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one participation per user per contest
  UNIQUE(contest_id, user_id)
);

-- Enable RLS on contests table
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contest_participations table
ALTER TABLE contest_participations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contests table

-- Anyone can view active contests
CREATE POLICY "Anyone can view contests" ON contests
  FOR SELECT
  USING (true);

-- Only admins can insert contests
CREATE POLICY "Admins can insert contests" ON contests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update contests
CREATE POLICY "Admins can update contests" ON contests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete contests
CREATE POLICY "Admins can delete contests" ON contests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access on contests" ON contests
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for contest_participations table

-- Users can view their own participations
CREATE POLICY "Users can view own participations" ON contest_participations
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all participations
CREATE POLICY "Admins can view all participations" ON contest_participations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can join contests (insert participation)
CREATE POLICY "Users can join contests" ON contest_participations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own participation (for referral count updates)
CREATE POLICY "Users can update own participation" ON contest_participations
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can update any participation
CREATE POLICY "Admins can update participations" ON contest_participations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access on participations" ON contest_participations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contest_participations_contest ON contest_participations(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participations_user ON contest_participations(user_id);

-- Function to automatically update contest status based on dates
-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS update_contest_status() CASCADE;

CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on current date
  IF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'ended';
  ELSIF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
    NEW.status := 'running';
  ELSE
    NEW.status := 'upcoming';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contest status on insert/update
DROP TRIGGER IF EXISTS trigger_update_contest_status ON contests;
CREATE TRIGGER trigger_update_contest_status
  BEFORE INSERT OR UPDATE ON contests
  FOR EACH ROW
  EXECUTE FUNCTION update_contest_status();

-- Add comments for documentation
COMMENT ON TABLE contests IS 'Stores affiliate contest/challenge information';
COMMENT ON TABLE contest_participations IS 'Tracks user participation in contests';
COMMENT ON COLUMN contests.campaign IS 'The campaign name associated with the contest';
COMMENT ON COLUMN contests.winner_criteria IS 'Criteria for determining contest winners';
COMMENT ON COLUMN contests.rules IS 'JSON array of contest rules';
