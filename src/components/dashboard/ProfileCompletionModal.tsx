'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  User, 
  Calendar, 
  MapPin, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ProfileCompletionModalProps {
  onComplete: (data: { sex: string; date_of_birth: string; city: string }) => Promise<void>
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    sex: '',
    date_of_birth: '',
    city: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.sex) {
      setError('Please select your sex')
      return
    }
    if (!formData.date_of_birth) {
      setError('Please enter your date of birth')
      return
    }
    if (!formData.city.trim()) {
      setError('Please enter your city')
      return
    }

    // Age validation - must be at least 15 years old
    const age = calculateAge(formData.date_of_birth)
    if (age < 15) {
      setError('You must be at least 15 years old to use this platform')
      return
    }

    setLoading(true)
    try {
      await onComplete(formData)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#ed874a]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-[#ed874a]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 text-sm">
              Please provide the following information to continue using the platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sex */}
            <div>
              <label htmlFor="sex" className="block text-sm font-semibold text-gray-700 mb-2">
                Sex <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  id="sex"
                  value={formData.sex}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ed874a] focus:border-[#ed874a] transition appearance-none bg-white"
                  disabled={loading}
                >
                  <option value="">Select your sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ed874a] focus:border-[#ed874a] transition"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">You must be at least 15 years old</p>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter your city"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ed874a] focus:border-[#ed874a] transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Profile
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            This information is required to access the platform
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfileCompletionModal
