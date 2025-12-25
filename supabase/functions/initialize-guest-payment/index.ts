import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Deno global type declarations for TypeScript
declare global {
  namespace Deno {
    var env: {
      get(key: string): string | undefined;
    };
  }
}

// ===== PAYMENT PROVIDER SYSTEM =====

interface PaymentRequest {
  email: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}

interface PaymentResponse {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference: string;
  provider: string;
  error?: string;
}

abstract class PaymentProvider {
  protected apiKey: string;
  protected baseUrl: string;
  protected providerName: string;

  constructor(apiKey: string, baseUrl: string, providerName: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.providerName = providerName;
  }

  abstract initializePayment(request: PaymentRequest): Promise<PaymentResponse>;

  protected generateReference(prefix: string = 'digiafriq'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  protected async makeRequest(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = JSON.stringify(errorJson, null, 2);
      } catch (parseError) {}
      
      console.error(`${this.providerName} API Error:`, {
        status: response.status,
        statusText: response.statusText,
        url: endpoint,
        errorResponse: errorDetails
      });
      
      throw new Error(`${this.providerName} API error: ${response.status} - ${errorDetails.substring(0, 200)}`);
    }

    const responseText = await response.text();
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`${this.providerName} API returned invalid JSON`);
    }
  }

  protected logTransaction(event: string, data: any, status: string = 'success', error?: string) {
    console.log(`[${this.providerName}] ${event}:`, { status, data, error, timestamp: new Date().toISOString() });
  }
}

// Currency conversion utilities
class CurrencyConverter {
  static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Exchange rates (Dec 2024)
    const fixedRates: Record<string, number> = {
      'USD-GHS': 10.0,
      'USD-NGN': 888.89,
      'USD-KES': 129.44,
      'USD-ZAR': 17.22,
      'USD-XOF': 561.11,
      'USD-XAF': 561.11,
      'USD-USD': 1.0,
    };

    const key = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    return fixedRates[key] || 1.0;
  }

  static async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<{ amount: number; rate: number }> {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1.0 };
    }
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = Math.round(amount * rate * 100) / 100;
    return { amount: convertedAmount, rate };
  }

  static toSmallestUnit(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount);
    }
    return Math.round(amount * 100);
  }
}

// Country utilities
class CountryUtils {
  static getCurrencyForCountry(country: string): string {
    const countryLower = country.toLowerCase().trim();
    const countryNameMap: Record<string, string> = {
      'ghana': 'GHS',
      'nigeria': 'NGN',
      'kenya': 'KES',
      'south africa': 'ZAR',
      'united states': 'USD',
      'usa': 'USD',
      'benin': 'XOF',
      'burkina faso': 'XOF',
      "côte d'ivoire": 'XOF',
      'ivory coast': 'XOF',
      'guinea-bissau': 'XOF',
      'mali': 'XOF',
      'niger': 'XOF',
      'senegal': 'XOF',
      'togo': 'XOF',
      'cameroon': 'XAF',
      'central african republic': 'XAF',
      'chad': 'XAF',
      'republic of the congo': 'XAF',
      'congo': 'XAF',
      'equatorial guinea': 'XAF',
      'gabon': 'XAF',
    };
    return countryNameMap[countryLower] || 'USD';
  }

  static getAvailableProviders(country: string): string[] {
    const countryLower = country.toLowerCase().trim();
    // Ghana users can choose between Paystack and Kora
    if (countryLower === 'ghana') {
      return ['paystack', 'kora'];
    }
    // All other countries use Kora only
    return ['kora'];
  }

  static getDefaultProvider(country: string): string {
    const providers = this.getAvailableProviders(country);
    return providers[0];
  }
}

// Paystack Provider
class PaystackProvider extends PaymentProvider {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.paystack.co', 'paystack');
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logTransaction('payment_initialization', { email: request.email, amount: request.amount, currency: request.currency });

      const reference = request.metadata?.reference || this.generateReference('paystack_guest');
      
      const payload = {
        email: request.email,
        amount: request.amount,
        currency: request.currency,
        reference,
        callback_url: request.callback_url,
        metadata: request.metadata,
      };

      const response = await this.makeRequest('/transaction/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify(payload),
      });

      this.logTransaction('payment_initialized', { reference, authorization_url: response.data.authorization_url });

      return {
        success: true,
        authorization_url: response.data.authorization_url,
        access_code: response.data.access_code,
        reference,
        provider: 'paystack',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('payment_initialization_failed', { error: errorMessage }, 'error', errorMessage);
      return { success: false, reference: '', provider: 'paystack', error: errorMessage };
    }
  }
}

// Kora Provider
class KoraProvider extends PaymentProvider {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.korapay.com', 'kora');
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logTransaction('payment_initialization', { email: request.email, amount: request.amount, currency: request.currency });

      const reference = request.metadata?.reference || this.generateReference('kora_guest');
      
      const supportedCurrencies = ['GHS', 'NGN', 'USD', 'KES', 'ZAR', 'XOF', 'XAF'];
      if (!supportedCurrencies.includes(request.currency.toUpperCase())) {
        throw new Error(`Kora does not support ${request.currency} currency`);
      }
      
      const payload = {
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        reference,
        customer: { email: request.email },
        redirect_url: request.callback_url,
      };

      console.log('🔍 Kora API Request:', { endpoint: '/merchant/api/v1/charges/initialize', payload });

      const response = await this.makeRequest('/merchant/api/v1/charges/initialize', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const paymentUrl = response.data?.checkout_url || response.data?.payment_url;
      this.logTransaction('payment_initialized', { reference, payment_url: paymentUrl });

      return {
        success: true,
        authorization_url: paymentUrl,
        access_code: response.data?.access_code,
        reference,
        provider: 'kora',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('payment_initialization_failed', { error: errorMessage }, 'error', errorMessage);
      return { success: false, reference: '', provider: 'kora', error: errorMessage };
    }
  }
}

// Provider Factory
class PaymentProviderFactory {
  static create(name: string, apiKey: string): PaymentProvider {
    switch (name.toLowerCase()) {
      case 'paystack':
        return new PaystackProvider(apiKey);
      case 'kora':
        return new KoraProvider(apiKey);
      default:
        throw new Error(`Payment provider '${name}' not found`);
    }
  }
}

// ===== MAIN GUEST PAYMENT FUNCTION =====

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('🔍 Guest Payment Request:', JSON.stringify(requestBody, null, 2))
    
    const { membership_package_id, payment_type, payment_provider, is_guest, metadata } = requestBody

    // Validate this is a guest payment
    if (!is_guest) {
      return new Response(
        JSON.stringify({ error: 'This endpoint is for guest payments only' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!membership_package_id || !payment_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: membership_package_id, payment_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate guest metadata
    if (!metadata?.email || !metadata?.full_name || !metadata?.country) {
      return new Response(
        JSON.stringify({ error: 'Missing required guest information: email, full_name, country' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const guestCountry = metadata.country
    const guestEmail = metadata.email
    const guestName = metadata.full_name

    console.log('👤 Guest Details:', { email: guestEmail, name: guestName, country: guestCountry })

    // Validate provider selection based on country
    const availableProviders = CountryUtils.getAvailableProviders(guestCountry)
    const selectedProvider = payment_provider || CountryUtils.getDefaultProvider(guestCountry)
    
    if (!availableProviders.includes(selectedProvider)) {
      console.error('❌ Invalid provider for country:', { selectedProvider, availableProviders, guestCountry })
      return new Response(
        JSON.stringify({ error: `Invalid payment provider for ${guestCountry}. Available: ${availableProviders.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💳 Provider Selection:', { country: guestCountry, selectedProvider, availableProviders })

    // Get membership package details
    const { data: membershipPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('*')
      .eq('id', membership_package_id)
      .eq('is_active', true)
      .single()

    if (packageError || !membershipPackage) {
      return new Response(
        JSON.stringify({ error: 'Membership package not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📦 Membership Package:', membershipPackage)

    // Get user currency and convert price
    const userCurrency = CountryUtils.getCurrencyForCountry(guestCountry)
    const usdPrice = metadata?.usd_price || membershipPackage.price

    let finalAmount: number
    let paymentCurrency: string
    let conversionRate: number

    if (selectedProvider === 'paystack') {
      // Paystack always uses GHS
      const conversion = await CurrencyConverter.convertAmount(usdPrice, 'USD', 'GHS')
      finalAmount = conversion.amount
      paymentCurrency = 'GHS'
      conversionRate = conversion.rate
    } else {
      // Kora uses user's local currency
      const conversion = await CurrencyConverter.convertAmount(usdPrice, 'USD', userCurrency)
      finalAmount = conversion.amount
      paymentCurrency = userCurrency
      conversionRate = conversion.rate
    }

    console.log('💱 Currency Conversion:', {
      usdPrice,
      finalAmount,
      paymentCurrency,
      conversionRate,
      provider: selectedProvider
    })

    // Convert to smallest unit for Paystack, full amount for Kora
    let amountInSmallestUnit
    if (selectedProvider === 'kora') {
      amountInSmallestUnit = finalAmount
    } else {
      amountInSmallestUnit = CurrencyConverter.toSmallestUnit(finalAmount, paymentCurrency)
    }

    // Get provider API key
    const providerKey = selectedProvider === 'paystack' 
      ? Deno.env.get('PAYSTACK_SECRET_KEY')!
      : Deno.env.get('KORA_SECRET_KEY')!

    // Create guest payment record (no user_id)
    const paymentData = {
      membership_package_id,
      amount: finalAmount,
      currency: paymentCurrency,
      base_currency_amount: membershipPackage.price,
      payment_provider: selectedProvider,
      payment_type: 'guest_membership',
      status: 'pending',
      exchange_rate: conversionRate,
      metadata: {
        ...metadata,
        is_guest: true,
        guest_email: guestEmail,
        guest_name: guestName,
        guest_country: guestCountry,
        conversion_details: {
          original_amount: membershipPackage.price,
          original_currency: 'USD',
          converted_amount: finalAmount,
          converted_currency: paymentCurrency,
          exchange_rate: conversionRate
        }
      }
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) {
      console.error('❌ Failed to create payment record:', paymentError)
      throw new Error(`Failed to create payment record: ${paymentError.message}`)
    }

    console.log('✅ Payment record created:', payment.id)

    // Initialize payment with provider
    const provider = PaymentProviderFactory.create(selectedProvider, providerKey)
    
    // Get callback URL from environment or use default
    const siteUrl = Deno.env.get('SITE_URL') || 'https://digiafriq.com'
    const callbackUrl = `${siteUrl}/payment/guest-callback`

    const paymentResponse = await provider.initializePayment({
      email: guestEmail,
      amount: amountInSmallestUnit,
      currency: paymentCurrency,
      metadata: {
        payment_id: payment.id,
        membership_package_id,
        reference: payment.reference,
        is_guest: true,
        guest_email: guestEmail,
        guest_name: guestName,
        ...metadata,
      },
      callback_url: callbackUrl
    })

    if (!paymentResponse.success) {
      // Update payment record to failed
      await supabase
        .from('payments')
        .update({ status: 'failed', error_message: paymentResponse.error })
        .eq('id', payment.id)

      return new Response(
        JSON.stringify({ error: 'Payment initialization failed', details: paymentResponse.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment record with provider reference
    await supabase
      .from('payments')
      .update({ 
        provider_reference: paymentResponse.reference,
        authorization_url: paymentResponse.authorization_url 
      })
      .eq('id', payment.id)

    console.log('✅ Guest payment initialized successfully:', {
      paymentId: payment.id,
      reference: paymentResponse.reference,
      provider: selectedProvider,
      authorizationUrl: paymentResponse.authorization_url
    })

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        reference: paymentResponse.reference,
        authorization_url: paymentResponse.authorization_url,
        provider: selectedProvider,
        amount: finalAmount,
        currency: paymentCurrency,
        exchange_rate: conversionRate,
        usd_amount: usdPrice
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Guest payment initialization error:', errorMessage)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
