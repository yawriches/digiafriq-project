# Deployment Configuration Notes

## Critical Environment Variables

### Payment Callback URL Configuration

**Issue**: Payment callbacks were pointing to `localhost` instead of production URL.

**Solution**: Ensure the following environment variables are set in your deployment platform (Vercel, Netlify, etc.):

```bash
# Production Site URL (REQUIRED)
SITE_URL=https://www.digiafriq.com
# OR
NEXT_PUBLIC_SITE_URL=https://www.digiafriq.com
```

**Where to set these**:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Supabase Edge Functions**: Project Settings → Edge Functions → Environment Variables

### Edge Function Environment Variables

The `initialize-payment` edge function requires:
- `SITE_URL` or `NEXT_PUBLIC_SITE_URL` - Production URL for payment callbacks
- `PAYSTACK_SECRET_KEY` - Paystack API key
- `KORA_SECRET_KEY` - Kora API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Important**: The edge function now defaults to `https://www.digiafriq.com` if environment variables are not set, preventing localhost callbacks in production.

## Recent Fixes Applied

### 1. Logout Redirect Issue (Fixed)
- **File**: `src/middleware.ts`
- **Change**: Prevented `redirectTo` parameter from being added when redirecting to `/login`
- **Result**: Users now land cleanly on `/login` after logout

### 2. Payment Callback URL Issue (Fixed)
- **File**: `supabase/functions/initialize-payment/index.ts`
- **Change**: Default callback URL changed from `localhost:3000` to `https://www.digiafriq.com`
- **Result**: Payment callbacks now always point to production URL

### 3. Role Switching Issue (Fixed)
- **File**: `src/components/RoleSwitcher.tsx`
- **Change**: Replaced `router.push()` with `window.location.href` for full page reload
- **Result**: Role switching now works immediately without requiring manual refresh

### 4. First Login Role Selection (Fixed)
- **File**: `src/app/login/page.tsx`
- **Change**: Added check for `active_role` - users without it are redirected to `/choose-role`
- **Result**: New users are always prompted to select their role on first login

## Deployment Checklist

Before deploying to production:

1. ✅ Set `SITE_URL` or `NEXT_PUBLIC_SITE_URL` environment variable
2. ✅ Verify all payment provider API keys are set
3. ✅ Deploy edge functions with updated environment variables
4. ✅ Test logout flow redirects to `/login` cleanly
5. ✅ Test payment flow uses production callback URL
6. ✅ Test role switching works without manual refresh
7. ✅ Test first-time login redirects to role selection page

## Testing After Deployment

1. **Logout Test**: Log out and verify you land on `/login` without query parameters
2. **Payment Test**: Initiate a payment and check the callback URL in browser network tab
3. **Role Switch Test**: Switch between learner and affiliate roles - should load immediately
4. **First Login Test**: Create a new account and verify role selection page appears

## Support

If issues persist after setting environment variables:
- Check deployment platform logs for environment variable values
- Verify edge functions are redeployed after environment variable changes
- Clear browser cache and cookies before testing
