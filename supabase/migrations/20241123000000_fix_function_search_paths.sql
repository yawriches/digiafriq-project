-- Fix function search_path security warnings
-- This migration adds SET search_path to all functions to prevent SQL injection

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_notes_count_trigger ON course_notes;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON profiles;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON user_enrollments;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON courses;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON affiliate_profiles;
DROP TRIGGER IF EXISTS update_contest_status_trigger ON contests;
DROP TRIGGER IF EXISTS update_affiliate_levels_trigger ON affiliate_commissions;

-- Drop all functions (now that triggers are gone)
DROP FUNCTION IF EXISTS public.activate_user_account(uuid);
DROP FUNCTION IF EXISTS public.user_has_course_access_via_membership(uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_toggle_user_activation(uuid);
DROP FUNCTION IF EXISTS public.add_role_to_user(uuid, user_role);
DROP FUNCTION IF EXISTS public.get_user_active_memberships(uuid);
DROP FUNCTION IF EXISTS public.format_phone_number(text);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.increment_tutorial_views(uuid);
DROP FUNCTION IF EXISTS public.mark_affiliate_paid(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.update_notes_count();
DROP FUNCTION IF EXISTS public.update_affiliate_pending_earnings(uuid);
DROP FUNCTION IF EXISTS public.log_user_activity(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.trigger_update_contest_status();
DROP FUNCTION IF EXISTS public.create_audit_trail(uuid, text, text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.get_user_statistics(uuid);
DROP FUNCTION IF EXISTS public.get_user_activity_summary(uuid);
DROP FUNCTION IF EXISTS public.switch_active_role(uuid, user_role);
DROP FUNCTION IF EXISTS public.update_contest_status(uuid, text);
DROP FUNCTION IF EXISTS public.user_has_role(uuid, user_role);
DROP FUNCTION IF EXISTS public.generate_secure_referral_code();
DROP FUNCTION IF EXISTS public.process_referral_commission(uuid, uuid, numeric);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_affiliate();
DROP FUNCTION IF EXISTS public.get_affiliate_by_code(text);
DROP FUNCTION IF EXISTS public.calculate_affiliate_commission(numeric, numeric);
DROP FUNCTION IF EXISTS public.process_affiliate_payment(uuid, numeric);
DROP FUNCTION IF EXISTS public.get_platform_affiliate_revenue();
DROP FUNCTION IF EXISTS public.get_total_affiliate_referral_revenue(uuid);
DROP FUNCTION IF EXISTS public.generate_affiliate_code();
DROP FUNCTION IF EXISTS public.get_course_stats(uuid);
DROP FUNCTION IF EXISTS public.is_user_active(uuid);
DROP FUNCTION IF EXISTS public.suspend_user(uuid);
DROP FUNCTION IF EXISTS public.create_affiliate_profile(uuid, numeric);
DROP FUNCTION IF EXISTS public.get_affiliate_stats(uuid);
DROP FUNCTION IF EXISTS public.create_notification(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.mark_all_notifications_read(uuid);
DROP FUNCTION IF EXISTS public.reactivate_user(uuid);
DROP FUNCTION IF EXISTS public.calculate_course_progress(uuid);
DROP FUNCTION IF EXISTS public.update_enrollment_progress(uuid, uuid);
DROP FUNCTION IF EXISTS public.create_commission(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.generate_referral_code();
DROP FUNCTION IF EXISTS public.get_affiliate_level_by_rank(int);
DROP FUNCTION IF EXISTS public.update_all_affiliate_levels();
DROP FUNCTION IF EXISTS public.trigger_update_affiliate_levels();
DROP FUNCTION IF EXISTS public.mark_learner_paid(uuid, uuid, numeric, text);
DROP FUNCTION IF EXISTS public.get_active_plans();
DROP FUNCTION IF EXISTS public.get_promotable_learner_plans();
DROP FUNCTION IF EXISTS public.get_plan_statistics(uuid);

-- Now recreate all functions with proper search_path

-- 1. activate_user_account
CREATE FUNCTION public.activate_user_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET is_active = true WHERE id = user_id;
END;
$$;

-- 2. user_has_course_access_via_membership
CREATE FUNCTION public.user_has_course_access_via_membership(user_id uuid, course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_memberships um
    JOIN membership_packages mp ON um.membership_id = mp.id
    WHERE um.user_id = user_id
    AND um.is_active = true
    AND um.expires_at > now()
    AND mp.id = course_id
  );
END;
$$;

-- 3. admin_toggle_user_activation
CREATE FUNCTION public.admin_toggle_user_activation(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET is_active = NOT is_active WHERE id = user_id;
END;
$$;

-- 4. add_role_to_user
CREATE FUNCTION public.add_role_to_user(user_id uuid, new_role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET available_roles = array_append(available_roles, new_role)
  WHERE id = user_id AND NOT (new_role = ANY(available_roles));
END;
$$;

-- 5. get_user_active_memberships
CREATE FUNCTION public.get_user_active_memberships(user_id uuid)
RETURNS TABLE(id uuid, membership_type text, expires_at timestamp)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT um.id, um.membership_type::text, um.expires_at
  FROM user_memberships um
  WHERE um.user_id = user_id
  AND um.is_active = true
  AND um.expires_at > now();
END;
$$;

-- 6. format_phone_number
CREATE FUNCTION public.format_phone_number(phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN regexp_replace(phone, '[^0-9+]', '', 'g');
END;
$$;

-- 7. handle_new_user
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, active_role, available_roles)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'learner',
    'learner',
    ARRAY['learner']::user_role[]
  );
  RETURN new;
END;
$$;

-- 8. increment_tutorial_views
CREATE FUNCTION public.increment_tutorial_views(tutorial_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tutorials SET views = views + 1 WHERE id = tutorial_id;
END;
$$;

-- 9. mark_affiliate_paid
CREATE FUNCTION public.mark_affiliate_paid(affiliate_id uuid, amount numeric, reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_profiles 
  SET has_paid = true, payment_date = now(), payment_amount = amount, payment_reference = reference
  WHERE user_id = affiliate_id;
END;
$$;

-- 10. update_notes_count
CREATE FUNCTION public.update_notes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_course_progress 
  SET notes_count = (SELECT COUNT(*) FROM course_notes WHERE progress_id = NEW.progress_id)
  WHERE id = NEW.progress_id;
  RETURN NEW;
END;
$$;

-- 11. update_affiliate_pending_earnings
CREATE FUNCTION public.update_affiliate_pending_earnings(affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_profiles 
  SET pending_earnings = (
    SELECT COALESCE(SUM(amount), 0) FROM affiliate_commissions 
    WHERE affiliate_id = affiliate_id AND status = 'pending'
  )
  WHERE user_id = affiliate_id;
END;
$$;

-- 12. log_user_activity
CREATE FUNCTION public.log_user_activity(user_id uuid, activity_type text, details jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_activity_logs (user_id, activity_type, details)
  VALUES (user_id, activity_type, details);
END;
$$;

-- 13. update_updated_at_column
CREATE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 14. trigger_update_contest_status
CREATE FUNCTION public.trigger_update_contest_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.end_date < now() THEN
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$;

-- 15. create_audit_trail
CREATE FUNCTION public.create_audit_trail(user_id uuid, action text, table_name text, record_id uuid, changes jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, changes)
  VALUES (user_id, action, table_name, record_id, changes);
END;
$$;

-- 16. get_user_statistics
CREATE FUNCTION public.get_user_statistics(user_id uuid)
RETURNS TABLE(total_courses int, completed_courses int, total_earnings numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ue.course_id)::int as total_courses,
    COUNT(DISTINCT CASE WHEN ucp.progress >= 100 THEN ucp.course_id END)::int as completed_courses,
    COALESCE(SUM(ac.amount), 0)::numeric as total_earnings
  FROM user_enrollments ue
  LEFT JOIN user_course_progress ucp ON ue.id = ucp.enrollment_id
  LEFT JOIN affiliate_commissions ac ON ac.affiliate_id = user_id AND ac.status = 'paid'
  WHERE ue.user_id = user_id;
END;
$$;

-- 17. get_user_activity_summary
CREATE FUNCTION public.get_user_activity_summary(user_id uuid)
RETURNS TABLE(last_login timestamp, total_logins int, last_activity timestamp)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MAX(CASE WHEN activity_type = 'login' THEN created_at END) as last_login,
    COUNT(CASE WHEN activity_type = 'login' THEN 1 END)::int as total_logins,
    MAX(created_at) as last_activity
  FROM user_activity_logs
  WHERE user_id = user_id;
END;
$$;

-- 18. switch_active_role
CREATE FUNCTION public.switch_active_role(user_id uuid, new_role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET active_role = new_role
  WHERE id = user_id AND new_role = ANY(available_roles);
END;
$$;

-- 19. update_contest_status
CREATE FUNCTION public.update_contest_status(contest_id uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE contests SET status = new_status WHERE id = contest_id;
END;
$$;

-- 20. user_has_role
CREATE FUNCTION public.user_has_role(user_id uuid, role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = user_has_role.role
  );
END;
$$;

-- 21. generate_secure_referral_code
CREATE FUNCTION public.generate_secure_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN substr(md5(random()::text || now()::text), 1, 8);
END;
$$;

-- 22. process_referral_commission
CREATE FUNCTION public.process_referral_commission(referrer_id uuid, referred_user_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO affiliate_commissions (affiliate_id, referred_user_id, amount, status)
  VALUES (referrer_id, referred_user_id, amount, 'pending');
END;
$$;

-- 23. is_admin
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 24. is_affiliate
CREATE FUNCTION public.is_affiliate()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'affiliate'
  );
END;
$$;

-- 25. get_affiliate_by_code
CREATE FUNCTION public.get_affiliate_by_code(code text)
RETURNS TABLE(id uuid, user_id uuid, commission_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ap.id, ap.user_id, ap.commission_rate
  FROM affiliate_profiles ap
  WHERE ap.referral_code = code;
END;
$$;

-- 26. calculate_affiliate_commission
CREATE FUNCTION public.calculate_affiliate_commission(amount numeric, commission_rate numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (amount * commission_rate) / 100;
END;
$$;

-- 27. process_affiliate_payment
CREATE FUNCTION public.process_affiliate_payment(affiliate_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_profiles 
  SET pending_earnings = pending_earnings - amount, total_paid = total_paid + amount
  WHERE user_id = affiliate_id;
END;
$$;

-- 28. get_platform_affiliate_revenue
CREATE FUNCTION public.get_platform_affiliate_revenue()
RETURNS TABLE(total_revenue numeric, total_paid numeric, pending_revenue numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(amount), 0)::numeric as total_revenue,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::numeric as total_paid,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::numeric as pending_revenue
  FROM affiliate_commissions;
END;
$$;

-- 29. get_total_affiliate_referral_revenue
CREATE FUNCTION public.get_total_affiliate_referral_revenue(affiliate_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM affiliate_commissions
  WHERE affiliate_id = affiliate_id;
  RETURN total;
END;
$$;

-- 30. generate_affiliate_code
CREATE FUNCTION public.generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'AFF_' || substr(md5(random()::text || now()::text), 1, 12);
END;
$$;

-- 31. get_course_stats
CREATE FUNCTION public.get_course_stats(course_id uuid)
RETURNS TABLE(total_enrollments int, completed_count int, in_progress_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::int as total_enrollments,
    COUNT(CASE WHEN progress >= 100 THEN 1 END)::int as completed_count,
    COUNT(CASE WHEN progress < 100 THEN 1 END)::int as in_progress_count
  FROM user_course_progress
  WHERE course_id = course_id;
END;
$$;

-- 32. is_user_active
CREATE FUNCTION public.is_user_active(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND is_active = true
  );
END;
$$;

-- 33. suspend_user
CREATE FUNCTION public.suspend_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET is_active = false WHERE id = user_id;
END;
$$;

-- 34. create_affiliate_profile
CREATE FUNCTION public.create_affiliate_profile(user_id uuid, commission_rate numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO affiliate_profiles (user_id, commission_rate, referral_code)
  VALUES (user_id, commission_rate, generate_affiliate_code());
END;
$$;

-- 35. get_affiliate_stats
CREATE FUNCTION public.get_affiliate_stats(affiliate_id uuid)
RETURNS TABLE(total_referrals int, total_commissions numeric, pending_commissions numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT referred_user_id)::int as total_referrals,
    COALESCE(SUM(amount), 0)::numeric as total_commissions,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::numeric as pending_commissions
  FROM affiliate_commissions
  WHERE affiliate_commissions.affiliate_id = affiliate_id;
END;
$$;

-- 36. create_notification
CREATE FUNCTION public.create_notification(user_id uuid, title text, message text, notification_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (user_id, title, message, notification_type);
END;
$$;

-- 37. mark_all_notifications_read
CREATE FUNCTION public.mark_all_notifications_read(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications SET is_read = true WHERE user_id = user_id AND is_read = false;
END;
$$;

-- 38. reactivate_user
CREATE FUNCTION public.reactivate_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET is_active = true WHERE id = user_id;
END;
$$;

-- 39. calculate_course_progress
CREATE FUNCTION public.calculate_course_progress(enrollment_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress numeric;
BEGIN
  SELECT (COUNT(CASE WHEN completed = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100
  INTO progress
  FROM course_lessons
  WHERE course_id = (SELECT course_id FROM user_enrollments WHERE id = enrollment_id);
  RETURN COALESCE(progress, 0);
END;
$$;

-- 40. update_enrollment_progress
CREATE FUNCTION public.update_enrollment_progress(enrollment_id uuid, lesson_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_lesson_progress (enrollment_id, lesson_id, completed)
  VALUES (enrollment_id, lesson_id, true)
  ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET completed = true;
END;
$$;

-- 41. create_commission
CREATE FUNCTION public.create_commission(affiliate_id uuid, amount numeric, commission_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO affiliate_commissions (affiliate_id, amount, status)
  VALUES (affiliate_id, amount, 'pending');
END;
$$;

-- 42. generate_referral_code
CREATE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'REF_' || substr(md5(random()::text || now()::text), 1, 12);
END;
$$;

-- 43. get_affiliate_level_by_rank
CREATE FUNCTION public.get_affiliate_level_by_rank(rank int)
RETURNS TABLE(level text, min_referrals int, commission_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT al.level, al.min_referrals, al.commission_rate
  FROM affiliate_levels al
  WHERE al.rank = rank;
END;
$$;

-- 44. update_all_affiliate_levels
CREATE FUNCTION public.update_all_affiliate_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_profiles ap
  SET level = (
    SELECT al.level FROM affiliate_levels al
    WHERE al.min_referrals <= (
      SELECT COUNT(DISTINCT referred_user_id) FROM affiliate_commissions WHERE affiliate_id = ap.user_id
    )
    ORDER BY al.min_referrals DESC LIMIT 1
  );
END;
$$;

-- 45. trigger_update_affiliate_levels
CREATE FUNCTION public.trigger_update_affiliate_levels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM update_all_affiliate_levels();
  RETURN NEW;
END;
$$;

-- 46. mark_learner_paid
CREATE FUNCTION public.mark_learner_paid(user_id uuid, membership_id uuid, amount numeric, reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_memberships (user_id, membership_id, is_active, expires_at, payment_reference)
  VALUES (user_id, membership_id, true, now() + interval '1 year', reference);
END;
$$;

-- 47. get_active_plans
CREATE FUNCTION public.get_active_plans()
RETURNS TABLE(id uuid, name text, price numeric, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT mp.id, mp.name, mp.price, mp.is_active
  FROM membership_packages mp
  WHERE mp.is_active = true;
END;
$$;

-- 48. get_promotable_learner_plans
CREATE FUNCTION public.get_promotable_learner_plans()
RETURNS TABLE(id uuid, name text, price numeric, discount_percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT mp.id, mp.name, mp.price, COALESCE(mp.discount_percentage, 0)
  FROM membership_packages mp
  WHERE mp.is_active = true AND mp.membership_type = 'learner';
END;
$$;

-- 49. get_plan_statistics
CREATE FUNCTION public.get_plan_statistics(plan_id uuid)
RETURNS TABLE(total_subscribers int, active_subscribers int, revenue numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::int as total_subscribers,
    COUNT(CASE WHEN is_active = true AND expires_at > now() THEN 1 END)::int as active_subscribers,
    COALESCE(SUM(CASE WHEN is_active = true THEN mp.price ELSE 0 END), 0)::numeric as revenue
  FROM user_memberships um
  JOIN membership_packages mp ON um.membership_id = mp.id
  WHERE mp.id = plan_id;
END;
$$;

-- Recreate triggers that depend on the functions
-- Only create triggers if the tables exist

-- Trigger for auth.users (always exists)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profiles (if table exists)
DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER update_updated_at_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column()';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Trigger for user_enrollments (if table exists)
DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER update_updated_at_trigger
    BEFORE UPDATE ON user_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column()';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Trigger for courses (if table exists)
DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER update_updated_at_trigger
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column()';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Trigger for affiliate_profiles (if table exists)
DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER update_updated_at_trigger
    BEFORE UPDATE ON affiliate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column()';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Trigger for course_notes (if table exists)
DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER update_notes_count_trigger
    AFTER INSERT OR UPDATE ON course_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_notes_count()';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Trigger for contests (if table exists)
DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER update_contest_status_trigger
    BEFORE UPDATE ON contests
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_contest_status()';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Trigger for affiliate_commissions (if table exists)
DO $$
BEGIN
  EXECUTE 'CREATE TRIGGER update_affiliate_levels_trigger
    AFTER INSERT OR UPDATE ON affiliate_commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_affiliate_levels()';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
