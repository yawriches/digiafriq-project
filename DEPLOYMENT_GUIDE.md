# Production Deployment Guide

## Overview
This guide walks through deploying Digiafriq to production with all security fixes applied.

---

## Phase 1: Pre-Deployment Setup (Local)

### 1. Verify All Migrations Are Ready
```bash
# Check migrations exist
ls supabase/migrations/

# Expected files:
# - 20241122000002_enable_rls_with_proper_policies.sql
# - 20241123000000_fix_function_search_paths.sql
# - 20241123000001_enable_password_protection.sql
```

### 2. Test Locally
```bash
# Start dev server
npm run dev

# Test signup flow
# - Create new account
# - Verify password validation works
# - Check no timeout errors in console

# Test login flow
# - Login with valid credentials
# - Verify redirect to choose-role
# - Select role and verify dashboard access

# Test existing user
# - Login with existing account
# - Verify direct dashboard access (skip choose-role)
```

### 3. Verify Environment Variables
```bash
# Check .env.local has:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# These should NOT be in git (already in .gitignore)
```

---

## Phase 2: Supabase Dashboard Configuration

### 1. Enable Password Strength Checking
1. Go to **Supabase Dashboard**
2. Select your project
3. Go to **Authentication → Providers → Password**
4. Enable **"Require password strength checking"**
5. Set minimum password length to **12**
6. Save changes

### 2. Enable Email Confirmation
1. Go to **Authentication → Email Templates**
2. Ensure **"Confirm email"** is enabled
3. Customize email template if desired
4. Test email sending

### 3. Configure SMTP (Optional but Recommended)
1. Go to **Authentication → Email Templates**
2. Click **"Configure SMTP"**
3. Enter your email provider details
4. Test email sending

### 4. Set Up OAuth (Optional)
1. Go to **Authentication → Providers**
2. Enable desired providers (Google, GitHub, etc.)
3. Add OAuth credentials
4. Test OAuth flow

---

## Phase 3: Apply Database Migrations

### 1. Access Supabase SQL Editor
1. Go to **Supabase Dashboard**
2. Select your project
3. Go to **SQL Editor**

### 2. Run Migrations in Order

#### Migration 1: Enable RLS with Proper Policies
```sql
-- Copy entire contents of:
-- supabase/migrations/20241122000002_enable_rls_with_proper_policies.sql
-- Paste into SQL Editor and run
```

**Verify:**
- No errors in console
- RLS is enabled on profiles table
- 4 policies created (view, insert, update, service_role)

#### Migration 2: Fix Function Search Paths
```sql
-- Copy entire contents of:
-- supabase/migrations/20241123000000_fix_function_search_paths.sql
-- Paste into SQL Editor and run
```

**Verify:**
- All 49 functions updated
- No errors in console
- Functions have `SET search_path = public`

#### Migration 3: Enable Password Protection
```sql
-- Copy entire contents of:
-- supabase/migrations/20241123000001_enable_password_protection.sql
-- Paste into SQL Editor and run
```

**Verify:**
- `auth_audit_logs` table created
- Functions created: `validate_password_strength()`, `log_auth_event()`, `check_suspicious_activity()`
- Indexes created for performance

### 3. Verify Migrations Applied
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';

-- Check functions have search_path
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname = 'is_admin';
```

---

## Phase 4: Test Production Environment

### 1. Test Authentication Flow
```
1. Sign up new account
   - Enter email, password, name
   - Verify password validation (12+ chars, mixed case, etc.)
   - Check confirmation email sent
   - Verify email confirmation works

2. Login
   - Use new account credentials
   - Verify redirected to choose-role
   - Select learner role
   - Verify redirected to /dashboard/learner/membership

3. Existing user
   - Login with existing account
   - Verify direct dashboard access
   - Check no "checking session" loops
```

### 2. Test Database Security
```sql
-- Verify RLS is working
-- As authenticated user, try to access another user's profile
SELECT * FROM profiles WHERE id != auth.uid();
-- Should return no rows (RLS blocking access)

-- Verify function search paths
SELECT proconfig FROM pg_proc WHERE proname = 'is_admin';
-- Should show: {search_path=public}
```

### 3. Check Audit Logs
```sql
-- Verify auth events are logged
SELECT * FROM auth_audit_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Should see login, signup events
```

### 4. Monitor Console
- No "Profile fetch timeout" errors
- No "Error creating profile" errors
- No "Error fetching affiliate payment status" errors
- Clean console with only expected logs

---

## Phase 5: Deploy to Production

### 1. Build Application
```bash
# Build Next.js app
npm run build

# Verify build succeeds
# Check for any TypeScript errors
```

### 2. Deploy to Hosting
```bash
# Using Vercel (recommended for Next.js)
vercel deploy --prod

# Or your preferred hosting provider
# (Netlify, AWS, Google Cloud, etc.)
```

### 3. Set Environment Variables
In your hosting provider's dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Verify Deployment
1. Visit production URL
2. Test signup flow
3. Test login flow
4. Check browser console for errors
5. Verify database connections work

---

## Phase 6: Post-Deployment Monitoring

### 1. Set Up Monitoring
- [ ] Monitor auth_audit_logs for suspicious activity
- [ ] Set up alerts for failed login attempts
- [ ] Monitor database performance
- [ ] Check error logs daily

### 2. Weekly Tasks
- [ ] Review auth_audit_logs
- [ ] Check for suspicious login patterns
- [ ] Verify email delivery
- [ ] Monitor database size

### 3. Monthly Tasks
- [ ] Review security policies
- [ ] Update dependencies
- [ ] Check for Supabase updates
- [ ] Review user feedback

---

## Troubleshooting

### Issue: "Profile fetch timeout" errors
**Solution:**
- Verify RLS policies are correct
- Check database performance
- Ensure no circular dependencies in functions

### Issue: Password validation not working
**Solution:**
- Verify migration 3 was applied
- Check Supabase Dashboard password settings
- Ensure minimum length is set to 12

### Issue: Login redirect loops
**Solution:**
- Check middleware.ts is simplified
- Verify dashboard/layout.tsx exists
- Clear browser cookies and try again

### Issue: "Permission denied" errors
**Solution:**
- Verify RLS policies exist
- Check service_role policy is created
- Ensure user has proper session

### Issue: Email confirmation not working
**Solution:**
- Verify SMTP is configured
- Check email templates in Dashboard
- Test email sending manually

---

## Rollback Plan

If issues occur in production:

### 1. Immediate Actions
```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous version
git checkout <previous-commit>
npm run build
vercel deploy --prod
```

### 2. Database Rollback
If migrations cause issues:
```sql
-- Disable RLS temporarily (if blocking access)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Or drop problematic policies
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;

-- Restore from backup
-- Contact Supabase support for database restore
```

### 3. Communication
- Notify users of issue
- Provide status updates
- Estimate time to resolution
- Document what went wrong

---

## Security Checklist

Before going live, verify:

- [ ] All 3 migrations applied successfully
- [ ] Password strength checking enabled
- [ ] Email confirmation enabled
- [ ] RLS policies in place
- [ ] No console errors
- [ ] Auth audit logs working
- [ ] HTTPS enabled on domain
- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] Monitoring and alerts set up

---

## Success Criteria

Deployment is successful when:

✅ Users can sign up with password validation
✅ Users can login and access dashboard
✅ No timeout or permission errors
✅ Auth audit logs record events
✅ RLS prevents unauthorized access
✅ Email confirmation works
✅ No sensitive data in logs
✅ Performance is acceptable
✅ All tests pass
✅ Monitoring is active

---

## Support

If you encounter issues:

1. **Check logs:**
   - Browser console (F12)
   - Supabase Dashboard → Logs
   - Application error tracking

2. **Review documentation:**
   - SECURITY_FIXES.md
   - Supabase docs
   - Next.js docs

3. **Contact support:**
   - Supabase support: support@supabase.io
   - Your hosting provider support
   - Development team

---

## Next Steps

After successful deployment:

1. Monitor for issues (24/7 for first week)
2. Gather user feedback
3. Plan feature improvements
4. Schedule security audits
5. Plan scaling strategy

Congratulations! Your application is now production-ready! 🚀
