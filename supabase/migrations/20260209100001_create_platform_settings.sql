-- Create platform_settings table for admin configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO platform_settings (key, value) VALUES
  ('site_name', 'DigiAfriq'),
  ('site_url', 'https://digiafriq.com'),
  ('support_email', 'support@digiafriq.com'),
  ('default_commission_rate', '80'),
  ('affiliate_referral_rate', '10'),
  ('minimum_payout', '50'),
  ('default_currency', 'USD'),
  ('email_notifications', 'true'),
  ('sms_notifications', 'false'),
  ('maintenance_mode', 'false'),
  ('membership_auto_renew', 'true'),
  ('allow_guest_checkout', 'true'),
  ('max_login_attempts', '5'),
  ('session_timeout_hours', '24'),
  ('paystack_live_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- RLS: Only service role can access (admin API route uses service role)
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed since we access via service role in the API route
