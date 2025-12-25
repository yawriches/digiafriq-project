# 🔧 Referral Link Generation Fix

## Problem Identified

### What's Happening:
- ✅ User **HAS** DCS addon (`has_digital_cashflow_addon = true`)
- ✅ User **CAN ACCESS** affiliate dashboard (layout check works)
- ❌ User **CANNOT GET** referral links (no affiliate profile)
- ❌ Shows "Generating link..." indefinitely

### Root Cause:
The affiliate dashboard layout checks for DCS addon in `user_memberships` table:
```typescript
// This works correctly ✅
const { hasDCS } = useMembershipDetails();
// Queries: user_memberships.has_digital_cashflow_addon
```

But the referral code hook was trying to fetch from `affiliate_profiles` table:
```typescript
// This fails ❌
const { data: affiliateProfile } = await supabase
  .from('affiliate_profiles')
  .select('referral_code')
```

**The `affiliate_profiles` table doesn't exist yet because the migration hasn't been run!**

## Solution Implemented

### Updated `useReferrals.ts` Hook:

Now the hook:
1. ✅ Tries to fetch from `affiliate_profiles` table
2. ✅ If not found, checks `user_memberships.has_digital_cashflow_addon`
3. ✅ If user has DCS, calls `create_affiliate_profile_on_dcs()` RPC function
4. ✅ Retries fetching the profile after creation

### Code Flow:
```typescript
// Step 1: Try to get affiliate profile
const { data: affiliateProfile } = await supabase
  .from('affiliate_profiles')
  .select('referral_code, created_at')
  .eq('id', user.id)
  .single();

if (affiliateProfile) {
  // Profile exists - use it ✅
  setReferralCode(affiliateProfile);
} else {
  // Step 2: Check if user has DCS addon
  const { data: membership } = await supabase
    .from('user_memberships')
    .select('has_digital_cashflow_addon')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membership?.has_digital_cashflow_addon) {
    // Step 3: Create affiliate profile
    await supabase.rpc('create_affiliate_profile_on_dcs', {
      p_user_id: user.id
    });
    
    // Step 4: Retry fetch
    await loadReferralCode();
  }
}
```

## Critical: Migration Required

### ⚠️ This fix will NOT work until you run the migration!

The migration creates:
- ✅ `affiliate_profiles` table
- ✅ `create_affiliate_profile_on_dcs()` RPC function
- ✅ Automatic trigger on DCS purchase

### To Fix Immediately:

**Option 1: Run Migration (Recommended)**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20241209000001_complete_affiliate_system.sql`
3. Paste and click "Run"
4. Refresh your app

**Option 2: Manual Profile Creation (Temporary)**
If you can't run the migration right now, manually create the profile:

```sql
-- Run this in Supabase SQL Editor
INSERT INTO affiliate_profiles (
  id,
  referral_code,
  learner_link,
  dcs_link,
  total_earnings,
  available_balance,
  lifetime_referrals,
  active_referrals
)
SELECT 
  id,
  UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  'https://digiafriq.com/join/learner?ref=' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  'https://digiafriq.com/join/dcs?ref=' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  0.00,
  0.00,
  0,
  0
FROM auth.users
WHERE id IN (
  SELECT user_id 
  FROM user_memberships 
  WHERE has_digital_cashflow_addon = true 
  AND is_active = true
)
AND id NOT IN (SELECT id FROM affiliate_profiles);
```

## What Happens After Migration

### Automatic Profile Creation:
When a user purchases DCS addon, the trigger automatically:
1. Generates unique 8-character referral code
2. Creates learner link: `/join/learner?ref=CODE`
3. Creates DCS link: `/join/dcs?ref=CODE`
4. Initializes balances to $0
5. Sets referral counts to 0

### Referral Links Will Show:
```
Learner Link: https://digiafriq.com/join/learner?ref=ABC12345
DCS Link: https://digiafriq.com/join/dcs?ref=ABC12345
```

## Testing After Fix

1. ✅ User with DCS addon can access affiliate dashboard
2. ✅ Referral links generate automatically
3. ✅ Links are copyable and shareable
4. ✅ Commission tracking works on purchases
5. ✅ Balance updates correctly

## Summary

### Before Migration:
- ❌ `affiliate_profiles` table doesn't exist
- ❌ RPC function doesn't exist
- ❌ Referral links show "Generating link..."
- ❌ Console error: "No affiliate profile found"

### After Migration:
- ✅ `affiliate_profiles` table exists
- ✅ RPC function auto-creates profiles
- ✅ Referral links generate instantly
- ✅ Full affiliate system operational

**Run the migration to fix the issue!** 🚀
