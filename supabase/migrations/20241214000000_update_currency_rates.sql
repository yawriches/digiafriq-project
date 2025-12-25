-- Migration: Update currency exchange rates (Dec 2024)
-- New rates based on current market values

-- Delete existing rates to avoid conflicts
DELETE FROM currency_rates WHERE to_currency = 'USD' OR from_currency = 'USD';

-- Insert updated exchange rates (Dec 2024)
-- USD to local currency rates
INSERT INTO currency_rates (from_currency, to_currency, rate, is_fixed, provider)
VALUES 
  ('USD', 'GHS', 10.0, TRUE, 'manual'),      -- 1 USD = 10 GHS
  ('USD', 'NGN', 888.89, TRUE, 'manual'),    -- 1 USD = 888.89 NGN
  ('USD', 'KES', 129.44, TRUE, 'manual'),    -- 1 USD = 129.44 KES
  ('USD', 'ZAR', 17.22, TRUE, 'manual'),     -- 1 USD = 17.22 ZAR
  ('USD', 'XOF', 561.11, TRUE, 'manual'),    -- 1 USD = 561.11 XOF
  ('USD', 'XAF', 561.11, TRUE, 'manual'),    -- 1 USD = 561.11 XAF
  ('USD', 'USD', 1.0, TRUE, 'manual');       -- 1 USD = 1 USD

-- Local currency to USD rates (reverse rates)
INSERT INTO currency_rates (from_currency, to_currency, rate, is_fixed, provider)
VALUES 
  ('GHS', 'USD', 0.1, TRUE, 'manual'),       -- 1 GHS = 0.10 USD (1/10)
  ('NGN', 'USD', 0.001125, TRUE, 'manual'),  -- 1 NGN = 0.001125 USD (1/888.89)
  ('KES', 'USD', 0.007726, TRUE, 'manual'),  -- 1 KES = 0.007726 USD (1/129.44)
  ('ZAR', 'USD', 0.058072, TRUE, 'manual'),  -- 1 ZAR = 0.058072 USD (1/17.22)
  ('XOF', 'USD', 0.001782, TRUE, 'manual'),  -- 1 XOF = 0.001782 USD (1/561.11)
  ('XAF', 'USD', 0.001782, TRUE, 'manual');  -- 1 XAF = 0.001782 USD (1/561.11)
