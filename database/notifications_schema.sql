-- Notifications system tables

-- Main notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement')),
  target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'learners', 'affiliates', 'admins')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- User notification status tracking (read/unread)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(notification_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON public.notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_is_active ON public.notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_user ON public.user_notifications(notification_id, user_id);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage all notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Users can view active notifications targeted to them
DROP POLICY IF EXISTS "Users can view targeted notifications" ON public.notifications;
CREATE POLICY "Users can view targeted notifications" ON public.notifications
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      target_audience = 'all' OR
      (target_audience = 'learners' AND EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'learner'
      )) OR
      (target_audience = 'affiliates' AND EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'affiliate'
      )) OR
      (target_audience = 'admins' AND EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ))
    )
  );

-- Users can manage their own notification status
DROP POLICY IF EXISTS "Users can manage their notification status" ON public.user_notifications;
CREATE POLICY "Users can manage their notification status" ON public.user_notifications
  FOR ALL USING (user_id = auth.uid());

-- Admins can view all user notification statuses
DROP POLICY IF EXISTS "Admins can view all user notification statuses" ON public.user_notifications;
CREATE POLICY "Admins can view all user notification statuses" ON public.user_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically create user_notifications when a new notification is created
DROP FUNCTION IF EXISTS create_user_notifications_for_new_notification();
CREATE OR REPLACE FUNCTION create_user_notifications_for_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user_notifications for all users based on target_audience
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
$$ LANGUAGE plpgsql;

-- Trigger to automatically create user notifications
DROP TRIGGER IF EXISTS create_user_notifications_trigger ON public.notifications;
CREATE TRIGGER create_user_notifications_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notifications_for_new_notification();

-- Function to update updated_at timestamp
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notifications updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
