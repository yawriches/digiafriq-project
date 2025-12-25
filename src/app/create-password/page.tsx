'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'

function CreatePasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromParams = searchParams.get('email') || ''
  
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [email, setEmail] = useState(emailFromParams)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    if (emailFromParams) {
      checkUserStatus(emailFromParams)
    } else {
      setCheckingStatus(false)
    }
  }, [emailFromParams])

  const checkUserStatus = async (userEmail: string) => {
    try {
      setCheckingStatus(true)
      
      // Check if user exists and their password status via API
      const response = await fetch('/api/auth/check-password-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
      
      const data = await response.json()
      
      if (data.exists && data.passwordSet) {
        // User already has password, redirect to login
        toast.info('You already have a password. Please log in.')
        router.push('/login')
        return
      }
      
      if (data.exists && data.paymentStatus === 'paid') {
        setUserProfile(data.profile)
        setEmail(userEmail)
      } else if (!data.exists) {
        toast.error('No account found with this email. Please complete payment first.')
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Error checking user status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setErrors({ email: 'Email is required' })
      return
    }
    await checkUserStatus(email)
  }

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setErrors(prev => ({ ...prev, password: passwordError }))
      return
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return
    }
    
    setLoading(true)
    
    try {
      // Call API to set password for the user
      const response = await fetch('/api/auth/set-guest-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to set password')
      }
      
      toast.success('Password set successfully! Logging you in...')
      
      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) {
        throw signInError
      }
      
      // Redirect to dashboard
      router.push('/dashboard/learner')
      
    } catch (error: any) {
      console.error('Password setup error:', error)
      toast.error(error.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <p className="text-gray-600">Checking account status...</p>
        </div>
      </div>
    )
  }

  // If no email provided or user not verified, show email input form
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Image
              src="/logo.png"
              alt="DigiAfriq"
              width={150}
              height={50}
              className="mx-auto mb-4"
            />
            <CardTitle className="text-2xl">Create Your Password</CardTitle>
            <CardDescription>
              Enter the email you used during payment to set up your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#ed874a] hover:bg-orange-600 text-white"
              >
                Continue
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                <p>Don't have an account?</p>
                <Button
                  variant="link"
                  onClick={() => router.push('/join/learner')}
                  className="text-[#ed874a]"
                >
                  Get Started
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show password creation form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Image
            src="/logo.png"
            alt="DigiAfriq"
            width={150}
            height={50}
            className="mx-auto mb-4"
          />
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Welcome to DigiAfriq, {userProfile?.full_name || 'there'}! Create a password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                Creating password for: <strong>{email}</strong>
              </p>
            </div>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={errors.password ? 'border-red-500' : ''}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-gray-700">Password must contain:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
                  One uppercase letter
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
                  One lowercase letter
                </li>
                <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
                  <CheckCircle className={`w-3 h-3 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`} />
                  One number
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-[#ed874a] hover:bg-orange-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Set Password & Access Dashboard
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
      </div>
    }>
      <CreatePasswordContent />
    </Suspense>
  )
}
