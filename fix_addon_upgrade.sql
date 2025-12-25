-- Fix for user who paid for DCS addon but didn't get the addon enabled
-- This happens when payment_type was 'membership' instead of 'addon_upgrade'

-- First, find the affected payment(s) - replace 'USER_EMAIL' with the actual email
SELECT 
    p.id as payment_id,
    p.user_id,
    p.payment_type,
    p.metadata,
    p.status,
    p.created_at,
    pr.email,
    um.has_digital_cashflow_addon,
    um.is_active
FROM payments p
JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN user_memberships um ON p.user_id = um.user_id AND um.is_active = true
WHERE pr.email = 'USER_EMAIL'  -- Replace with actual email
ORDER BY p.created_at DESC
LIMIT 5;

-- If you find the payment and confirm it should have been an addon upgrade,
-- run this to enable the DCS addon for the user:

-- Option 1: Update by user email
UPDATE user_memberships 
SET has_digital_cashflow_addon = true
WHERE user_id = (SELECT id FROM profiles WHERE email = 'USER_EMAIL')  -- Replace with actual email
AND is_active = true;

-- Option 2: Update by user_id directly (if you know the user_id)
-- UPDATE user_memberships 
-- SET has_digital_cashflow_addon = true
-- WHERE user_id = 'USER_UUID_HERE'
-- AND is_active = true;

-- Verify the fix
SELECT 
    um.user_id,
    pr.email,
    um.has_digital_cashflow_addon,
    um.is_active,
    um.expires_at
FROM user_memberships um
JOIN profiles pr ON um.user_id = pr.id
WHERE pr.email = 'USER_EMAIL'  -- Replace with actual email
AND um.is_active = true;
