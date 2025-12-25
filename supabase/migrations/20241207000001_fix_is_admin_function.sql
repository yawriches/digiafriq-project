-- Fix is_admin() function to use active_role instead of role
-- This fixes the issue where admins cannot delete membership packages

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (active_role = 'admin' OR role = 'admin')
  );
END;
$$;

-- Also update is_affiliate function for consistency
CREATE OR REPLACE FUNCTION public.is_affiliate()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (active_role = 'affiliate' OR role = 'affiliate')
  );
END;
$$;
