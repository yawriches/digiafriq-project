-- Debug query to check the payment record
-- Run this to see what's actually stored in the database

SELECT 
  id,
  user_id,
  membership_package_id,
  amount,
  currency,
  base_currency_amount,
  status,
  provider_reference,
  authorization_url,
  payment_provider,
  created_at,
  updated_at
FROM payments 
WHERE user_id = '6d4e2861-2a42-4bdd-bc08-a5ef4b3afff9'  -- Use the actual user ID from the payment
ORDER BY created_at DESC 
LIMIT 5;

-- Also check for any recent payments with these references
SELECT 
  id,
  status,
  provider_reference,
  authorization_url,
  payment_provider,
  created_at
FROM payments 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
