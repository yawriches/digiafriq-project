'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, Eye, EyeOff, User, ArrowRight, CheckCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'

const SignupPage = () => {
  const router = useRouter()
  const { signUp, user, profile, loading: authLoading } = useAuth()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    selectedRole: '' as 'learner' | 'affiliate' | ''
  })
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)

  // Redirect if already logged in (but not during signup process)
  useEffect(() => {
    if (!authLoading && user && profile && !isSigningUp) {
      // If user is already logged in, redirect to appropriate dashboard
      const checkMembershipAndRedirect = async () => {
        try {
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
          const userRole = profile.active_role || profile.role

          if (userRole === 'learner' && hasLearnerMembership) {
            router.push('/dashboard/learner')
          } else if (userRole === 'learner' && !hasLearnerMembership) {
            router.push('/dashboard/learner/membership')
          } else if (userRole === 'affiliate') {
            router.push('/dashboard/affiliate')
          } else if (userRole === 'admin') {
            router.push('/dashboard/admin')
          } else {
            router.push('/choose-role')
          }
        } catch (error) {
          console.error('Error checking membership during signup:', error)
          router.push('/choose-role')
        }
      }

      checkMembershipAndRedirect()
    }
  }, [user, profile, authLoading, router])
  
  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }
  
  // Validate step 1
  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    // Strong password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number')
      return false
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError('Password must contain at least one special character')
      return false
    }
    if (!formData.confirmPassword) {
      setError('Please confirm your password')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }
  
  // Handle step 1 submission
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter')
      return
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter')
      return
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number')
      return
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError('Password must contain at least one special character')
      return
    }

    setLoading(true)
    setIsSigningUp(true) // Prevent redirect during signup

    try {
      // Create user account (server-side) and send welcome email via ZeptoMail
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
        })
      })

      const result = await response.json()
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to create account')
      }

      // Sign in immediately so user is authenticated on /choose-role
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        throw new Error(signInError.message || 'Failed to sign in after signup')
      }

      // Small delay to ensure auth state is updated
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to choose role page
      router.push('/choose-role')
      
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account')
      setIsSigningUp(false) // Reset flag on error
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
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </Link>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Create your account
              </h1>
              <p className="text-lg text-gray-600">
                Join thousands of learners and earners transforming their futures
              </p>
            </div>

            {/* Progress Line Indicator */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center justify-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#ed874a] text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div className="w-16 h-1 bg-gray-300"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div className="w-16 h-1 bg-gray-300"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                </div>
              </div>
            </div>

            {/* Form Container */}
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                
                {/* Only show Step 1: Personal Information */}
                <form onSubmit={handleStep1Submit} className="space-y-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          id="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
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
                      <div className="mt-2 text-xs text-gray-500">
                        Password must be at least 8 characters with uppercase, lowercase, number, and special character
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
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
                      Already have an account?
                    </span>
                  </div>
                </div>
                <Link href="/login">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-[#ed874a] text-[#ed874a] hover:bg-orange-50 font-semibold py-2 rounded-lg transition"
                  >
                    Sign In
                  </Button>
                </Link>
                
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our{' '}
                  <Link href="/legal-policies" className="text-gray-600 hover:underline">
                    Terms & Policies
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Illustration */}
        <div className="hidden lg:block w-full lg:w-1/2 bg-gradient-to-br from-[#ed874a] to-[#d76f32] flex items-center justify-center py-12 px-8 order-1 lg:order-2 overflow-y-auto">
          <div className="max-w-lg w-full text-center text-white my-8">
            <h2 className="text-3xl font-bold mb-4">
              Join 1,500,000+ learners today!
            </h2>
            <p className="text-lg mb-8 text-orange-100">
              Transform your future with world-class courses and earn while you learn. Start your journey with DigiAfriq today.
            </p>
            
            {/* Illustration */}
            <div className="relative mb-8">
              <img
                src="/signup-illustration.png"
                alt="Digital Learning Platform"
                className="w-full h-auto max-w-md mx-auto rounded-lg shadow-2xl"
              />
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-orange-100">Active Community</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
