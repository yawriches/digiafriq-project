-- Sample analytics queries using base_currency_amount
-- These queries demonstrate the power of having USD base amounts for analytics

-- 1. Total revenue in USD (base currency)
SELECT 
  SUM(base_currency_amount) as total_revenue_usd,
  COUNT(*) as total_transactions
FROM payments 
WHERE status = 'completed';

-- 2. Revenue by membership type in USD
SELECT 
  mp.name as package_name,
  mp.member_type,
  COUNT(*) as sales_count,
  SUM(p.base_currency_amount) as revenue_usd,
  AVG(p.base_currency_amount) as avg_revenue_usd
FROM payments p
JOIN membership_packages mp ON p.membership_package_id = mp.id
WHERE p.status = 'completed'
GROUP BY mp.id, mp.name, mp.member_type
ORDER BY revenue_usd DESC;

-- 3. Revenue by payment provider in USD
SELECT 
  payment_provider,
  COUNT(*) as transaction_count,
  SUM(base_currency_amount) as revenue_usd
FROM payments 
WHERE status = 'completed'
GROUP BY payment_provider
ORDER BY revenue_usd DESC;

-- 4. Revenue by user's original currency (showing conversion to USD)
SELECT 
  currency as user_currency,
  COUNT(*) as transaction_count,
  SUM(amount) as total_local_currency,
  SUM(base_currency_amount) as total_usd_equivalent,
  AVG(base_currency_amount / amount) as avg_exchange_rate
FROM payments 
WHERE status = 'completed'
  AND currency != 'USD'
GROUP BY currency
ORDER BY total_usd_equivalent DESC;

-- 5. Monthly revenue trend in USD
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as transaction_count,
  SUM(base_currency_amount) as monthly_revenue_usd
FROM payments 
WHERE status = 'completed'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 6. Top performing packages by USD revenue
SELECT 
  mp.name,
  mp.price as package_price_usd,
  COUNT(p.id) as sales_count,
  SUM(p.base_currency_amount) as total_revenue_usd,
  (SUM(p.base_currency_amount) / COUNT(p.id)) as avg_actual_revenue_usd
FROM membership_packages mp
LEFT JOIN payments p ON mp.id = p.membership_package_id AND p.status = 'completed'
WHERE mp.is_active = true
GROUP BY mp.id, mp.name, mp.price
ORDER BY total_revenue_usd DESC NULLS LAST;
