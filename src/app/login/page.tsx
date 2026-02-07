'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

const LoginPage = () => {
  const router = useRouter()
  const { signIn, resetPassword, user, profile, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      // Check user's existing role and redirect appropriately
      const checkMembershipAndRedirect = async () => {
        try {
          const userRole = profile.active_role || profile.role

          console.log('Login redirect check:', { 
            userRole, 
            hasActiveRole: !!profile.active_role,
            profileRole: profile.role
          })

          // If user doesn't have an active_role set, always redirect to choose-role
          if (!profile.active_role) {
            console.log('No active_role found, redirecting to choose-role')
            router.push('/choose-role')
            return
          }

          // Get active memberships for the user
          const { data: memberships } = await supabase
            .from('user_memberships')
            .select(`
              is_active,
              expires_at,
              membership_packages (
                member_type
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString()) as any

          const hasLearnerMembership = memberships?.some((m: any) => m.membership_packages?.member_type === 'learner')

          if (userRole === 'learner' && hasLearnerMembership) {
            // Learner with active membership - go directly to dashboard
            router.push('/dashboard/learner')
          } else if (userRole === 'learner' && !hasLearnerMembership) {
            // Learner without membership - go to membership page to purchase
            router.push('/dashboard/learner/membership')
          } else if (userRole === 'affiliate') {
            // Affiliate - go to affiliate dashboard
            router.push('/dashboard/affiliate')
          } else if (userRole === 'admin') {
            // Admin - go to admin dashboard
            router.push('/dashboard/admin')
          } else {
            // No role - go to role selection
            router.push('/choose-role')
          }
        } catch (error) {
          console.error('Error checking membership during login:', error)
          // Fallback to role selection
          router.push('/choose-role')
        }
      }

      checkMembershipAndRedirect()
    }
  }, [user, profile, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    try {
      // First check if user has set password
      const statusResponse = await fetch('/api/auth/check-password-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const statusData = await statusResponse.json()
      
      if (statusData.exists && !statusData.passwordSet && statusData.paymentStatus === 'paid') {
        // User has paid but hasn't set password yet
        setError('You haven\'t finished setting up your account. Redirecting to password creation...')
        setTimeout(() => {
          router.push(`/create-password?email=${encodeURIComponent(email)}`)
        }, 2000)
        setLoading(false)
        return
      }

      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        console.error('Sign-in error:', signInError)
        
        // Check if error is due to no password set
        if (signInError.message?.includes('Invalid login credentials') && statusData.exists && statusData.paymentStatus === 'paid') {
          setError('Please complete your account setup by creating a password.')
          setTimeout(() => {
            router.push(`/create-password?email=${encodeURIComponent(email)}`)
          }, 2000)
        } else {
          setError(signInError.message || 'Failed to sign in. Please check your credentials.')
        }
        setLoading(false)
        return
      }

      // Sign-in successful, auth state change will handle redirect
      console.log('✅ Sign-in successful')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResetSent(false)

    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await resetPassword(email.trim())
      if (resetError) {
        setError(resetError.message || 'Failed to send reset email')
        setLoading(false)
        return
      }

      setResetSent(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Section: Form */}
        <div className="w-full flex items-center justify-center py-8 px-4 order-1 lg:order-1 overflow-y-auto lg:w-1/2">
          <div className="max-w-xl w-full my-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Link href="/" className="cursor-pointer">
                  <Image
                    src="/digiafriqlogo.png"
                    alt="DigiAfriq Logo"
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </Link>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
              <p className="text-lg text-gray-600">Sign in to your DigiAfriq account</p>
            </div>

            {/* Form Container */}
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  {!resetMode && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Forgot Password */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setResetMode(!resetMode)
                        setError('')
                        setResetSent(false)
                      }}
                      className="text-sm text-[#ed874a] hover:underline"
                      disabled={loading}
                    >
                      {resetMode ? 'Back to sign in' : 'Forgot password?'}
                    </button>
                  </div>

                  {resetMode && resetSent && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                      If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {resetMode ? 'Sending reset link...' : 'Signing in...'}
                      </>
                    ) : (
                      resetMode ? 'Send reset link' : 'Sign In'
                    )}
                  </Button>
                </form>
              </div>

              {/* Footer Links */}
              <div className="text-center mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gradient-to-br from-orange-50 via-white to-amber-50 text-gray-500">
                      Don&apos;t have an account?
                    </span>
                  </div>
                </div>
                <Link href="/signup">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-[#ed874a] text-[#ed874a] hover:bg-orange-50 font-semibold py-2 rounded-lg transition"
                  >
                    Create Account
                  </Button>
                </Link>

                <p className="text-xs text-gray-500">
                  By signing in, you agree to our{' '}
                  <Link href="/legal-policies" className="text-gray-600 hover:underline">
                    Terms & Policies
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Branded Panel */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-gradient-to-br from-[#ed874a] to-[#d76f32] items-center justify-center py-12 px-8 order-2 overflow-y-auto">
          <div className="max-w-lg w-full text-center text-white my-8">
            <h2 className="text-3xl font-bold mb-4">
              Welcome back to DigiAfriq!
            </h2>
            <p className="text-lg mb-8 text-orange-100">
              Continue your learning journey and grow your earnings. Your dashboard awaits.
            </p>

            {/* Illustration */}
            <div className="relative mb-8">
              <img
                src="/login-illustration.png"
                alt="Digital Learning Platform"
                className="w-full h-auto max-w-md mx-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
