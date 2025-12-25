-- Add affiliate_lifetime_access field to user_memberships table
-- This will track if the user has lifetime affiliate access regardless of membership expiry

ALTER TABLE user_memberships 
ADD COLUMN affiliate_lifetime_access BOOLEAN DEFAULT FALSE;

-- Add index for better performance
CREATE INDEX idx_user_memberships_affiliate_lifetime ON user_memberships(affiliate_lifetime_access);

-- Update existing affiliate memberships to have lifetime access
UPDATE user_memberships 
SET affiliate_lifetime_access = TRUE 
WHERE membership_package_id IN (
  SELECT id FROM membership_packages 
  WHERE member_type = 'affiliate' OR name ILIKE '%affiliate%'
) AND is_active = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN user_memberships.affiliate_lifetime_access IS 'Indicates if user has lifetime affiliate access even after membership expires';
