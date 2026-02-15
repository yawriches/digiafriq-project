-- Create table to track which expiry notifications have been sent
-- This prevents duplicate emails for the same membership expiry event
CREATE TABLE IF NOT EXISTS membership_expiry_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    membership_id UUID NOT NULL REFERENCES user_memberships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- '7_day_warning', 'day_of_warning', 'expired'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(membership_id, notification_type)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_membership_expiry_notif_membership 
    ON membership_expiry_notifications(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_expiry_notif_user 
    ON membership_expiry_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_expiry_notif_type 
    ON membership_expiry_notifications(notification_type);

-- RLS: Only service role should access this table (cron function uses service key)
ALTER TABLE membership_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (no user-facing RLS policies needed)
CREATE POLICY "Service role full access on membership_expiry_notifications"
    ON membership_expiry_notifications
    FOR ALL
    USING (true)
    WITH CHECK (true);
