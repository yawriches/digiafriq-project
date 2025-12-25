-- Add affiliate_id column to payments table
-- This will store the affiliate ID when payment is made through an affiliate link

ALTER TABLE payments 
ADD COLUMN affiliate_id UUID DEFAULT NULL REFERENCES profiles(id);

-- Add comment for documentation
COMMENT ON COLUMN payments.affiliate_id IS 'ID of the affiliate who referred this payment (nullable)';
