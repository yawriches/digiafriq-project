-- Fix RLS policies for notification system
-- This script fixes the RLS policy issue that prevents automatic user notification creation

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage their notification status" ON public.user_notifications;
DROP POLICY IF EXISTS "Admins can view all user notification statuses" ON public.user_notifications;

-- Create more permissive policies that allow the trigger to work
DROP POLICY IF EXISTS "Users can manage their notification status" ON public.user_notifications;
CREATE POLICY "Users can manage their notification status" ON public.user_notifications
  FOR ALL USING (
    user_id = auth.uid() OR 
    -- Allow inserts from the trigger function (when no user context)
    auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Admins can view all user notification statuses" ON public.user_notifications;
CREATE POLICY "Admins can view all user notification statuses" ON public.user_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Also add a policy for inserts from the trigger
DROP POLICY IF EXISTS "Enable trigger inserts for user_notifications" ON public.user_notifications;
CREATE POLICY "Enable trigger inserts for user_notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (true);

-- Alternative approach: Modify the trigger function to bypass RLS
-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS create_user_notifications_trigger ON public.notifications;
DROP FUNCTION IF EXISTS create_user_notifications_for_new_notification();
CREATE OR REPLACE FUNCTION create_user_notifications_for_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user_notifications for all users based on target_audience
  -- Use SECURITY DEFINER to bypass RLS for this operation
  
  IF NEW.target_audience = 'all' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles;
  ELSIF NEW.target_audience = 'learners' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'learner';
  ELSIF NEW.target_audience = 'affiliates' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'affiliate';
  ELSIF NEW.target_audience = 'admins' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_user_notifications_trigger ON public.notifications;
CREATE TRIGGER create_user_notifications_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notifications_for_new_notification();
