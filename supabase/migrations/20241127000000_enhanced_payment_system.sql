-- Enhanced Payment System Migration - Part 1
-- Multi-country, multi-currency support with provider abstraction

-- Add currency exchange rates table
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate DECIMAL(10,4) NOT NULL,
    is_fixed BOOLEAN DEFAULT TRUE, -- Fixed rate vs dynamic rate
    provider TEXT, -- Source of the rate (paystack, kora, manual)
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_currency, to_currency, valid_from)
);

-- Country to provider mapping for payments
CREATE TABLE IF NOT EXISTS country_payment_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2
    payment_provider TEXT NOT NULL, -- paystack, kora, stripe
    payout_provider TEXT NOT NULL, -- paystack, kora, stripe
    currency TEXT NOT NULL, -- Local currency for this country
    is_active BOOLEAN DEFAULT TRUE,
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    provider_config JSONB DEFAULT '{}', -- Provider-specific settings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_code)
);

-- Enhanced payments table with multi-currency support
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2), -- Amount in USD (base currency)
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2), -- Amount actually paid
ADD COLUMN IF NOT EXISTS paid_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4), -- Rate used for conversion
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'paystack', -- Payment provider used
ADD COLUMN IF NOT EXISTS country_code TEXT, -- User's country
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'course', -- course, membership, affiliate_fee
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS webhook_data JSONB DEFAULT '{}';

-- Enhanced membership_packages table
ALTER TABLE membership_packages
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2), -- Price in USD
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS pricing_rules JSONB DEFAULT '{}', -- Country-specific pricing
ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT FALSE, -- One-time vs recurring
ADD COLUMN IF NOT EXISTS billing_cycles INTEGER, -- Number of billing cycles (null = infinite)
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

-- Subscriptions table (replaces user_memberships for better tracking)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    membership_package_id UUID REFERENCES membership_packages(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    status TEXT DEFAULT 'active', -- active, cancelled, expired, suspended
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    billing_cycles_remaining INTEGER,
    auto_renew BOOLEAN DEFAULT TRUE,
    last_billing_at TIMESTAMPTZ,
    next_billing_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction log for auditing
CREATE TABLE IF NOT EXISTS transaction_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id),
    subscription_id UUID REFERENCES subscriptions(id),
    commission_id UUID REFERENCES commissions(id),
    payout_id UUID REFERENCES payouts(id),
    event_type TEXT NOT NULL, -- payment_initiated, payment_completed, webhook_received, etc.
    provider TEXT, -- paystack, kora, internal
    event_data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'success', -- success, error, pending
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider webhook configurations
CREATE TABLE IF NOT EXISTS webhook_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider TEXT NOT NULL, -- paystack, kora
    webhook_url TEXT NOT NULL,
    secret_key TEXT,
    events TEXT[], -- charge.success, transfer.success, etc.
    is_active BOOLEAN DEFAULT TRUE,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default currency rates
INSERT INTO currency_rates (from_currency, to_currency, rate, is_fixed, provider) VALUES
('USD', 'GHS', 10.0, TRUE, 'fixed'),
('USD', 'NGN', 1200.0, TRUE, 'fixed'),
('USD', 'USD', 1.0, TRUE, 'fixed')
ON CONFLICT (from_currency, to_currency, valid_from) DO NOTHING;

-- Insert country-provider mappings
INSERT INTO country_payment_providers (country_code, payment_provider, payout_provider, currency, is_active) VALUES
('GH', 'paystack', 'paystack', 'GHS', TRUE),
('NG', 'kora', 'kora', 'NGN', TRUE),
('US', 'paystack', 'paystack', 'USD', TRUE)
ON CONFLICT (country_code) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_currency_rates_from_to ON currency_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_valid ON currency_rates(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_country_providers_country ON country_payment_providers(country_code);
CREATE INDEX IF NOT EXISTS idx_country_providers_payment ON country_payment_providers(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payments_base_amount ON payments(base_amount);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_country ON payments(country_code);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_transaction_log_payment ON transaction_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_transaction_log_event ON transaction_log(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_config_provider ON webhook_configurations(provider);

-- Add triggers
CREATE TRIGGER update_currency_rates_updated_at 
    BEFORE UPDATE ON currency_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_payment_providers_updated_at 
    BEFORE UPDATE ON country_payment_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_configurations_updated_at 
    BEFORE UPDATE ON webhook_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for currency conversion
CREATE OR REPLACE FUNCTION convert_currency(
    p_amount DECIMAL, 
    p_from_currency TEXT, 
    p_to_currency TEXT
) RETURNS DECIMAL AS $$
DECLARE
    v_rate DECIMAL;
BEGIN
    -- If same currency, return as-is
    IF p_from_currency = p_to_currency THEN
        RETURN p_amount;
    END IF;
    
    -- Get exchange rate
    SELECT rate INTO v_rate
    FROM currency_rates 
    WHERE from_currency = p_from_currency 
    AND to_currency = p_to_currency
    AND (valid_until IS NULL OR valid_until > NOW())
    ORDER BY valid_from DESC
    LIMIT 1;
    
    -- If no rate found, return NULL
    IF v_rate IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Return converted amount
    RETURN p_amount * v_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to get payment provider for country
CREATE OR REPLACE FUNCTION get_payment_provider(p_country_code TEXT, p_payment_type TEXT DEFAULT 'payment')
RETURNS TEXT AS $$
DECLARE
    v_provider TEXT;
BEGIN
    IF p_payment_type = 'payment' THEN
        SELECT payment_provider INTO v_provider
        FROM country_payment_providers
        WHERE country_code = p_country_code
        AND is_active = TRUE
        LIMIT 1;
    ELSIF p_payment_type = 'payout' THEN
        SELECT payout_provider INTO v_provider
        FROM country_payment_providers
        WHERE country_code = p_country_code
        AND is_active = TRUE
        LIMIT 1;
    END IF;
    
    RETURN COALESCE(v_provider, 'paystack'); -- Default to paystack
END;
$$ LANGUAGE plpgsql;

-- Function to calculate local price
CREATE OR REPLACE FUNCTION calculate_local_price(
    p_base_price DECIMAL,
    p_base_currency TEXT DEFAULT 'USD',
    p_target_currency TEXT,
    p_country_code TEXT
) RETURNS JSONB AS $$
DECLARE
    v_local_price DECIMAL;
    v_exchange_rate DECIMAL;
    v_provider TEXT;
    v_result JSONB;
BEGIN
    -- Get provider for this country
    v_provider := get_payment_provider(p_country_code, 'payment');
    
    -- Convert currency
    v_local_price := convert_currency(p_base_price, p_base_currency, p_target_currency);
    v_exchange_rate := (
        SELECT rate FROM currency_rates 
        WHERE from_currency = p_base_currency 
        AND to_currency = p_target_currency
        AND (valid_until IS NULL OR valid_until > NOW())
        ORDER BY valid_from DESC LIMIT 1
    );
    
    -- Build result
    v_result := jsonb_build_object(
        'local_price', v_local_price,
        'local_currency', p_target_currency,
        'exchange_rate', v_exchange_rate,
        'provider', v_provider,
        'base_price', p_base_price,
        'base_currency', p_base_currency
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
