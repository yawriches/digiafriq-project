/**
 * Shared payment provider module.
 * Single source of truth for Paystack and Kora verification logic.
 * Used by both /api/payments/verify and /api/payments/guest-verify routes.
 */

// Payment provider interface
export interface PaymentProvider {
  verifyTransaction(reference: string): Promise<any>
  getProviderName(): string
}

// Paystack provider implementation
export class PaystackProvider implements PaymentProvider {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  getProviderName(): string {
    return 'paystack'
  }

  async verifyTransaction(reference: string): Promise<any> {
    console.log('🌐 Verifying with Paystack API:', reference)

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('📊 Paystack verification response:', data)
    return data
  }
}

// Kora provider implementation
export class KoraProvider implements PaymentProvider {
  private secretKey: string

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  getProviderName(): string {
    return 'kora'
  }

  async verifyTransaction(reference: string): Promise<any> {
    console.log('🌐 Verifying with Kora API:', reference)

    const endpoints = [
      { label: 'charges', url: `https://api.korapay.com/merchant/api/v1/charges/${reference}`, method: 'GET' },
      { label: 'charges-verify', url: `https://api.korapay.com/merchant/api/v1/charges/verify/${reference}`, method: 'GET' },
      {
        label: 'charges-verify-post',
        url: 'https://api.korapay.com/merchant/api/v1/charges/verify',
        method: 'POST',
        body: { reference }
      },
      { label: 'payments', url: `https://api.korapay.com/merchant/api/v1/payments/${reference}`, method: 'GET' },
    ]

    let lastError: Error | null = null

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Using Kora endpoint (${endpoint.label}): ${endpoint.url}`)

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          },
          body: endpoint.method === 'POST' ? JSON.stringify(endpoint.body) : undefined
        })

        console.log(`📨 Kora API response status (${endpoint.label}): ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Kora API error (${response.status}): ${errorText}`)
        }

        const responseText = await response.text()
        let data: any = null
        try {
          data = responseText ? JSON.parse(responseText) : null
        } catch (parseError) {
          throw new Error(`Kora API returned invalid JSON (${endpoint.label}): ${responseText.substring(0, 200)}`)
        }

        if (!data || typeof data !== 'object') {
          throw new Error(`Invalid Kora response (${endpoint.label}): not an object`)
        }

        if (!data.data) {
          throw new Error(`Invalid Kora response (${endpoint.label}): missing data field`)
        }

        const koraStatus = data.data.status?.toLowerCase()
        const normalizedStatus = (koraStatus === 'successful' || koraStatus === 'success') ? 'success' : koraStatus

        const normalizedResponse = {
          status: true,
          message: 'Verification successful',
          data: {
            ...data.data,
            status: normalizedStatus,
            reference: data.data.reference || reference,
            amount: data.data.amount,
            currency: data.data.currency,
            paid_at: data.data.paid_at || data.data.created_at,
            id: data.data.id || data.data.transaction_id
          }
        }

        console.log(`✅ Normalized Kora response (${endpoint.label}):`, normalizedResponse)
        return normalizedResponse
      } catch (error) {
        lastError = error as Error
        console.error(`❌ Kora verification failed (${endpoint.label}):`, (error as Error).message)
      }
    }

    throw lastError || new Error('Kora verification failed')
  }
}

// Payment provider factory
export class PaymentProviderFactory {
  static create(provider: string): PaymentProvider {
    switch (provider.toLowerCase()) {
      case 'paystack':
        return new PaystackProvider(process.env.PAYSTACK_SECRET_KEY!)
      case 'kora':
        return new KoraProvider(process.env.KORA_SECRET_KEY!)
      default:
        throw new Error(`Unsupported payment provider: ${provider}`)
    }
  }
}

// Country-to-provider mapping (single source of truth)
export function getAvailableProviders(country: string): string[] {
  const countryLower = country.toLowerCase().trim()
  
  // Ghana uses Paystack only
  if (countryLower === 'ghana' || countryLower.includes('ghana') || countryLower === 'gh') {
    return ['paystack']
  }
  
  // All other countries use Kora only
  return ['kora']
}

export function getDefaultProvider(country: string): string {
  return getAvailableProviders(country)[0]
}
