-- Add sample affiliate membership package
INSERT INTO membership_packages (
  id,
  name,
  description,
  price,
  currency,
  duration_months,
  member_type,
  features,
  is_active,
  is_popular,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Basic Affiliate',
  'Start earning commissions by referring learners to our courses',
  7.00,
  'USD',
  12, -- 12 months (1 year)
  'affiliate',
  ARRAY[
    'Affiliate dashboard access',
    'Basic marketing materials',
    'Weekly payouts',
    'Email support',
    'Referral tracking',
    'Basic analytics',
    '100 Cedis per referral commission'
  ],
  true,
  false,
  NOW(),
  NOW()
);

-- Add a premium affiliate package as well
INSERT INTO membership_packages (
  id,
  name,
  description,
  price,
  currency,
  duration_months,
  member_type,
  features,
  is_active,
  is_popular,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Pro Affiliate',
  'Advanced affiliate features with higher earning potential',
  29.00,
  'USD',
  12, -- 12 months (1 year)
  'affiliate',
  ARRAY[
    'Everything in Basic',
    'Advanced marketing materials',
    'Priority support',
    'Bi-weekly payouts',
    'Advanced analytics',
    'Custom referral links',
    '120 Cedis per referral commission',
    'Performance bonuses'
  ],
  true,
  true, -- Mark as popular
  NOW(),
  NOW()
);
