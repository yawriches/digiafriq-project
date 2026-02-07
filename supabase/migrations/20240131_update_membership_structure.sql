-- Migration: Update Membership Structure for New Single Membership Model
-- Date: 2024-01-31
-- Purpose: Support new simplified membership structure with affiliate unlock via course completion

-- Step 1: Add new fields to profiles table (phone already exists as 'phone')
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS affiliate_unlocked BOOLEAN DEFAULT FALSE;

-- Step 2: Create index for affiliate_unlocked for performance
CREATE INDEX idx_profiles_affiliate_unlocked ON profiles(affiliate_unlocked);

-- Step 3: Update existing profiles with default values
UPDATE profiles 
SET 
  affiliate_unlocked = FALSE
WHERE affiliate_unlocked IS NULL;

-- Step 4: Create a function to check affiliate eligibility
CREATE OR REPLACE FUNCTION check_affiliate_eligibility(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  course_completed BOOLEAN := FALSE;
  has_active_membership BOOLEAN := FALSE;
BEGIN
  -- Check if user has completed affiliate course
  SELECT EXISTS(
    SELECT 1 FROM enrollments ce
    JOIN courses c ON ce.course_id = c.id
    WHERE ce.user_id = user_id 
    AND ce.completed_at IS NOT NULL
    AND (c.title ILIKE '%affiliate%' OR c.category ILIKE '%affiliate%')
  ) INTO course_completed;
  
  -- Check if user has active membership
  SELECT EXISTS(
    SELECT 1 FROM user_memberships um
    WHERE um.user_id = user_id 
    AND um.is_active = TRUE
  ) INTO has_active_membership;
  
  RETURN course_completed AND has_active_membership;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically unlock affiliate features
CREATE OR REPLACE FUNCTION auto_unlock_affiliate()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if course was just completed
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    -- Check if this is an affiliate course
    IF EXISTS(
      SELECT 1 FROM courses c 
      WHERE c.id = NEW.course_id 
      AND (c.title ILIKE '%affiliate%' OR c.category ILIKE '%affiliate%')
    ) THEN
      -- Unlock affiliate features if user has active membership
      IF check_affiliate_eligibility(NEW.user_id) THEN
        UPDATE profiles 
        SET affiliate_unlocked = TRUE 
        WHERE id = NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for course enrollment completion
DROP TRIGGER IF EXISTS trigger_auto_unlock_affiliate ON enrollments;
CREATE TRIGGER trigger_auto_unlock_affiliate
  AFTER UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_unlock_affiliate();

-- Step 7: Update existing completed affiliate courses to unlock features
UPDATE profiles 
SET affiliate_unlocked = TRUE
WHERE id IN (
  SELECT ce.user_id 
  FROM enrollments ce
  JOIN courses c ON ce.course_id = c.id
  WHERE ce.completed_at IS NOT NULL
  AND (c.title ILIKE '%affiliate%' OR c.category ILIKE '%affiliate%')
  AND EXISTS(
    SELECT 1 FROM user_memberships um 
    WHERE um.user_id = ce.user_id 
    AND um.is_active = TRUE
  )
);

-- Step 8: Add comment to document the changes
COMMENT ON COLUMN profiles.phone IS 'User phone number (required for signup)';
COMMENT ON COLUMN profiles.country IS 'User country (required for signup)';
COMMENT ON COLUMN profiles.affiliate_unlocked IS 'Whether user has unlocked affiliate features by completing affiliate course';

-- Step 9: Create view for affiliate users (for easier queries)
CREATE OR REPLACE VIEW affiliate_users AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.country,
  p.affiliate_unlocked,
  p.active_role,
  p.created_at,
  um.membership_id,
  um.started_at as membership_started_at
FROM profiles p
JOIN user_memberships um ON p.id = um.user_id
WHERE p.affiliate_unlocked = TRUE 
AND um.is_active = TRUE;

-- Step 10: Log the migration
INSERT INTO migration_logs (migration_name, executed_at, status)
VALUES ('20240131_update_membership_structure', NOW(), 'completed')
ON CONFLICT (migration_name) DO UPDATE SET 
  executed_at = NOW(),
  status = 'completed';
