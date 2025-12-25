"use client"
import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { processStoredReferral } from '@/lib/auth/account-creation'
import { CheckCircle, Loader2, AlertCircle, Crown, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

const AuthCallbackContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [membershipType, setMembershipType] = useState<'learner' | 'affiliate' | null>(null)

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      console.log('Processing auth callback...')
      
      // Get URL parameters
      const type = searchParams.get('type')
      const membership = searchParams.get('membership') as 'learner' | 'affiliate'
      const referralCode = searchParams.get('ref')
      const referralType = searchParams.get('refType')
      
      console.log('Callback params:', { type, membership, referralCode, referralType })
      
      // Handle the auth callback
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('Authentication failed. Please try again.')
        toast.error('Authentication failed')
        return
      }
      
      if (!data.session) {
        console.error('No session found in callback')
        setStatus('error')
        setMessage('No valid session found. Please try logging in again.')
        toast.error('Session not found')
        return
      }
      
      const user = data.session.user
      console.log('User authenticated:', user.id, user.email)
      
      setMembershipType(membership)
      
      // Process based on callback type
      if (type === 'signup') {
        console.log('Processing new user signup callback')
        setMessage('Welcome! Setting up your account...')
        
        // Process any stored referral data
        if (referralCode && referralType) {
          console.log('Processing referral for new user')
          const referralProcessed = await processStoredReferral(user.id)
          if (referralProcessed) {
            console.log('Referral processed successfully')
            toast.success('Referral bonus applied!')
          } else {
            console.error('Failed to process referral (non-critical)')
          }
        }
        
        // Update profile if needed
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            active_role: membership,
            available_roles: [membership],
            email_confirmed: true,
            last_login: new Date().toISOString()
          })
        
        if (profileError) {
          console.error('Error updating profile:', profileError)
        } else {
          console.log('Profile updated successfully')
        }
        
        setStatus('success')
        setMessage(`Welcome to DigiafrIQ! Your ${membership} account is ready.`)
        toast.success(`${membership} account activated!`)
        
      } else if (type === 'existing') {
        console.log('Processing existing user login callback')
        setMessage('Welcome back! Updating your membership...')
        
        // Update existing user's membership
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            active_role: membership,
            available_roles: [membership], // You might want to merge with existing roles
            last_login: new Date().toISOString()
          })
          .eq('id', user.id)
        
        if (updateError) {
          console.error('Error updating existing user:', updateError)
          setStatus('error')
          setMessage('Failed to update your membership. Please contact support.')
          toast.error('Membership update failed')
          return
        }
        
        // Process referral if provided
        if (referralCode && referralType) {
          console.log('Processing referral for existing user')
          const referralProcessed = await processStoredReferral(user.id)
          if (referralProcessed) {
            console.log('Referral processed successfully')
            toast.success('Referral bonus applied!')
          }
        }
        
        setStatus('success')
        setMessage(`Welcome back! Your ${membership} membership has been updated.`)
        toast.success(`${membership} membership updated!`)
        
      } else {
        console.log('Processing standard auth callback')
        setStatus('success')
        setMessage('Successfully authenticated!')
        toast.success('Login successful!')
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        const redirectPath = membership 
          ? `/dashboard/${membership}`
          : '/dashboard'
        
        console.log('Redirecting to:', redirectPath)
        router.push(redirectPath)
      }, 2000)
      
    } catch (error) {
      console.error('Error in auth callback:', error)
      setStatus('error')
      setMessage('An unexpected error occurred. Please try again.')
      toast.error('Authentication error')
    }
  }

  const getIcon = () => {
    if (status === 'loading') {
      return <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
    } else if (status === 'success') {
      return <CheckCircle className="h-12 w-12 text-green-600" />
    } else {
      return <AlertCircle className="h-12 w-12 text-red-600" />
    }
  }

  const getMembershipIcon = () => {
    if (membershipType === 'affiliate') {
      return <Crown className="h-8 w-8 text-yellow-600" />
    } else if (membershipType === 'learner') {
      return <GraduationCap className="h-8 w-8 text-blue-600" />
    }
    return null
  }

  const getStatusColor = () => {
    if (status === 'loading') return 'border-blue-200 bg-blue-50'
    if (status === 'success') return 'border-green-200 bg-green-50'
    return 'border-red-200 bg-red-50'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className={`max-w-md w-full bg-white rounded-lg shadow-lg border-2 ${getStatusColor()} p-8 text-center`}>
        <div className="mb-6">
          {getIcon()}
        </div>
        
        {membershipType && (
          <div className="flex items-center justify-center mb-4">
            {getMembershipIcon()}
            <span className="ml-2 text-lg font-semibold text-gray-700 capitalize">
              {membershipType} Account
            </span>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {status === 'loading' && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="animate-pulse">Processing your authentication</div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const AuthCallbackPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

export default AuthCallbackPage
