-- SQL Script to Check Profile Data for Affiliate IDs
-- Run this in your Supabase SQL Editor to debug the leaderboard issue

-- 1. Check how many affiliate profiles exist
SELECT COUNT(*) as total_affiliate_profiles FROM affiliate_profiles;

-- 2. Check top 10 affiliate profiles with their earnings
SELECT 
  id,
  total_earnings,
  created_at
FROM affiliate_profiles 
ORDER BY total_earnings DESC 
LIMIT 10;

-- 3. Check if these affiliate IDs have corresponding profile records
SELECT 
  ap.id as affiliate_id,
  ap.total_earnings,
  p.id as profile_id,
  p.full_name,
  p.email,
  p.created_at as profile_created_at
FROM affiliate_profiles ap
LEFT JOIN profiles p ON ap.id = p.id
ORDER BY ap.total_earnings DESC
LIMIT 10;

-- 4. Count how many affiliate profiles are missing profile records
SELECT 
  COUNT(*) as total_affiliates,
  COUNT(p.id) as affiliates_with_profiles,
  COUNT(*) - COUNT(p.id) as affiliates_without_profiles
FROM affiliate_profiles ap
LEFT JOIN profiles p ON ap.id = p.id;

-- 5. Show affiliate IDs that don't have profile records
SELECT 
  ap.id as missing_profile_affiliate_id,
  ap.total_earnings
FROM affiliate_profiles ap
LEFT JOIN profiles p ON ap.id = p.id
WHERE p.id IS NULL
ORDER BY ap.total_earnings DESC
LIMIT 10;

-- 6. Check profile data quality
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as profiles_with_full_name,
  COUNT(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 END) as profiles_without_full_name,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as profiles_with_email
FROM profiles
WHERE id IN (SELECT id FROM affiliate_profiles);
