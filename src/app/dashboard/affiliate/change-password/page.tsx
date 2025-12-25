"use client"
import React, { useState } from 'react'
import {
  Shield,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const ChangePasswordPage = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [validation, setValidation] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false
  })

  const validatePassword = (password: string) => {
    setValidation({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === passwordData.confirmPassword && passwordData.confirmPassword !== ''
    })
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))

    if (field === 'newPassword') {
      validatePassword(value)
    } else if (field === 'confirmPassword') {
      setValidation(prev => ({
        ...prev,
        passwordsMatch: prev.hasMinLength && value === passwordData.newPassword
      }))
    }
  }

  const handleSubmit = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    if (!validation.hasMinLength || !validation.hasUppercase || !validation.hasLowercase ||
        !validation.hasNumber || !validation.hasSpecialChar) {
      setMessage({ type: 'error', text: 'New password does not meet requirements' })
      return
    }

    if (!validation.passwordsMatch) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      setMessage({ type: 'success', text: 'Password changed successfully!' })

      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      setValidation({
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        passwordsMatch: false
      })

    } catch {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = passwordData.currentPassword &&
                     passwordData.newPassword &&
                     passwordData.confirmPassword &&
                     validation.passwordsMatch &&
                     validation.hasMinLength &&
                     validation.hasUppercase &&
                     validation.hasLowercase &&
                     validation.hasNumber &&
                     validation.hasSpecialChar

  return (
    <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/profile">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#ed874a] rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
              <p className="text-gray-600">Update your account password for better security</p>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <Card className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {message.text}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Password Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`flex items-center space-x-2 ${validation.hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${validation.hasMinLength ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className="text-sm">At least 8 characters</span>
              </div>
              <div className={`flex items-center space-x-2 ${validation.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${validation.hasUppercase ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className="text-sm">One uppercase letter</span>
              </div>
              <div className={`flex items-center space-x-2 ${validation.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${validation.hasLowercase ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className="text-sm">One lowercase letter</span>
              </div>
              <div className={`flex items-center space-x-2 ${validation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${validation.hasNumber ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className="text-sm">One number</span>
              </div>
              <div className={`flex items-center space-x-2 ${validation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${validation.hasSpecialChar ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className="text-sm">One special character</span>
              </div>
              <div className={`flex items-center space-x-2 ${validation.passwordsMatch ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${validation.passwordsMatch ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className="text-sm">Passwords match</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Update Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className="w-full bg-[#ed874a] hover:bg-[#d76f32] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Changing Password...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Use a unique password for your DigiAfriq account</li>
              <li>• Avoid using personal information in your password</li>
              <li>• Consider using a password manager for better security</li>
              <li>• Change your password regularly, especially if you suspect it may be compromised</li>
              <li>• Never share your password with anyone</li>
            </ul>
          </CardContent>
        </Card>
      </div>
  )
}

export default ChangePasswordPage
