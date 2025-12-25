// Combined Payment Providers File
// Contains all payment provider code in a single file for Supabase Edge Functions

// Payment Provider Abstraction System
export interface PaymentRequest {
  email: string;
  amount: number; // Amount in smallest currency unit (kobo/cents)
  currency: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}

export interface PaymentResponse {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference: string;
  provider: string;
  error?: string;
}

export interface VerificationResponse {
  success: boolean;
  status: string;
  amount: number;
  currency: string;
  paid_at?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface PayoutRequest {
  account_number: string;
  account_name: string;
  bank_code: string;
  amount: number; // Amount in smallest currency unit
  currency: string;
  reference: string;
  metadata?: Record<string, any>;
}

export interface PayoutResponse {
  success: boolean;
  reference: string;
  provider: string;
  transfer_code?: string;
  error?: string;
}

export interface WebhookEvent {
  event: string;
  data: any;
  provider: string;
  signature?: string;
}

export abstract class PaymentProvider {
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
      throw new Error(`${this.providerName} API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
export class PaymentProviderFactory {
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
export class CurrencyConverter {
  static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // This would typically fetch from your database or an API
    // For now, return fixed rates
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
    return fixedRates[key] || 1.0;
  }

  static async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ amount: number; rate: number }> {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1.0 };
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return {
      amount: Math.round(amount * rate * 100) / 100, // Round to 2 decimal places
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
export class CountryUtils {
  static getCurrencyForCountry(countryCode: string): string {
    const countryCurrencies: Record<string, string> = {
      GH: 'GHS',
      NG: 'NGN',
      US: 'USD',
      GB: 'GBP',
      EU: 'EUR',
      KE: 'KES',
      ZA: 'ZAR',
    };
    return countryCurrencies[countryCode.toUpperCase()] || 'USD';
  }

  static getProviderForCountry(countryCode: string, type: 'payment' | 'payout' = 'payment'): string {
    // This would typically fetch from your database
    // For now, return hardcoded mappings
    const paymentProviders: Record<string, string> = {
      GH: 'paystack',
      NG: 'kora',
      US: 'paystack',
    };

    const payoutProviders: Record<string, string> = {
      GH: 'paystack',
      NG: 'kora',
      US: 'paystack',
    };

    const providers = type === 'payment' ? paymentProviders : payoutProviders;
    return providers[countryCode.toUpperCase()] || 'paystack';
  }

  static isValidCountryCode(countryCode: string): boolean {
    return /^[A-Z]{2}$/i.test(countryCode);
  }
}

// Error classes
export class PaymentProviderError extends Error {
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

export class CurrencyConversionError extends Error {
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

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Paystack Provider Implementation
export class PaystackProvider extends PaymentProvider {
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

  // Paystack-specific utility methods
  async getBanks(country: string = 'nigeria'): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/bank?country=${country}&perPage=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data || [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('banks_fetch_failed', { country, error: errorMessage }, 'error', errorMessage);
      return [];
    }
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    try {
      const response = await this.makeRequest('/bank/resolve', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
        }),
      });

      return response.data || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('account_resolution_failed', { accountNumber: accountNumber.substring(0, 4) + '****', error: errorMessage }, 'error', errorMessage);
      return null;
    }
  }

  async verifyTransfer(reference: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/transfer/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('transfer_verification_failed', { reference, error: errorMessage }, 'error', errorMessage);
      return null;
    }
  }
}

// Kora Provider Implementation
export class KoraProvider extends PaymentProvider {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.korapay.com', 'kora');
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      this.logTransaction('payment_initialization', { email: request.email, amount: request.amount, currency: request.currency });

      const reference = request.metadata?.reference || this.generateReference('kora');
      
      const payload = {
        amount: request.amount,
        currency: request.currency,
        reference,
        customer: {
          email: request.email,
        },
        metadata: request.metadata,
      };

      const response = await this.makeRequest('/payments/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      this.logTransaction('payment_initialized', { reference, payment_url: response.data.payment_url });

      return {
        success: true,
        authorization_url: response.data.payment_url,
        access_code: response.data.access_code,
        reference,
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

  // Kora-specific utility methods
  async getBanks(country: string = 'NG'): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/banks?country=${country}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data?.banks || [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('banks_fetch_failed', { country, error: errorMessage }, 'error', errorMessage);
      return [];
    }
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string): Promise<any> {
    try {
      const response = await this.makeRequest('/merchant/banks/resolve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
        }),
      });

      return response.data || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('account_resolution_failed', { accountNumber: accountNumber.substring(0, 4) + '****', error: errorMessage }, 'error', errorMessage);
      return null;
    }
  }

  async verifyTransfer(reference: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/payouts/transfer/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('transfer_verification_failed', { reference, error: errorMessage }, 'error', errorMessage);
      return null;
    }
  }

  async getExchangeRates(): Promise<any> {
    try {
      const response = await this.makeRequest('/rates', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data || {};
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('exchange_rates_fetch_failed', { error: errorMessage }, 'error', errorMessage);
      return {};
    }
  }

  async getSupportedCountries(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/countries', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data?.countries || [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logTransaction('countries_fetch_failed', { error: errorMessage }, 'error', errorMessage);
      return [];
    }
  }
}
