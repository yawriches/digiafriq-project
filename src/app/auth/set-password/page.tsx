'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'

export default function SetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [errors, setErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error('Invalid or expired link. Please request a new one.')
      router.push('/login')
      return
    }

    setUser(user)

    // Check if this is a first-time login
    const isFirstLogin = user.user_metadata?.first_login || user.app_metadata?.provider === 'email'
    
    if (!isFirstLogin && user.user_metadata?.password_set) {
      // User already has a password, redirect to dashboard
      router.push('/dashboard/learner')
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
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
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: {
          password_set: true,
          first_login: false
        }
      })
      
      if (updateError) {
        throw updateError
      }
      
      // Update profile to mark password as set
      if (user) {
        await supabase
          .from('profiles')
          .update({
            password_set: true,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', user.id)
      }
      
      toast.success('Password set successfully! Welcome to DigiAfriq!')
      
      // Determine where to redirect based on user's membership
      const { data: membership } = await supabase
        .from('user_memberships')
        .select('has_digital_cashflow_addon')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single() as { data: any }
      
      if (membership?.has_digital_cashflow_addon) {
        router.push('/dashboard/affiliate')
      } else {
        router.push('/dashboard/learner')
      }
      
    } catch (error: any) {
      console.error('Password update error:', error)
      toast.error(error.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
      </div>
    )
  }

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
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <CardDescription>
            Welcome to DigiAfriq! Please create a secure password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  Set Password & Continue
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
