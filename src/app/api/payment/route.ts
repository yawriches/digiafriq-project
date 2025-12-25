import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API route payment called')
    
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    // Mock payment response
    const mockResponse = {
      success: true,
      payment_id: 'api-test-' + Date.now(),
      reference: 'digiafriq_api_' + Math.random().toString(36).substring(7),
      authorization_url: 'https://paystack.co/pay/api_mock',
      provider: 'paystack',
      amount: 1000,
      currency: 'USD',
      message: 'Mock payment from API route - no dependencies'
    }
    
    console.log('✅ Returning API response:', mockResponse)
    
    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
