-- Fix courses RLS policies to use active_role instead of role
-- This fixes "new row violates row-level security policy" error

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

-- Recreate policies using active_role OR the is_admin() function
-- Policy: Admins can view all courses (including drafts)
CREATE POLICY "Admins can view all courses" 
ON courses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Policy: Admins can insert courses
CREATE POLICY "Admins can insert courses" 
ON courses FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Policy: Admins can update courses
CREATE POLICY "Admins can update courses" 
ON courses FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Policy: Admins can delete courses
CREATE POLICY "Admins can delete courses" 
ON courses FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Also fix modules table RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view modules" ON modules;
DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON modules;
DROP POLICY IF EXISTS "Admins can update modules" ON modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON modules;

CREATE POLICY "Anyone can view modules" 
ON modules FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert modules" 
ON modules FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can update modules" 
ON modules FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can delete modules" 
ON modules FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Also fix lessons table RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON lessons;

CREATE POLICY "Anyone can view lessons" 
ON lessons FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert lessons" 
ON lessons FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can update lessons" 
ON lessons FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can delete lessons" 
ON lessons FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);
