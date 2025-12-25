-- Backfill paid_at for existing completed payments
-- This will update existing payments with their updated_at timestamp as paid_at

UPDATE payments 
SET paid_at = updated_at
WHERE status = 'completed' 
  AND paid_at IS NULL;

-- Show results
SELECT 
  COUNT(*) as updated_payments,
  MIN(paid_at) as earliest_payment,
  MAX(paid_at) as latest_payment
FROM payments 
WHERE paid_at IS NOT NULL;
