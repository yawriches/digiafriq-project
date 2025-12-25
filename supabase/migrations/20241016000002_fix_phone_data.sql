-- Fix phone number data issues
-- This migration addresses potential phone number storage problems

-- Create a function to help debug phone number issues
CREATE OR REPLACE FUNCTION debug_phone_numbers()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    phone TEXT,
    country TEXT,
    issue TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.phone,
        p.country,
        CASE 
            WHEN p.phone IS NULL THEN 'Phone is NULL'
            WHEN p.phone = '' THEN 'Phone is empty string'
            WHEN LENGTH(p.phone) < 5 THEN 'Phone too short'
            WHEN p.phone NOT LIKE '+%' THEN 'Phone missing country code'
            ELSE 'Phone looks OK'
        END as issue
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Run the debug function to see current state
SELECT * FROM debug_phone_numbers();

-- Optional: Clean up any empty string phone numbers to NULL
UPDATE profiles 
SET phone = NULL 
WHERE phone = '' OR phone = ' ';

-- Optional: Add a trigger to ensure phone numbers are properly formatted when inserted/updated
CREATE OR REPLACE FUNCTION format_phone_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Trim whitespace and convert empty strings to NULL
    IF NEW.phone IS NOT NULL THEN
        NEW.phone = TRIM(NEW.phone);
        IF NEW.phone = '' THEN
            NEW.phone = NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically format phone numbers
DROP TRIGGER IF EXISTS format_phone_trigger ON profiles;
CREATE TRIGGER format_phone_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION format_phone_number();
