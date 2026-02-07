# Membership Structure Migration Guide

## Overview

This migration transforms Digiafriq from a complex multi-tier membership system to a simplified single membership model with course-based affiliate unlock.

## 🎯 What's Changing

### Before (Old System)
- Multiple membership types (learner, affiliate)
- Digital Cashflow System (DCS) addon
- Complex pricing structure
- Manual affiliate activation

### After (New System)
- Single membership: "Digiafriq AI Cashflow Access" ($18/year)
- Affiliate features unlocked by completing affiliate course
- Simplified pricing and user experience
- Automatic affiliate unlock

## 📊 Database Changes

### New Fields in `profiles` table
- `phone_number` - User's phone number (required for signup)
- `country` - User's country (required for signup)  
- `affiliate_unlocked` - Whether user has unlocked affiliate features
- `active_role` - Current active role ('learner' or 'affiliate')

### New Features
- Automatic affiliate unlock when course is completed
- Database triggers for real-time status updates
- `affiliate_users` view for easier affiliate management
- `check_affiliate_eligibility()` function for validation

## 🚀 Migration Steps

### 1. Backup Your Database
```bash
# Always backup before migration!
pg_dump your_database > backup_before_migration.sql
```

### 2. Run Migration Script

#### Option A: Automatic Script
```bash
node scripts/run-migration.js
```

#### Option B: Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20240131_update_membership_structure.sql`
3. Paste and run the migration

#### Option C: Manual psql
```bash
psql "your-connection-string" -f supabase/migrations/20240131_update_membership_structure.sql
```

### 3. Update TypeScript Types
The migration includes updated types in `supabase/types.ts` that reflect the new schema.

### 4. Test the Changes
- Test user signup with new fields
- Verify affiliate unlock functionality
- Check admin dashboard functionality

## 🔄 Data Migration Details

### Existing Users
- All existing users keep their active memberships
- `phone_number` and `country` set to NULL (can be updated later)
- `affiliate_unlocked` set based on completed affiliate courses
- `active_role` defaults to 'learner'

### Course Completion Check
The migration automatically:
1. Finds users who completed affiliate courses
2. Checks if they have active memberships
3. Unlocks affiliate features for eligible users

## 🧪 Testing Checklist

### User Signup
- [ ] Phone number and country fields work
- [ ] Validation works correctly
- [ ] Users are redirected to learner dashboard

### Affiliate Unlock
- [ ] Affiliate course completion triggers unlock
- [ ] API endpoints work correctly
- [ ] Affiliate dashboard is accessible after unlock

### Admin Dashboard
- [ ] Membership list shows simplified structure
- [ ] Payments page works without DCS references
- [ ] User management shows new fields

### API Endpoints
- [ ] `/api/affiliate/unlock` GET method works
- [ ] `/api/affiliate/unlock` POST method works
- [ ] Signup API handles new fields

## 🔧 Post-Migration Tasks

### 1. Update Signup Form
The signup form now needs to collect:
- Phone number (required)
- Country (required)
- Remove role selection

### 2. Create Affiliate Course
Ensure you have an affiliate course with:
- Title containing "affiliate"
- Category containing "affiliate" (optional)
- Proper lessons and completion tracking

### 3. Update Admin Content
- Remove references to "Digital Cashflow System"
- Update marketing materials
- Update help documentation

## 🚨 Rollback Plan

If something goes wrong, you can rollback:

### 1. Restore from Backup
```bash
psql your_database < backup_before_migration.sql
```

### 2. Manual Rollback (if no backup)
```sql
-- Remove new columns
ALTER TABLE profiles DROP COLUMN IF EXISTS phone_number;
ALTER TABLE profiles DROP COLUMN IF EXISTS country;
ALTER TABLE profiles DROP COLUMN IF EXISTS affiliate_unlocked;
ALTER TABLE profiles DROP COLUMN IF EXISTS active_role;

-- Remove new functions and triggers
DROP FUNCTION IF EXISTS check_affiliate_eligibility;
DROP FUNCTION IF EXISTS auto_unlock_affiliate;
DROP TRIGGER IF EXISTS trigger_auto_unlock_affiliate ON course_enrollments;
DROP VIEW IF EXISTS affiliate_users;
```

## 📞 Support

If you encounter issues:

1. Check the migration logs for errors
2. Verify your database connection
3. Ensure you have proper permissions
4. Contact the development team with error details

## ✅ Success Indicators

Migration is successful when:
- All existing users maintain access
- New signup fields work correctly
- Affiliate unlock functions automatically
- Admin dashboards show simplified structure
- No TypeScript errors in the codebase

---

**Migration Date**: 2024-01-31  
**Version**: 2.0.0  
**Compatibility**: Node.js 18+, Supabase
