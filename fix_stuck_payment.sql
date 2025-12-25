-- Manual fix for payment that didn't get provider_reference updated
-- This will help identify and fix the specific payment

-- First, find the payment record that's stuck
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
  created_at
FROM payments 
WHERE user_id = '6d4e2861-2a42-4bdd-bc08-a5ef4b3afff9'
  AND status = 'pending'
  AND created_at >= NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

-- If you find the payment ID, you can manually update it with the Paystack reference
-- Replace 'PAYMENT_ID_HERE' with the actual ID and 'REFERENCE_HERE' with the Paystack reference

UPDATE payments 
SET 
  provider_reference = 'REFERENCE_HERE',
  authorization_url = 'https://checkout.paystack.com/PAYMENT_REFERENCE_HERE',
  status = 'completed',
  updated_at = NOW()
WHERE id = 'PAYMENT_ID_HERE';

-- After updating, the verification should work when the user revisits the callback URL
