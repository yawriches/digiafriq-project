-- Drop the broken trigger and function that references non-existent field
DROP TRIGGER IF EXISTS on_digital_cashflow_purchase ON user_memberships;
DROP FUNCTION IF EXISTS handle_digital_cashflow_purchase();

-- The has_digital_cashflow field exists on membership_packages, not user_memberships
-- We don't need a trigger for this - the affiliate role assignment should happen
-- during the payment verification process, not via a database trigger
