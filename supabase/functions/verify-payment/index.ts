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
}

// ===== MAIN ENHANCED WEBHOOK FUNCTION =====

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
    const signature = req.headers.get('x-paystack-signature') || 
                     req.headers.get('x-kora-signature') || 
                     req.headers.get('webhook-signature') || ''

    const body = await req.text()
    
    // Try to determine provider from headers or payload
    let provider = 'paystack' // default
    if (req.headers.get('x-kora-signature')) {
      provider = 'kora'
    }

    // Get provider API key
    const providerKey = provider === 'paystack' 
      ? Deno.env.get('PAYSTACK_SECRET_KEY')!
      : Deno.env.get('KORA_SECRET_KEY')!

    // Validate webhook
    const providerInstance = PaymentProviderFactory.create(provider, { apiKey: providerKey })
    const isValid = await providerInstance.validateWebhook(signature, body)

    if (!isValid) {
      console.error('Invalid webhook signature', { provider, signature })
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse webhook event
    const payload = JSON.parse(body)
    const webhookEvent = providerInstance.parseWebhookEvent(payload)

    console.log('Webhook event received', { 
      provider: webhookEvent.provider, 
      event: webhookEvent.event 
    })

    // Handle different webhook events
    await handleWebhookEvent(webhookEvent, payload)

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook processing error:', errorMessage)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleWebhookEvent(webhookEvent: WebhookEvent, payload: any) {
  const { event, provider } = webhookEvent

  switch (provider) {
    case 'paystack':
      await handlePaystackEvent(event, payload)
      break
    case 'kora':
      await handleKoraEvent(event, payload)
      break
    default:
      console.warn('Unknown provider:', provider)
  }
}

async function handlePaystackEvent(event: string, payload: any) {
  switch (event) {
    case 'charge.success':
      await handlePaymentSuccess(payload.data, 'paystack')
      break
    case 'charge.failed':
      await handlePaymentFailed(payload.data, 'paystack')
      break
    case 'transfer.success':
      await handlePayoutSuccess(payload.data, 'paystack')
      break
    case 'transfer.failed':
      await handlePayoutFailed(payload.data, 'paystack')
      break
    default:
      console.log('Unhandled Paystack event:', event)
  }
}

async function handleKoraEvent(event: string, payload: any) {
  switch (event) {
    case 'payment.success':
      await handlePaymentSuccess(payload.data, 'kora')
      break
    case 'payment.failed':
      await handlePaymentFailed(payload.data, 'kora')
      break
    case 'transfer.success':
      await handlePayoutSuccess(payload.data, 'kora')
      break
    case 'transfer.failed':
      await handlePayoutFailed(payload.data, 'kora')
      break
    default:
      console.log('Unhandled Kora event:', event)
  }
}

async function handlePaymentSuccess(paymentData: any, provider: string) {
  try {
    const reference = paymentData.reference || paymentData.id
    
    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_reference', reference)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found for reference:', reference)
      return
    }

    // Idempotency: skip if already completed (prevents double processing from webhook + UI callback)
    if (payment.status === 'completed') {
      console.log('⚡ Payment already completed, skipping webhook processing:', payment.id)
      return
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        paid_at: new Date().toISOString(),
        provider_response: paymentData
      })
      .eq('id', payment.id)

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`)
    }

    // Create user membership for all membership-related payment types
    const membershipPaymentTypes = ['membership', 'referral_membership', 'addon_upgrade']
    if (membershipPaymentTypes.includes(payment.payment_type)) {
      await createMembership(payment)
    } else {
      console.log('ℹ️ Non-membership payment type, skipping membership creation:', payment.payment_type)
    }

    console.log('Payment processed successfully', { 
      paymentId: payment.id, 
      reference,
      provider 
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error handling payment success:', errorMessage)
  }
}

async function handlePaymentFailed(paymentData: any, provider: string) {
  try {
    const reference = paymentData.reference || paymentData.id
    
    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_reference', reference)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found for reference:', reference)
      return
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'failed',
        error_message: paymentData.message || 'Payment failed',
        provider_response: paymentData
      })
      .eq('id', payment.id)

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`)
    }

    console.log('Payment failure processed', { 
      paymentId: payment.id, 
      reference,
      provider 
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error handling payment failure:', errorMessage)
  }
}

async function handlePayoutSuccess(payoutData: any, provider: string) {
  try {
    const reference = payoutData.reference || payoutData.id
    
    // Update payout record if you have a payouts table
    console.log('Payout success processed', { 
      reference,
      provider 
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error handling payout success:', errorMessage)
  }
}

async function handlePayoutFailed(payoutData: any, provider: string) {
  try {
    const reference = payoutData.reference || payoutData.id
    
    console.log('Payout failure processed', { 
      reference,
      provider 
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error handling payout failure:', errorMessage)
  }
}

async function createMembership(payment: any) {
  try {
    if (!payment.user_id) {
      console.error('❌ No user_id on payment record, cannot create membership:', payment.id)
      return
    }

    // Get membership package details
    const { data: membershipPackage, error: packageError } = await supabase
      .from('membership_packages')
      .select('*')
      .eq('id', payment.membership_package_id)
      .single()

    if (packageError || !membershipPackage) {
      throw new Error('Membership package not found')
    }

    // Check if this is an addon upgrade (not a new membership)
    const metadata = payment.metadata || {}
    const isAddonUpgrade = metadata.is_addon_upgrade === true || metadata.is_addon_upgrade === 'true' || payment.payment_type === 'addon_upgrade'
    const hasDCSAddon = metadata.has_digital_cashflow_addon === true || metadata.has_digital_cashflow_addon === 'true'

    if (isAddonUpgrade) {
      // UPDATE existing membership with DCS addon
      console.log('🔄 Processing DCS addon upgrade for user:', payment.user_id)
      
      const { error: updateError } = await supabase
        .from('user_memberships')
        .update({
          has_digital_cashflow_addon: true
        })
        .eq('user_id', payment.user_id)
        .eq('is_active', true)

      if (updateError) {
        throw new Error(`Failed to update membership with DCS addon: ${updateError.message}`)
      }

      console.log('✅ DCS addon added to existing membership successfully', { 
        userId: payment.user_id,
        paymentId: payment.id
      })

    } else {
      // CHECK: Prevent duplicate membership creation (idempotency)
      const { data: existingForPayment } = await supabase
        .from('user_memberships')
        .select('id')
        .eq('payment_id', payment.id)
        .maybeSingle()

      if (existingForPayment) {
        console.log('⚡ Membership already exists for this payment, skipping:', {
          paymentId: payment.id,
          membershipId: existingForPayment.id
        })
        return
      }

      // Deactivate any existing expired memberships for this user (renewal flow)
      const { data: existingMemberships } = await supabase
        .from('user_memberships')
        .select('id, expires_at, is_active')
        .eq('user_id', payment.user_id)
        .eq('is_active', true)

      if (existingMemberships && existingMemberships.length > 0) {
        const expiredIds = existingMemberships
          .filter((m: any) => new Date(m.expires_at) <= new Date())
          .map((m: any) => m.id)

        if (expiredIds.length > 0) {
          console.log('🔄 Deactivating expired memberships for renewal:', expiredIds)
          await supabase
            .from('user_memberships')
            .update({ is_active: false })
            .in('id', expiredIds)
        }
      }

      // CREATE new membership — use duration_months (matching UI verify route)
      console.log('🆕 Creating new membership for user:', payment.user_id)
      
      const startDate = new Date()
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + (membershipPackage.duration_months || 12))

      const membershipData: any = {
        user_id: payment.user_id,
        membership_package_id: payment.membership_package_id,
        payment_id: payment.id,
        started_at: startDate.toISOString(),
        expires_at: expiryDate.toISOString(),
        is_active: true,
        has_digital_cashflow_addon: hasDCSAddon
      }

      // Add lifetime access for affiliate memberships
      if (membershipPackage.member_type === 'affiliate') {
        membershipData.affiliate_lifetime_access = true
        console.log('👑 Lifetime affiliate access granted')
      }

      const { error: membershipError } = await supabase
        .from('user_memberships')
        .insert(membershipData)

      if (membershipError) {
        throw new Error(`Failed to create membership: ${membershipError.message}`)
      }

      // Update user roles — grant both learner and affiliate access (AI Cashflow program)
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('available_roles, active_role')
        .eq('id', payment.user_id)
        .single()

      const currentRoles = (currentProfile as any)?.available_roles || []
      const updatedRoles = Array.from(new Set([...currentRoles, 'learner', 'affiliate']))
      const activeRole = (currentProfile as any)?.active_role || 'learner'

      await supabase
        .from('profiles')
        .update({ 
          available_roles: updatedRoles,
          active_role: activeRole
        })
        .eq('id', payment.user_id)

      console.log('✅ Membership created successfully', { 
        userId: payment.user_id,
        packageId: payment.membership_package_id,
        paymentId: payment.id,
        hasDCSAddon,
        expiresAt: expiryDate.toISOString(),
        roles: updatedRoles
      })
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error creating/updating membership:', errorMessage)
    throw error
  }
}
