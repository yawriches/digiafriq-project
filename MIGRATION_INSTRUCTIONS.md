# 🚀 Affiliate System Migration Instructions

## Error You're Seeing
```
Could not find the table 'public.referral_codes' in the schema cache
```

This means the database migration hasn't been run yet.

## ✅ How to Fix

### Option 1: Run Migration via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Copy the Migration SQL**
   - Open: `supabase/migrations/20241209000001_complete_affiliate_system.sql`
   - Copy the ENTIRE contents of the file

4. **Execute the Migration**
   - Paste the SQL into the SQL Editor
   - Click "Run" button
   - Wait for success confirmation

5. **Verify Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should now see these new tables:
     - `affiliate_profiles`
     - `affiliate_links`
     - `referrals`
     - `commissions`
     - `payouts`
     - `payout_commissions`

### Option 2: Run Migration via Supabase CLI

```bash
# Make sure you're in the project directory
cd c:\Users\USER\Desktop\digiafriq

# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push

# Or run specific migration
supabase migration up
```

## 🔍 What the Migration Does

1. **Drops old tables** (if they exist):
   - `referral_codes` (replaced by `affiliate_profiles`)
   - Old `commissions`, `payouts`, etc.

2. **Creates new tables**:
   - `affiliate_profiles` - Stores affiliate data and referral codes
   - `affiliate_links` - Tracks link clicks
   - `referrals` - Manages referral relationships
   - `commissions` - Tracks all commissions
   - `payouts` - Manages withdrawal requests
   - `payout_commissions` - Links payouts to commissions

3. **Sets up RLS policies** - Secure row-level security

4. **Creates functions**:
   - `generate_unique_referral_code()` - Auto-generates codes
   - `create_affiliate_profile_on_dcs()` - Auto-creates profile when user gets DCS
   - `process_payment_commission()` - Handles commission creation
   - `is_referrer_eligible()` - Validates referrer eligibility
   - `track_affiliate_click()` - Tracks link clicks

5. **Creates triggers**:
   - Auto-creates affiliate profile when user purchases DCS addon

## ⚠️ Important Notes

### Before Running Migration:

1. **Backup your database** (if you have important data):
   ```bash
   supabase db dump -f backup.sql
   ```

2. **Check for conflicts**:
   - The migration drops existing tables with these names
   - Make sure you don't have critical data in:
     - `referral_codes`
     - `commissions`
     - `payouts`
     - `referrals`

### After Running Migration:

1. **Refresh your browser** - Clear cache if needed

2. **Test affiliate profile creation**:
   - User with DCS addon should automatically get affiliate profile
   - Check `affiliate_profiles` table

3. **Verify RLS policies**:
   - Users should only see their own data
   - Test with different user accounts

## 🧪 Testing Checklist

After migration, test these:

- [ ] Affiliate dashboard loads without errors
- [ ] Referral links generate correctly
- [ ] Commission tracking works
- [ ] Balance calculations accurate
- [ ] Payout requests can be created
- [ ] RLS policies prevent unauthorized access

## 🆘 Troubleshooting

### If migration fails:

1. **Check error message** - Note the specific error
2. **Verify user permissions** - Ensure you have admin access
3. **Check for locked tables** - Close all connections
4. **Run in parts** - Execute sections of the migration separately

### If tables exist but errors persist:

1. **Clear Supabase cache**:
   - Restart your development server
   - Clear browser cache
   - Refresh Supabase dashboard

2. **Verify table structure**:
   ```sql
   SELECT * FROM affiliate_profiles LIMIT 1;
   ```

3. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'affiliate_profiles';
   ```

## 📞 Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify your Supabase project is active
3. Ensure you have the correct permissions
4. Try running the migration in smaller chunks

## ✨ After Successful Migration

Your affiliate system will be fully operational with:
- ✅ Automatic affiliate profile creation
- ✅ Referral link tracking
- ✅ Commission calculation
- ✅ Instant payout system
- ✅ Secure data access
