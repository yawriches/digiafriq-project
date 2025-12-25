'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, Key, ArrowRight, Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

function GuestPaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // Paystack sends both 'reference' and 'trxref' - check both
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.log('🔍 Guest callback - URL params:', {
      reference: searchParams.get('reference'),
      trxref: searchParams.get('trxref'),
      allParams: Object.fromEntries(searchParams.entries())
    })
    
    if (reference) {
      verifyPayment()
    } else {
      setStatus('error')
      setMessage('No payment reference found in URL')
      setLoading(false)
    }
  }, [reference])

  const verifyPayment = async () => {
    try {
      console.log('🔄 Starting payment verification for reference:', reference)
      
      const requestBody = { 
        reference,
        referral_code: localStorage.getItem('checkout_referral_code'),
        referral_type: localStorage.getItem('checkout_referral_type')
      }
      console.log('📤 Request body:', requestBody)
      
      // Call API to verify payment and create account
      const response = await fetch('/api/payments/guest-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
      
      const responseText = await response.text()
      console.log('📥 Response text:', responseText)
      
      let data: any = {}
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError)
        console.error('❌ Raw response:', responseText)
      }
      console.log('📥 Parsed response data:', data)

      if (data.success) {
        setStatus('success')
        setUserEmail(data.email)
        setUserName(data.fullName || data.email?.split('@')[0] || '')
        setTempPassword(data.tempPassword)
        setIsNewUser(data.isNewUser)
        setMessage(data.message)
        
        console.log('✅ Verification successful:', {
          email: data.email,
          isNewUser: data.isNewUser,
          hasTempPassword: !!data.tempPassword
        })
        
        // Clear referral data from localStorage
        localStorage.removeItem('checkout_referral_code')
        localStorage.removeItem('checkout_referral_type')
        localStorage.removeItem('referral_code')
        localStorage.removeItem('referral_type')
        localStorage.removeItem('referral_timestamp')
        
        toast.success('Payment verified successfully!')
      } else {
        console.error('❌ Verification failed:', data)
        setStatus('error')
        setMessage(data.message || 'Payment verification failed')
      }
    } catch (error) {
      console.error('❌ Verification error:', error)
      setStatus('error')
      setMessage('An error occurred while verifying your payment')
    } finally {
      setLoading(false)
    }
  }

  const copyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      toast.success('Password copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#ed874a]" />
              <h2 className="text-xl font-semibold">Verifying Payment...</h2>
              <p className="text-gray-600 text-center">
                Please wait while we confirm your payment and create your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6 space-y-6">
          {status === 'success' ? (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
                <p className="text-gray-600 text-center max-w-md">
                  Welcome{userName ? `, ${userName}` : ''}! Your account has been created.
                </p>
              </div>

              {/* Show temporary password for new users */}
              {isNewUser && tempPassword && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <Key className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Your Login Credentials
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-blue-700">Email:</p>
                          <p className="font-mono bg-white px-3 py-2 rounded border text-blue-900">
                            {userEmail}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700">Temporary Password:</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 font-mono bg-white px-3 py-2 rounded border text-blue-900 flex items-center justify-between">
                              <span>{showPassword ? tempPassword : '••••••••••••'}</span>
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-blue-600 hover:text-blue-800 ml-2"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyPassword}
                              className="flex items-center gap-1"
                            >
                              <Copy className="w-4 h-4" />
                              {copied ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          ⚠️ <strong>Important:</strong> Save this password! It expires in 24 hours. 
                          We recommend changing it after your first login.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* For existing users */}
              {!isNewUser && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2">
                        Account Found
                      </h3>
                      <p className="text-green-700">
                        Your payment has been added to your existing account: <strong>{userEmail}</strong>
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        Login with your existing password to access your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGoToLogin}
                  className="bg-[#ed874a] hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  Go to Login
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Use the credentials above to login and access your dashboard.</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
                <p className="text-gray-600 text-center max-w-md">
                  {message}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/join')}
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-[#ed874a] hover:bg-orange-600 text-white"
                >
                  Go to Homepage
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Need help? Contact support at support@digiafriq.com</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function GuestPaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
      </div>
    }>
      <GuestPaymentCallbackContent />
    </Suspense>
  )
}
