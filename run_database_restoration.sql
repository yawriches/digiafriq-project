-- =============================================================================
-- DIGIAFRIQ DATABASE RESTORATION - MASTER SCRIPT
-- =============================================================================
-- This script runs all database restoration parts in the correct order
-- Copy and paste each section into your Supabase SQL Editor one by one

-- STEP 1: Run database_restoration.sql first
-- STEP 2: Run database_restoration_part2.sql
-- STEP 3: Run database_restoration_part3.sql  
-- STEP 4: Run database_restoration_part4.sql
-- STEP 5: Run database_restoration_final.sql

-- OR copy the content from each file and run them sequentially in Supabase SQL Editor

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these after restoration to verify everything is working:

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- =============================================================================
-- SAMPLE DATA INSERTION (OPTIONAL)
-- =============================================================================
-- After restoration, you can insert sample data for testing

-- Create a sample admin user (replace with your actual user ID)
-- INSERT INTO profiles (id, email, full_name, role, active_role, available_roles)
-- VALUES (
--     'your-user-id-here',
--     'admin@digiafriq.com',
--     'Admin User',
--     'admin',
--     'admin',
--     ARRAY['admin', 'affiliate', 'learner']::user_role[]
-- );

SELECT 'Database restoration script ready. Run each part sequentially in Supabase SQL Editor.' as instructions;
