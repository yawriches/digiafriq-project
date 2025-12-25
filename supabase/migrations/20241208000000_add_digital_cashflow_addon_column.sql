-- Add has_digital_cashflow_addon column to user_memberships table
ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS has_digital_cashflow_addon BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN user_memberships.has_digital_cashflow_addon IS 'Indicates if the user purchased the Digital Cashflow System add-on with their membership';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_memberships_has_dcs 
ON user_memberships(has_digital_cashflow_addon) 
WHERE has_digital_cashflow_addon = true;
