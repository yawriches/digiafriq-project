# Affiliate Dashboard Updates - Matched to New Implementation

## Overview
Updated the existing affiliate dashboard UI to match the new bulletproof affiliate system implementation.

## Key Changes Made

### 1. **Referral URL Generation** (`src/lib/supabase/referrals.ts`)
- ✅ Updated `generateReferralUrl()` to point to new sales pages:
  - Learner links → `/join/learner?ref={code}`
  - Affiliate/DCS links → `/join/dcs?ref={code}`
- Previously pointed to `/ref/{type}/{code}` which didn't exist

### 2. **Referral Code Hook** (`src/hooks/useReferrals.ts`)
- ✅ Updated `useReferralCode()` to fetch from `affiliate_profiles` table
- Falls back to old `referral_codes` table for backward compatibility
- Fetches `referral_code` directly from affiliate profile
- Added supabase client import

### 3. **Affiliate Data Hook** (`src/lib/hooks/useAffiliateData.ts`)
- ✅ Updated to use new `affiliate_profiles` table structure:
  - `available_balance` - Current withdrawable balance
  - `total_earnings` - Lifetime earnings
  - `lifetime_referrals` - Total referrals count
  - `active_referrals` - Currently active referrals
- Changed default commission rate from 100% to 80%
- Removed complex balance calculation, now uses direct `available_balance` field

### 4. **Commission Types** (`src/lib/supabase/referrals.ts`)
- ✅ Updated `Commission` interface to include new types:
  - `learner_initial` - 80% of learner membership
  - `dcs_addon` - $2 from DCS addon
  - `learner_renewal` - 20% recurring commission
  - Kept old types for backward compatibility

### 5. **Main Dashboard** (`src/app/dashboard/affiliate/page.tsx`)
- ✅ Updated referral link descriptions:
  - **Learner Link**: "Earn 80% commission on learner memberships + 20% recurring on renewals"
  - **Affiliate Link**: "Earn 80% on learner membership + $2 DCS addon bonus + 20% recurring"

### 6. **Referrals Page** (`src/app/dashboard/affiliate/referrals/page.tsx`)
- ✅ Updated commission type display logic:
  - `learner_initial` → "Learner Commission" (blue)
  - `dcs_addon` → "DCS Addon Bonus" (purple)
  - `learner_renewal` → "Renewal Commission" (green)
- ✅ Updated referral link descriptions to match new structure
- Changed "Affiliate Referral" to "DCS Bundle Referral"

## Database Integration

### New Tables Used:
1. **affiliate_profiles**
   - `referral_code` - Unique 8-char code
   - `learner_link` - Full learner referral URL
   - `dcs_link` - Full DCS referral URL
   - `total_earnings` - Lifetime earnings
   - `available_balance` - Current balance
   - `lifetime_referrals` - Total referrals
   - `active_referrals` - Active referrals

2. **commissions**
   - New commission types: `learner_initial`, `dcs_addon`, `learner_renewal`
   - `status`: pending, available, paid, cancelled
   - `commission_amount` - Actual commission earned
   - `commission_rate` - Percentage (0.80 for 80%)

3. **referrals**
   - `link_type`: learner, dcs
   - `initial_purchase_type`: learner, learner_dcs
   - `status`: pending, completed, expired

## Commission Structure

### Learner Membership ($10/year):
- **Initial**: 80% = $8
- **Renewals**: 20% = $2

### Learner + DCS Bundle ($17/year):
- **Learner portion**: 80% of $10 = $8
- **DCS addon**: $2 flat bonus
- **Total initial**: $10
- **Renewals**: 20% of $10 = $2

## User Flow

1. **Affiliate gets DCS addon** → Affiliate profile auto-created with unique code
2. **Affiliate shares links** → Visitors click learner or DCS link
3. **Visitor purchases** → Referral tracked, commission created
4. **Commission credited** → Instantly to `available_balance`
5. **Affiliate withdraws** → Balance transferred via payout system

## Backward Compatibility

- ✅ Falls back to old `referral_codes` table if `affiliate_profiles` doesn't exist
- ✅ Supports both old and new commission types
- ✅ Graceful error handling with default values

## Testing Checklist

- [ ] Verify affiliate links generate correctly
- [ ] Test learner link redirects to `/join/learner?ref=CODE`
- [ ] Test DCS link redirects to `/join/dcs?ref=CODE`
- [ ] Verify commission display shows correct types
- [ ] Check balance calculations use `available_balance`
- [ ] Test referral stats display correctly
- [ ] Verify withdrawal page uses new payout system

## Notes

- The Deno function errors in `supabase/functions/verify-payment/index.ts` are pre-existing and unrelated to these changes
- TypeScript errors in `referrals.ts` line 93 are pre-existing table type issues
- All affiliate dashboard pages now correctly reflect the new commission structure
- Withdrawal functionality ready for payout API integration

## Next Steps

1. Run database migration: `20241209000001_complete_affiliate_system.sql`
2. Test affiliate link generation
3. Verify commission tracking on test purchases
4. Implement payout API integration
5. Test end-to-end affiliate flow
