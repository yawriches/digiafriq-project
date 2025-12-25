-- Add digital cashflow fields to membership_packages
ALTER TABLE membership_packages
ADD COLUMN has_digital_cashflow boolean DEFAULT false,
ADD COLUMN digital_cashflow_price numeric(10,2) DEFAULT 7.00;

-- Add function to handle role assignment on digital cashflow purchase
CREATE OR REPLACE FUNCTION handle_digital_cashflow_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- If digital cashflow is purchased, add affiliate role
  IF NEW.has_digital_cashflow = true AND OLD.has_digital_cashflow = false THEN
    -- Add affiliate role to available_roles if not present
    UPDATE profiles
    SET available_roles = array_append(available_roles, 'affiliate'::user_role)
    WHERE id = NEW.user_id 
    AND NOT 'affiliate' = ANY(available_roles);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for digital cashflow purchases
CREATE TRIGGER on_digital_cashflow_purchase
  AFTER UPDATE ON user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION handle_digital_cashflow_purchase();
