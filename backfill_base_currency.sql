-- Backfill existing payments with base currency amounts
-- This script updates all existing payments with the USD price from their membership packages

UPDATE payments 
SET base_currency_amount = membership_packages.price
FROM membership_packages
WHERE payments.membership_package_id = membership_packages.id
  AND payments.base_currency_amount IS NULL;

-- Show results
SELECT 
  COUNT(*) as updated_payments,
  SUM(base_currency_amount) as total_base_usd
FROM payments 
WHERE base_currency_amount IS NOT NULL;
