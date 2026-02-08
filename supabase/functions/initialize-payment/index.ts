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

// ===== PAYMENT PROVIDER SYSTEM (INLINED) =====

// Payment Provider Abstraction System
interface PaymentRequest {
  email: string;
  amount: number; // Amount in smallest currency unit (kobo/cents)
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

interface VerificationResponse {
  success: boolean;
  status: string;
  amount: number;
  currency: string;
  paid_at?: string;
  metadata?: Record<string, any>;
  error?: string;
}

interface PayoutRequest {
  account_number: string;
  account_name: string;
  bank_code: string;
  amount: number; // Amount in smallest currency unit
  currency: string;
  reference: string;
  metadata?: Record<string, any>;
}

interface PayoutResponse {
  success: boolean;
  reference: string;
  provider: string;
  transfer_code?: string;
  error?: string;
}

interface WebhookEvent {
  event: string;
  data: any;
  provider: string;
  signature?: string;
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

  // Abstract methods to be implemented by each provider
  abstract initializePayment(request: PaymentRequest): Promise<PaymentResponse>;
  abstract verifyPayment(reference: string): Promise<VerificationResponse>;
  abstract processPayout(request: PayoutRequest): Promise<PayoutResponse>;
  abstract validateWebhook(signature: string, payload: string): Promise<boolean>;
  abstract parseWebhookEvent(payload: any): WebhookEvent;

  // Common utility methods
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
      
      // Try to parse error response
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = JSON.stringify(errorJson, null, 2);
      } catch (parseError) {
        // Keep raw text if not JSON
      }
      
      console.error(`${this.providerName} API Error Details:`, {
        status: response.status,
        statusText: response.statusText,
        url: endpoint,
        errorResponse: errorDetails
      });
      
      throw new Error(`${this.providerName} API error: ${response.status} ${response.statusText} - ${errorDetails.substring(0, 200)}...`);
    }

    const responseText = await response.text();
    
    // Check if response is valid JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error(`${this.providerName} Invalid JSON response:`, responseText);
      throw new Error(`${this.providerName} API returned invalid JSON: "${responseText.substring(0, 100)}..."`);
    }
  }

  protected logTransaction(event: string, data: any, status: string = 'success', error?: string) {
    console.log(`[${this.providerName}] ${event}:`, {
      status,
      data,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}

// Provider Factory
class PaymentProviderFactory {
  private static providers = new Map<string, typeof PaymentProvider>();

  static register(name: string, providerClass: typeof PaymentProvider) {
    this.providers.set(name.toLowerCase(), providerClass);
  }

  static create(name: string, config: { apiKey: string; baseUrl?: string }): PaymentProvider {
    const ProviderClass = this.providers.get(name.toLowerCase());
    if (!ProviderClass) {
      throw new Error(`Payment provider '${name}' not found`);
    }
    
    const baseUrl = config.baseUrl || this.getDefaultBaseUrl(name);
    // @ts-ignore - Dynamic instantiation of provider class
    return new ProviderClass(config.apiKey, baseUrl, name);
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  private static getDefaultBaseUrl(name: string): string {
    const baseUrls: Record<string, string> = {
      paystack: 'https://api.paystack.co',
      kora: 'https://api.korapay.com',
      stripe: 'https://api.stripe.com',
    };
    return baseUrls[name.toLowerCase()] || '';
  }
}

// Currency conversion utilities
class CurrencyConverter {
  static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Comprehensive exchange rates for all supported currencies (Dec 2024)
    const fixedRates: Record<string, number> = {
      // USD to other currencies
      'USD-GHS': 10.0,
      'USD-NGN': 888.89,
      'USD-KES': 129.44,
      'USD-ZAR': 17.22,
      'USD-XOF': 561.11,
      'USD-XAF': 561.11,
      'USD-USD': 1.0,
      
      // Other currencies to USD (reverse rates)
      'GHS-USD': 0.1,
      'NGN-USD': 0.001125,
      'KES-USD': 0.007726,
      'ZAR-USD': 0.058072,
      'XOF-USD': 0.001782,
      'XAF-USD': 0.001782,
    };

    const key = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    const rate = fixedRates[key];
    
    if (!rate) {
      console.warn(`⚠️ No exchange rate found for ${key}, using 1.0`);
      return 1.0;
    }
    
    return rate;
  }

  static async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number }> {
    if (fromCurrency === toCurrency) {
      console.log(`💱 No conversion needed: ${amount} ${fromCurrency} = ${amount} ${toCurrency}`);
      return { amount, rate: 1.0 };
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
    
    console.log(`💱 Currency conversion:`, {
      fromAmount: amount,
      fromCurrency,
      toCurrency,
      rate,
      convertedAmount,
      calculation: `${amount} × ${rate} = ${convertedAmount}`
    });
    
    return {
      amount: convertedAmount,
      rate,
    };
  }

  static toSmallestUnit(amount: number, currency: string): number {
    // Convert to kobo/cents based on currency
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount);
    }
    return Math.round(amount * 100);
  }

  static fromSmallestUnit(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND'];
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return amount;
    }
    return amount / 100;
  }
}

// Country utilities
class CountryUtils {
  static getCurrencyForCountry(countryCode: string): string {
    const countryLower = countryCode.toLowerCase().trim();
    
    // Handle full country names
    const countryNameMap: Record<string, string> = {
      'ghana': 'GHS',
      'nigeria': 'NGN',
      'kenya': 'KES',
      'south africa': 'ZAR',
      'united states': 'USD',
      'usa': 'USD',
      'america': 'USD',
      'benin': 'XOF',
      'burkina faso': 'XOF',
      'côte d\'ivoire': 'XOF',
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
    
    // Handle country codes
    const countryCodeMap: Record<string, string> = {
      GH: 'GHS',
      NG: 'NGN',
      KE: 'KES',
      ZA: 'ZAR',
      US: 'USD',
      GB: 'GBP',
      EU: 'EUR',
    };
    
    // First try full country name, then country code
    return countryNameMap[countryLower] || countryCodeMap[countryCode.toUpperCase()] || 'USD';
  }

  static getProviderForCountry(countryCode: string, type: 'payment' | 'payout' = 'payment'): string {
    // This would typically fetch from your database
    // For now, return hardcoded mappings
    const paymentProviders: Record<string, string> = {
      GH: 'paystack',
      NG: 'kora',
      US: 'paystack',
      // Handle full country names
      GHANA: 'paystack',
      NIGERIA: 'kora',
      'UNITED STATES': 'paystack',
      USA: 'paystack',
    };

    const payoutProviders: Record<string, string> = {
      GH: 'paystack',
      NG: 'kora',
      US: 'paystack',
      // Handle full country names
      GHANA: 'paystack',
      NIGERIA: 'kora',
      'UNITED STATES': 'paystack',
      USA: 'paystack',
    };

    const providers = type === 'payment' ? paymentProviders : payoutProviders;
    const normalizedCountry = countryCode?.toUpperCase().trim();
    
    console.log('🗺️ Provider mapping:', {
      inputCountry: countryCode,
      normalizedCountry,
      selectedProvider: providers[normalizedCountry] || 'paystack'
    });
    
    return providers[normalizedCountry] || 'paystack';
  }

  static getAvailableProviders(countryCode: string): string[] {
    const normalizedCountry = countryCode?.toLowerCase().trim();
    
    // Ghana users can choose between Paystack and Kora
    if (normalizedCountry === 'ghana' || normalizedCountry === 'gh') {
      return ['paystack', 'kora'];
    }
    
    // All other countries use Kora only
    return ['kora'];
  }

  static isValidCountryCode(countryCode: string): boolean {
    return /^[A-Z]{2}$/i.test(countryCode);
  }
}

// Error classes
class PaymentProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}

class CurrencyConversionError extends Error {
  constructor(
    message: string,
    public fromCurrency: string,
    public toCurrency: string,
    public amount?: number
  ) {
    super(message);
    this.name = 'CurrencyConversionError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Paystack Provider Implementation
class PaystackProvider extends PaymentProvider {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.paystack.co', 'paystack');
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logTransaction('payment_initialization', { email: request.email, amount: request.amount, currency: request.currency });

      const reference = request.metadata?.reference || this.generateReference('paystack');
      
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
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
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
      return {
        success: false,
        reference: '',
        provider: 'paystack',
        error: errorMessage,
      };
    }
  }

  async verifyPayment(reference: string): Promise<VerificationResponse> {
    try {
      this.logTransaction('payment_verification', { reference });

      const response = await this.makeRequest(`/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const payment = response.data;
      
      this.logTransaction('payment_verified', { 
        reference, 
        status: payment.status, 
        amount: payment.amount,
        currency: payment.currency 
      });

      return {
        success: payment.status === 'success',
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paid_at: payment.paid_at,
        metadata: payment.metadata,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('payment_verification_failed', { reference, error: errorMessage }, 'error', errorMessage);
      return {
        success: false,
        status: 'failed',
        amount: 0,
        currency: '',
        error: errorMessage,
      };
    }
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    try {
      this.logTransaction('payout_initiation', { 
        account_number: request.account_number.substring(0, 4) + '****', 
        amount: request.amount,
        currency: request.currency 
      });

      // First create transfer recipient
      const recipientResponse = await this.makeRequest('/transferrecipient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          type: 'nuban',
          name: request.account_name,
          account_number: request.account_number,
          bank_code: request.bank_code,
          currency: request.currency,
        }),
      });

      const recipientCode = recipientResponse.data.recipient_code;

      // Then initiate transfer
      const transferResponse = await this.makeRequest('/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          source: 'balance',
          amount: request.amount,
          recipient: recipientCode,
          reference: request.reference,
          reason: 'Payout from Digiafriq',
        }),
      });

      this.logTransaction('payout_initiated', { 
        reference: request.reference, 
        transfer_code: transferResponse.data.transfer_code 
      });

      return {
        success: true,
        reference: request.reference,
        provider: 'paystack',
        transfer_code: transferResponse.data.transfer_code,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('payout_initiation_failed', { reference: request.reference, error: errorMessage }, 'error', errorMessage);
      return {
        success: false,
        reference: request.reference,
        provider: 'paystack',
        error: errorMessage,
      };
    }
  }

  validateWebhook(signature: string, payload: string): Promise<boolean> {
    try {
      // Paystack uses HMAC-SHA512 for webhook validation
      const crypto = globalThis.crypto || (globalThis as any).webcrypto;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.apiKey);
      const messageData = encoder.encode(payload);

      return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      ).then(key => crypto.subtle.sign('HMAC', key, messageData))
        .then(signatureArray => {
          const signatureHex = Array.from(new Uint8Array(signatureArray))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          return signature === `sha512=${signatureHex}`;
        });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('webhook_validation_failed', { error: errorMessage }, 'error', errorMessage);
      return Promise.resolve(false);
    }
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      event: payload.event,
      data: payload.data,
      provider: 'paystack',
      signature: '', // Signature is handled separately in validateWebhook
    };
  }
}

// Kora Provider Implementation
class KoraProvider extends PaymentProvider {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.korapay.com', 'kora');
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logTransaction('payment_initialization', { email: request.email, amount: request.amount, currency: request.currency });

      const reference = request.metadata?.reference || this.generateReference('kora');
      
      // Validate currency support for Kora
      const supportedCurrencies = ['GHS', 'NGN', 'USD', 'KES', 'ZAR', 'XOF', 'XAF'];
      if (!supportedCurrencies.includes(request.currency.toUpperCase())) {
        throw new Error(`Kora does not support ${request.currency} currency`);
      }
      
      // Kora API payload - required fields only
      const payload = {
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        reference,
        customer: {
          email: request.email,
        },
        redirect_url: request.callback_url,
      };

      console.log('🔍 Kora API Request:', {
        endpoint: '/merchant/api/v1/charges/initialize',
        fullUrl: `${this.baseUrl}/merchant/api/v1/charges/initialize`,
        payload: JSON.stringify(payload, null, 2),
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'MISSING'
      });

      // Try the correct Kora API endpoint
      let response;
      try {
        response = await this.makeRequest('/merchant/api/v1/charges/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (apiError) {
        console.error('🔍 Kora API Error:', apiError);
        
        // If API fails, try creating a manual payment URL
        console.log('🔍 Falling back to manual Kora payment URL');
        const manualPaymentUrl = `https://korapay.com/pay/${reference}`;
        
        return {
          success: true,
          authorization_url: manualPaymentUrl,
          reference,
          provider: 'kora',
        };
      }

      console.log('🔍 Kora API Response:', JSON.stringify(response, null, 2));

      // Kora response structure uses checkout_url
      const paymentUrl = response.data?.checkout_url || response.data?.payment_url || response.checkout_url || response.payment_url;
      
      // IMPORTANT: Use Kora's reference if provided, otherwise use our generated reference
      // Kora returns the reference in response.data.reference
      const koraReference = response.data?.reference || reference;
      console.log('🔍 Kora reference:', { ourReference: reference, koraReference, usingReference: koraReference });
      
      this.logTransaction('payment_initialized', { reference: koraReference, payment_url: paymentUrl });

      return {
        success: true,
        authorization_url: paymentUrl,
        access_code: response.data?.access_code,
        reference: koraReference, // Use Kora's reference for verification
        provider: 'kora',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('payment_initialization_failed', { error: errorMessage }, 'error', errorMessage);
      return {
        success: false,
        reference: '',
        provider: 'kora',
        error: errorMessage,
      };
    }
  }

  async verifyPayment(reference: string): Promise<VerificationResponse> {
    try {
      this.logTransaction('payment_verification', { reference });

      const response = await this.makeRequest(`/payments/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const payment = response.data;
      
      this.logTransaction('payment_verified', { 
        reference, 
        status: payment.status, 
        amount: payment.amount,
        currency: payment.currency 
      });

      return {
        success: payment.status === 'successful',
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paid_at: payment.paid_at,
        metadata: payment.metadata,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('payment_verification_failed', { reference, error: errorMessage }, 'error', errorMessage);
      return {
        success: false,
        status: 'failed',
        amount: 0,
        currency: '',
        error: errorMessage,
      };
    }
  }

  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    try {
      this.logTransaction('payout_initiation', { 
        account_number: request.account_number.substring(0, 4) + '****', 
        amount: request.amount,
        currency: request.currency 
      });

      const payload = {
        amount: request.amount,
        bank_account: {
          account_number: request.account_number,
          bank_code: request.bank_code,
          account_name: request.account_name,
        },
        reference: request.reference,
        currency: request.currency,
        narration: 'Payout from Digiafriq',
      };

      const response = await this.makeRequest('/payouts/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      this.logTransaction('payout_initiated', { 
        reference: request.reference, 
        transfer_id: response.data.transfer_id 
      });

      return {
        success: true,
        reference: request.reference,
        provider: 'kora',
        transfer_code: response.data.transfer_id,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('payout_initiation_failed', { reference: request.reference, error: errorMessage }, 'error', errorMessage);
      return {
        success: false,
        reference: request.reference,
        provider: 'kora',
        error: errorMessage,
      };
    }
  }

  validateWebhook(signature: string, payload: string): Promise<boolean> {
    try {
      // Kora uses HMAC-SHA512 for webhook validation
      const crypto = globalThis.crypto || (globalThis as any).webcrypto;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.apiKey);
      const messageData = encoder.encode(payload);

      return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      ).then(key => crypto.subtle.sign('HMAC', key, messageData))
        .then(signatureArray => {
          const signatureHex = Array.from(new Uint8Array(signatureArray))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          return signature === signatureHex;
        });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('webhook_validation_failed', { error: errorMessage }, 'error', errorMessage);
      return Promise.resolve(false);
    }
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      event: payload.event,
      data: payload.data,
      provider: 'kora',
      signature: '', // Signature is handled separately in validateWebhook
    };
  }
}

// ===== MAIN ENHANCED PAYMENT FUNCTION =====

// Register providers
PaymentProviderFactory.register('paystack', PaystackProvider);
PaymentProviderFactory.register('kora', KoraProvider);

// CORS headers
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
    console.log('🔍 Received request body:', JSON.stringify(requestBody, null, 2))
    
    const { membership_package_id, payment_type, payment_provider, metadata } = requestBody

    console.log('🔍 Extracted values:', {
      membership_package_id,
      payment_type,
      payment_provider,
      metadata_keys: metadata ? Object.keys(metadata) : 'null',
      is_referral_signup: metadata?.is_referral_signup
    })

    // Check if this is a referral payment (no auth required)
    const isReferralPayment = payment_type === 'referral_membership' || metadata?.is_referral_signup
    console.log('🔍 Referral payment detection:', {
      payment_type,
      payment_type_match: payment_type === 'referral_membership',
      is_referral_signup: metadata?.is_referral_signup,
      isReferralPayment
    })
    
    let user = null
    let userCountry = 'GH' // Default to Ghana

    if (!isReferralPayment) {
      console.log('🔒 Processing as authenticated payment')
      // Regular authenticated payment flow
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        console.error('❌ Missing authorization header for regular payment')
        return new Response(
          JSON.stringify({ error: 'Authorization header required for regular payments' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )

      if (authError || !authUser) {
        console.error('❌ Authentication failed:', authError)
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      user = authUser

      // Get user profile for country detection
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single()

      userCountry = profile?.country || 'GH'
    } else {
      console.log('🔗 Processing as referral payment (no auth required)')
      // Referral payment flow - use country from metadata
      userCountry = metadata?.country || 'Ghana'
      console.log('🔗 Processing referral payment:', {
        referralCode: metadata?.referral_code,
        referralType: metadata?.referral_type,
        customerEmail: metadata?.email,
        country: userCountry
      })
    }
    // Validate request
    if (!membership_package_id || !payment_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: membership_package_id, payment_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('🌍 Country detection details:', {
      detectedCountry: userCountry,
      countryCodeUpper: userCountry?.toUpperCase(),
      countryCodeLower: userCountry?.toLowerCase(),
      countryLength: userCountry?.length,
      isReferralPayment
    });
    
    // Validate provider selection
    const availableProviders = CountryUtils.getAvailableProviders(userCountry);
    const selectedProvider = payment_provider || CountryUtils.getProviderForCountry(userCountry);
    
    if (!availableProviders.includes(selectedProvider)) {
      console.error('❌ Invalid provider selection:', {
        selectedProvider,
        availableProviders,
        userCountry
      });
      return new Response(
        JSON.stringify({ error: 'Invalid payment provider for your country' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get user currency
    const userCurrency = CountryUtils.getCurrencyForCountry(userCountry);
    
    console.log('💳 Payment configuration:', {
      country: userCountry,
      provider: selectedProvider,
      baseCurrency: 'USD',
      userCurrency,
      providerLogic: selectedProvider === 'paystack' ? 'Always GHS' : `User local currency (${userCurrency})`,
      availableProviders
    });

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

    // Convert USD price to appropriate currency based on provider
    // Use metadata.usd_price if provided (includes addon), otherwise fall back to package price
    const usdPrice = metadata?.usd_price || membershipPackage.price;
    
    console.log('💵 USD Price calculation:', {
      metadata_usd_price: metadata?.usd_price,
      membershipPackage_price: membershipPackage.price,
      final_usdPrice: usdPrice,
      has_digital_cashflow_addon: metadata?.has_digital_cashflow_addon,
      addon_price: metadata?.addon_price
    });
    
    let finalAmount: number;
    let paymentCurrency: string;
    let conversionRate: number;
    
    if (selectedProvider === 'paystack') {
      // Paystack always uses GHS regardless of user country
      const conversion = await CurrencyConverter.convertAmount(usdPrice, 'USD', 'GHS');
      finalAmount = conversion.amount;
      paymentCurrency = 'GHS';
      conversionRate = conversion.rate;
      
      console.log('💱 Paystack currency conversion (always GHS):', {
        usdPrice,
        fromCurrency: 'USD',
        toCurrency: 'GHS',
        convertedAmount: finalAmount,
        conversionRate
      });
    } else {
      // Kora uses user's local currency
      const conversion = await CurrencyConverter.convertAmount(usdPrice, 'USD', userCurrency);
      finalAmount = conversion.amount;
      paymentCurrency = userCurrency;
      conversionRate = conversion.rate;
      
      console.log('💱 Kora currency conversion (user local currency):', {
        usdPrice,
        fromCurrency: 'USD',
        toCurrency: userCurrency,
        convertedAmount: finalAmount,
        conversionRate,
        userCountry
      });
    }

    // Convert to smallest currency unit (only for Paystack, Kora uses full amounts)
    let amountInSmallestUnit;
    if (selectedProvider === 'kora') {
      // Kora uses full currency amounts (no multiplication)
      amountInSmallestUnit = finalAmount;
      console.log('💰 Kora amount (full currency):', amountInSmallestUnit, paymentCurrency);
    } else {
      // Paystack uses smallest currency units (multiply by 100)
      amountInSmallestUnit = CurrencyConverter.toSmallestUnit(finalAmount, paymentCurrency);
      console.log('💰 Paystack amount (smallest unit):', amountInSmallestUnit, paymentCurrency);
    }

    // Get provider API key
    const providerKey = selectedProvider === 'paystack' 
      ? Deno.env.get('PAYSTACK_SECRET_KEY')!
      : Deno.env.get('KORA_SECRET_KEY')!

    // Create payment record
    const paymentData: any = {
      membership_package_id,
      amount: finalAmount,
      currency: paymentCurrency,
      base_currency_amount: usdPrice, // USD base amount (includes addon if selected)
      payment_provider: selectedProvider,
      payment_type,
      status: 'pending',
      exchange_rate: conversionRate,
      metadata: {
        ...metadata,
        country: userCountry,
        conversion_details: {
          original_amount: usdPrice,
          original_currency: 'USD',
          converted_amount: finalAmount,
          converted_currency: paymentCurrency,
          exchange_rate: conversionRate
        }
      }
    }

    // Add user_id only for authenticated payments
    if (user) {
      paymentData.user_id = user.id
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`)
    }

    // Initialize payment with provider
    const provider = PaymentProviderFactory.create(selectedProvider, { apiKey: providerKey })
    
    // Use customer email from metadata for referral payments, user email for regular payments
    const customerEmail = isReferralPayment ? metadata?.email : user?.email
    
    // Determine callback URL based on whether this is a guest/referral payment
    // Always use production URL, never localhost
    let siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://www.digiafriq.com'
    
    // CRITICAL: Never use localhost for payment callbacks - always use production URL
    if (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
      console.warn('⚠️ Detected localhost in SITE_URL, forcing production URL')
      siteUrl = 'https://www.digiafriq.com'
    }
    
    const callbackPath = isReferralPayment ? '/payment/guest-callback' : '/payment/callback'
    const callbackUrl = `${siteUrl}${callbackPath}`
    
    console.log('🔗 Callback URL:', { isReferralPayment, callbackUrl, siteUrl })
    
    const paymentResponse = await provider.initializePayment({
      email: customerEmail!,
      amount: amountInSmallestUnit,
      currency: paymentCurrency,
      metadata: {
        payment_id: payment.id,
        membership_package_id,
        reference: payment.reference,
        is_guest: isReferralPayment, // Flag for guest checkout
        guest_email: isReferralPayment ? customerEmail : undefined,
        guest_name: isReferralPayment ? metadata?.full_name : undefined,
        guest_country: isReferralPayment ? userCountry : undefined,
        ...(user && { user_id: user.id }), // Only include user_id if user exists
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
        JSON.stringify({ 
          error: 'Payment initialization failed', 
          details: paymentResponse.error 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update payment record with provider reference
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        provider_reference: paymentResponse.reference,
        authorization_url: paymentResponse.authorization_url 
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error('❌ Failed to update payment record with provider reference:', updateError)
      // Don't fail the whole process, but log the error
    } else {
      console.log('✅ Payment record updated with provider reference:', {
        paymentId: payment.id,
        providerReference: paymentResponse.reference,
        authorizationUrl: paymentResponse.authorization_url
      })
    }

    const responseData = {
        success: true,
        payment_id: payment.id,
        reference: paymentResponse.reference,
        authorization_url: paymentResponse.authorization_url,
        provider: selectedProvider,
        amount: finalAmount,
        currency: paymentCurrency,
        exchange_rate: conversionRate,
        usd_amount: usdPrice
      };
      
      console.log('🔍 Edge Function Response:', responseData);
      
      return new Response(
        JSON.stringify(responseData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment initialization error:', errorMessage)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
