# 🔍 Debug: "User does not have DCS addon" Error

## Issue
You're seeing "User does not have DCS addon" in console, but:
- ✅ User can access affiliate dashboard
- ✅ Database shows user has DCS addon
- ❌ Referral links not generating

## Debugging Steps

### Step 1: Check Console Logs

I've added detailed logging to `useReferrals.ts`. Check your browser console for:

```
No affiliate profile found. Checking if user has DCS addon...
User ID: [your-user-id]
Membership query result: { membership: {...}, membershipError: null }
has_digital_cashflow_addon value: [true/false/null]
Type of has_digital_cashflow_addon: [boolean/string/undefined]
```

### Step 2: Use Debug Page

Navigate to: `/dashboard/affiliate/debug`

This page shows:
- ✅ User ID and email
- ✅ All user memberships with DCS addon status
- ✅ Affiliate profile (if exists)
- ✅ Full raw data from database

### Step 3: Check Database Directly

Run this in Supabase SQL Editor:

```sql
-- Check user memberships
SELECT 
  id,
  user_id,
  is_active,
  has_digital_cashflow_addon,
  expires_at,
  created_at
FROM user_memberships
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Check if affiliate profile exists
SELECT * FROM affiliate_profiles WHERE id = 'YOUR_USER_ID';

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('affiliate_profiles', 'user_memberships');
```

## Common Issues & Solutions

### Issue 1: `has_digital_cashflow_addon` is NULL

**Symptom:** Column exists but value is NULL

**Solution:** Update the membership:
```sql
UPDATE user_memberships
SET has_digital_cashflow_addon = true
WHERE user_id = 'YOUR_USER_ID'
AND is_active = true;
```

### Issue 2: Multiple Active Memberships

**Symptom:** User has multiple active memberships, query returns wrong one

**Solution:** The hook now uses `.order('created_at', { ascending: false }).limit(1)` to get the latest

**Manual Fix:**
```sql
-- Deactivate old memberships
UPDATE user_memberships
SET is_active = false
WHERE user_id = 'YOUR_USER_ID'
AND id != (
  SELECT id FROM user_memberships 
  WHERE user_id = 'YOUR_USER_ID' 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

### Issue 3: `affiliate_profiles` Table Doesn't Exist

**Symptom:** Error: "Could not find table 'affiliate_profiles'"

**Solution:** Run the migration!
```bash
# In Supabase SQL Editor, run:
supabase/migrations/20241209000001_complete_affiliate_system.sql
```

### Issue 4: RLS Policies Blocking Access

**Symptom:** Query returns null even though data exists

**Solution:** Check RLS policies:
```sql
-- Temporarily disable RLS to test (DON'T DO THIS IN PRODUCTION)
ALTER TABLE user_memberships DISABLE ROW LEVEL SECURITY;

-- Check if data is accessible
SELECT * FROM user_memberships WHERE user_id = 'YOUR_USER_ID';

-- Re-enable RLS
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
```

### Issue 5: Column Name Mismatch

**Symptom:** Column doesn't exist or has different name

**Solution:** Verify column name:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_memberships' 
AND column_name LIKE '%digital%';
```

## Quick Fixes

### Fix 1: Manually Create Affiliate Profile

If migration can't run, manually create profile:

```sql
-- Generate a random 8-character code
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID'; -- Replace with actual user ID
  v_code TEXT := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
BEGIN
  INSERT INTO affiliate_profiles (
    id,
    referral_code,
    learner_link,
    dcs_link,
    total_earnings,
    available_balance,
    lifetime_referrals,
    active_referrals
  ) VALUES (
    v_user_id,
    v_code,
    'https://digiafriq.com/join/learner?ref=' || v_code,
    'https://digiafriq.com/join/dcs?ref=' || v_code,
    0.00,
    0.00,
    0,
    0
  );
END $$;
```

### Fix 2: Force Update DCS Addon Flag

```sql
UPDATE user_memberships
SET has_digital_cashflow_addon = true,
    updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID'
AND is_active = true;
```

### Fix 3: Create Profile for All DCS Users

```sql
INSERT INTO affiliate_profiles (
  id, referral_code, learner_link, dcs_link,
  total_earnings, available_balance, lifetime_referrals, active_referrals
)
SELECT 
  um.user_id,
  UPPER(SUBSTRING(MD5(RANDOM()::TEXT || um.user_id::TEXT) FROM 1 FOR 8)) as code,
  'https://digiafriq.com/join/learner?ref=' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || um.user_id::TEXT) FROM 1 FOR 8)),
  'https://digiafriq.com/join/dcs?ref=' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || um.user_id::TEXT) FROM 1 FOR 8)),
  0.00, 0.00, 0, 0
FROM user_memberships um
WHERE um.has_digital_cashflow_addon = true 
  AND um.is_active = true
  AND NOT EXISTS (SELECT 1 FROM affiliate_profiles WHERE id = um.user_id)
ON CONFLICT (id) DO NOTHING;
```

## Expected Console Output (Working)

When everything works correctly, you should see:

```
No affiliate profile found. Checking if user has DCS addon...
User ID: abc-123-def-456
Membership query result: { 
  membership: { 
    has_digital_cashflow_addon: true, 
    is_active: true, 
    user_id: "abc-123-def-456" 
  }, 
  membershipError: null 
}
has_digital_cashflow_addon value: true
Type of has_digital_cashflow_addon: boolean
User has DCS addon but no affiliate profile. Creating profile...
Affiliate profile created successfully. Retrying fetch...
```

## What to Share for Support

If issue persists, share:

1. **Console logs** from browser (all the debug output)
2. **Debug page screenshot** from `/dashboard/affiliate/debug`
3. **Database query results**:
   ```sql
   SELECT * FROM user_memberships WHERE user_id = 'YOUR_ID';
   SELECT * FROM affiliate_profiles WHERE id = 'YOUR_ID';
   ```
4. **Migration status**: Has the migration been run?

## Next Steps

1. ✅ Open browser console
2. ✅ Navigate to `/dashboard/affiliate/debug`
3. ✅ Check what the debug page shows
4. ✅ Share the console logs and debug page data
5. ✅ Run the appropriate SQL fix based on findings

The detailed logs will tell us exactly where the issue is! 🔍
