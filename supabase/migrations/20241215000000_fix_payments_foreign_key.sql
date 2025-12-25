-- Migration: Fix foreign key constraint on payments table
-- Allow deletion of membership_packages by setting NULL on related payments

-- Drop the existing foreign key constraint
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_membership_package_id_fkey;

-- Re-add the foreign key with ON DELETE SET NULL
-- This means when a membership_package is deleted, the payment record remains but membership_package_id becomes NULL
ALTER TABLE payments
ADD CONSTRAINT payments_membership_package_id_fkey
FOREIGN KEY (membership_package_id)
REFERENCES membership_packages(id)
ON DELETE SET NULL;

-- Alternative: If you want to CASCADE delete (delete payments when membership is deleted), use:
-- ON DELETE CASCADE
-- But SET NULL is safer as it preserves payment history
