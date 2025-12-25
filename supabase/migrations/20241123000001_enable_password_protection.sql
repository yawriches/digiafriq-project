-- Enable Leaked Password Protection in Supabase Auth
-- This migration enables password strength checking against HaveIBeenPwned.org

-- Note: This setting must be enabled in the Supabase Dashboard under:
-- Authentication → Providers → Password → Enable password strength checking

-- For now, we document the requirement and best practices

-- Best practices for password security:
-- 1. Enable "Require email confirmation" in Auth settings
-- 2. Enable "Require password strength checking" (HaveIBeenPwned)
-- 3. Set minimum password length to 12 characters
-- 4. Enforce password complexity requirements

-- Create a function to validate password strength on the database side
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS TABLE(is_valid boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_upper boolean;
  has_lower boolean;
  has_number boolean;
  has_special boolean;
  password_length int;
BEGIN
  password_length := length(password);
  has_upper := password ~ '[A-Z]';
  has_lower := password ~ '[a-z]';
  has_number := password ~ '[0-9]';
  has_special := password ~ '[!@#$%^&*()_+\-=\[\]{};:''",.<>?/\\|`~]';

  IF password_length < 12 THEN
    RETURN QUERY SELECT false, 'Password must be at least 12 characters long';
  ELSIF NOT has_upper THEN
    RETURN QUERY SELECT false, 'Password must contain at least one uppercase letter';
  ELSIF NOT has_lower THEN
    RETURN QUERY SELECT false, 'Password must contain at least one lowercase letter';
  ELSIF NOT has_number THEN
    RETURN QUERY SELECT false, 'Password must contain at least one number';
  ELSIF NOT has_special THEN
    RETURN QUERY SELECT false, 'Password must contain at least one special character';
  ELSE
    RETURN QUERY SELECT true, 'Password meets all strength requirements';
  END IF;
END;
$$;

-- Create audit log for authentication events
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'login', 'signup', 'password_change', 'failed_login'
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamp DEFAULT now()
);

-- Enable RLS on auth_audit_logs
ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role and the user themselves can view their logs
CREATE POLICY "service_role_all_access" ON auth_audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_view_own_logs" ON auth_audit_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Create function to log authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(
  event_type text,
  success boolean DEFAULT true,
  error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO auth_audit_logs (user_id, event_type, success, error_message)
  VALUES (auth.uid(), event_type, success, error_message);
END;
$$;

-- Create function to check for suspicious login activity
CREATE OR REPLACE FUNCTION public.check_suspicious_activity(user_id uuid)
RETURNS TABLE(is_suspicious boolean, failed_attempts int, last_login timestamp)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  failed_count int;
  last_login_time timestamp;
BEGIN
  -- Count failed login attempts in the last hour
  SELECT COUNT(*) INTO failed_count
  FROM auth_audit_logs
  WHERE auth_audit_logs.user_id = check_suspicious_activity.user_id
  AND event_type = 'failed_login'
  AND created_at > now() - interval '1 hour'
  AND success = false;

  -- Get last successful login
  SELECT created_at INTO last_login_time
  FROM auth_audit_logs
  WHERE auth_audit_logs.user_id = check_suspicious_activity.user_id
  AND event_type = 'login'
  AND success = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Flag as suspicious if more than 5 failed attempts in an hour
  RETURN QUERY SELECT (failed_count > 5), failed_count, last_login_time;
END;
$$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created_at ON auth_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_event_type ON auth_audit_logs(event_type);
