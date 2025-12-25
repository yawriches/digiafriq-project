-- Set admin role for a specific user
-- Replace 'your-email@example.com' with your actual email address

-- Update the role to admin for your user
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE role = 'admin';

-- Alternative: If you want to set the first user as admin
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1);
