-- Add base_currency_amount column to payments table
-- This will store the USD equivalent amount for analytics purposes

ALTER TABLE payments 
ADD COLUMN base_currency_amount DECIMAL(10,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN payments.base_currency_amount IS 'Base currency amount in USD for analytics purposes. Equal to membership package price in USD.';
