-- Migration: Create contest leaderboard view and enable real-time
-- This migration creates a view for the leaderboard and enables real-time subscriptions

-- Create a leaderboard table for real-time updates
-- This table will store the leaderboard entries with user details
CREATE TABLE IF NOT EXISTS contest_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
  user_avatar_url TEXT,
  referrals_count INTEGER DEFAULT 0,
  rank INTEGER,
  points INTEGER DEFAULT 0,
  last_referral_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one entry per user per contest
  UNIQUE(contest_id, user_id)
);

-- Enable RLS on contest_leaderboard table
ALTER TABLE contest_leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contest_leaderboard table

-- Anyone can view leaderboard entries (public leaderboard)
CREATE POLICY "Anyone can view leaderboard" ON contest_leaderboard
  FOR SELECT
  USING (true);

-- Users can insert their own leaderboard entry
CREATE POLICY "Users can insert own leaderboard entry" ON contest_leaderboard
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own leaderboard entry
CREATE POLICY "Users can update own leaderboard entry" ON contest_leaderboard
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can manage all leaderboard entries
CREATE POLICY "Admins can manage leaderboard" ON contest_leaderboard
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access on leaderboard" ON contest_leaderboard
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_contest ON contest_leaderboard(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_user ON contest_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_rank ON contest_leaderboard(contest_id, rank);
CREATE INDEX IF NOT EXISTS idx_contest_leaderboard_referrals ON contest_leaderboard(contest_id, referrals_count DESC);

-- Function to update leaderboard ranks when referrals change
CREATE OR REPLACE FUNCTION update_leaderboard_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ranks for all entries in the same contest
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY referrals_count DESC, updated_at ASC) as new_rank
    FROM contest_leaderboard
    WHERE contest_id = NEW.contest_id
  )
  UPDATE contest_leaderboard cl
  SET rank = ranked.new_rank,
      updated_at = NOW()
  FROM ranked
  WHERE cl.id = ranked.id
    AND cl.contest_id = NEW.contest_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ranks when referrals_count changes
DROP TRIGGER IF EXISTS trigger_update_leaderboard_ranks ON contest_leaderboard;
CREATE TRIGGER trigger_update_leaderboard_ranks
  AFTER INSERT OR UPDATE OF referrals_count ON contest_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_ranks();

-- Enable real-time for the leaderboard table
-- Note: You need to enable this in Supabase Dashboard > Database > Replication
-- Add contest_leaderboard to the publication

-- Create a function to join a contest and add to leaderboard
CREATE OR REPLACE FUNCTION join_contest(
  p_contest_id UUID,
  p_user_name VARCHAR DEFAULT 'Anonymous',
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_leaderboard_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Insert into leaderboard (or update if exists)
  INSERT INTO contest_leaderboard (contest_id, user_id, user_name, user_avatar_url)
  VALUES (p_contest_id, v_user_id, p_user_name, p_avatar_url)
  ON CONFLICT (contest_id, user_id) 
  DO UPDATE SET 
    user_name = EXCLUDED.user_name,
    user_avatar_url = EXCLUDED.user_avatar_url,
    updated_at = NOW()
  RETURNING id INTO v_leaderboard_id;
  
  RETURN v_leaderboard_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to increment referrals for a user in a contest
CREATE OR REPLACE FUNCTION increment_contest_referrals(
  p_contest_id UUID,
  p_increment INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_new_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Update referrals count
  UPDATE contest_leaderboard
  SET 
    referrals_count = referrals_count + p_increment,
    points = (referrals_count + p_increment) * 10, -- 10 points per referral
    last_referral_at = NOW(),
    updated_at = NOW()
  WHERE contest_id = p_contest_id AND user_id = v_user_id
  RETURNING referrals_count INTO v_new_count;
  
  RETURN COALESCE(v_new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE contest_leaderboard IS 'Real-time leaderboard for contest participants';
COMMENT ON COLUMN contest_leaderboard.points IS 'Points earned (10 points per referral)';
COMMENT ON COLUMN contest_leaderboard.rank IS 'Current rank in the contest (auto-calculated)';
COMMENT ON FUNCTION join_contest IS 'Allows a user to join a contest and appear on the leaderboard';
COMMENT ON FUNCTION increment_contest_referrals IS 'Increments referral count for a user in a contest';
