import { describe, it, expect, vi } from 'vitest'
import { getAvailableProviders, getDefaultProvider, PaystackProvider, KoraProvider, PaymentProviderFactory } from '@/lib/payments/providers'

describe('getAvailableProviders', () => {
  it('returns paystack for Ghana', () => {
    expect(getAvailableProviders('Ghana')).toEqual(['paystack'])
  })

  it('returns paystack for ghana lowercase', () => {
    expect(getAvailableProviders('ghana')).toEqual(['paystack'])
  })

  it('returns paystack for GH country code', () => {
    expect(getAvailableProviders('gh')).toEqual(['paystack'])
  })

  it('returns paystack for Ghana with whitespace', () => {
    expect(getAvailableProviders('  Ghana  ')).toEqual(['paystack'])
  })

  it('returns kora for Nigeria', () => {
    expect(getAvailableProviders('Nigeria')).toEqual(['kora'])
  })

  it('returns kora for Cameroon', () => {
    expect(getAvailableProviders('Cameroon')).toEqual(['kora'])
  })

  it('returns kora for unknown country', () => {
    expect(getAvailableProviders('Mars')).toEqual(['kora'])
  })
})

describe('getDefaultProvider', () => {
  it('returns paystack for Ghana', () => {
    expect(getDefaultProvider('Ghana')).toBe('paystack')
  })

  it('returns kora for Nigeria', () => {
    expect(getDefaultProvider('Nigeria')).toBe('kora')
  })
})

describe('PaystackProvider', () => {
  it('returns correct provider name', () => {
    const provider = new PaystackProvider('test-key')
    expect(provider.getProviderName()).toBe('paystack')
  })

  it('calls correct Paystack API endpoint', async () => {
    const mockResponse = { status: true, data: { status: 'success', reference: 'ref123' } }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const provider = new PaystackProvider('sk_test_123')
    const result = await provider.verifyTransaction('ref123')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.paystack.co/transaction/verify/ref123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer sk_test_123',
        }),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    const provider = new PaystackProvider('bad-key')
    await expect(provider.verifyTransaction('ref')).rejects.toThrow('Paystack API error: 401')
  })
})

describe('KoraProvider', () => {
  it('returns correct provider name', () => {
    const provider = new KoraProvider('test-key')
    expect(provider.getProviderName()).toBe('kora')
  })

  it('tries multiple endpoints and returns on first success', async () => {
    const mockData = {
      data: { status: 'successful', reference: 'kora-ref', amount: 1000, currency: 'NGN' }
    }
    // First endpoint fails, second succeeds
    let callCount = 0
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockData)),
      })
    })

    const provider = new KoraProvider('sk_kora_123')
    const result = await provider.verifyTransaction('kora-ref')

    expect(result.status).toBe(true)
    expect(result.data.status).toBe('success')
    expect(result.data.reference).toBe('kora-ref')
    expect(callCount).toBe(2)
  })

  it('normalizes "successful" status to "success"', async () => {
    const mockData = {
      data: { status: 'successful', reference: 'ref', amount: 500, currency: 'XOF' }
    }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockData)),
    })

    const provider = new KoraProvider('key')
    const result = await provider.verifyTransaction('ref')
    expect(result.data.status).toBe('success')
  })

  it('throws when all endpoints fail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Server error'),
    })

    const provider = new KoraProvider('key')
    await expect(provider.verifyTransaction('bad-ref')).rejects.toThrow()
  })
})

describe('PaymentProviderFactory', () => {
  it('creates PaystackProvider for paystack', () => {
    const provider = PaymentProviderFactory.create('paystack')
    expect(provider.getProviderName()).toBe('paystack')
  })

  it('creates KoraProvider for kora', () => {
    const provider = PaymentProviderFactory.create('kora')
    expect(provider.getProviderName()).toBe('kora')
  })

  it('is case-insensitive', () => {
    expect(PaymentProviderFactory.create('PAYSTACK').getProviderName()).toBe('paystack')
    expect(PaymentProviderFactory.create('Kora').getProviderName()).toBe('kora')
  })

  it('throws for unsupported provider', () => {
    expect(() => PaymentProviderFactory.create('stripe')).toThrow('Unsupported payment provider: stripe')
  })
})
