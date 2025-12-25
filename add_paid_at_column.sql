-- Add paid_at column to payments table
-- This will store when the payment was actually completed

ALTER TABLE payments 
ADD COLUMN paid_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN payments.paid_at IS 'Timestamp when payment was completed and verified';
