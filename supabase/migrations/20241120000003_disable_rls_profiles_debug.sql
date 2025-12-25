-- Temporarily disable RLS on profiles table to debug the 406 error
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- This will allow all queries to work without RLS restrictions
-- If the 406 error goes away, we know it's an RLS policy issue
-- If it persists, the issue is something else (column type, query format, etc.)
