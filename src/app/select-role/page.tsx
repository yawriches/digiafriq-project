"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth'
import { GraduationCap, TrendingUp, Loader2 } from 'lucide-react'

const SelectRolePage = () => {
  const router = useRouter()
  const { user, profile, switchRole, addRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'learner' | 'affiliate' | null>(null)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login')
      return
    }

    // If user already has an active role and came here directly, redirect to their dashboard
    if (profile?.active_role) {
      const dashboardPath = profile.active_role === 'learner' 
        ? '/dashboard/learner' 
        : '/dashboard/affiliate'
      router.push(dashboardPath)
    }
  }, [user, profile, router])

  const handleRoleSelection = async (role: 'learner' | 'affiliate') => {
    setSelectedRole(role)
    setLoading(true)

    try {
      console.log(`🎯 User selected role: ${role}`)
      
      // Check if user has this role in available_roles
      const hasRole = profile?.available_roles?.includes(role)
      
      if (!hasRole) {
        console.log(`➕ Adding ${role} to available roles...`)
        const addResult = await addRole(role)
        if (addResult.error) {
          console.error('❌ Error adding role:', addResult.error)
          alert(`Failed to add role: ${addResult.error.message}`)
          setLoading(false)
          setSelectedRole(null)
          return
        }
        console.log(`✅ Role ${role} added successfully`)
      }
      
      // Switch to the selected role
      const result = await switchRole(role)
      
      if (result.error) {
        console.error('❌ Error switching role:', result.error)
        alert(`Failed to switch role: ${result.error.message}`)
        setLoading(false)
        setSelectedRole(null)
        return
      }
      
      console.log(`✅ Role switched to: ${role}`)
      
      // Small delay to ensure profile is updated
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to appropriate dashboard
      const dashboardPath = role === 'learner' 
        ? '/dashboard/learner' 
        : '/dashboard/affiliate'
      
      console.log(`🔄 Redirecting to: ${dashboardPath}`)
      router.push(dashboardPath)
    } catch (error) {
      console.error('❌ Error selecting role:', error)
      alert('An error occurred while selecting your role. Please try again.')
      setLoading(false)
      setSelectedRole(null)
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-[#ed874a]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to DigiAfriq!
          </h1>
          <p className="text-lg text-gray-600">
            How would you like to use DigiAfriq today?
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Learner Card */}
          <button
            onClick={() => handleRoleSelection('learner')}
            disabled={loading}
            className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
              selectedRole === 'learner' 
                ? 'border-[#ed874a] scale-105' 
                : 'border-transparent hover:border-[#ed874a]/30'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loading && selectedRole === 'learner' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              </div>
            )}
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ed874a] to-[#f59e6c] rounded-full flex items-center justify-center mb-6 shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                I want to Learn
              </h2>
              
              <p className="text-gray-600 mb-6">
                Access courses, track your progress, earn certificates, and enhance your skills
              </p>
              
              <div className="space-y-2 text-sm text-left w-full">
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#ed874a] rounded-full mr-3"></div>
                  <span>Browse and enroll in courses</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#ed874a] rounded-full mr-3"></div>
                  <span>Track learning progress</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#ed874a] rounded-full mr-3"></div>
                  <span>Earn certificates</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#ed874a] rounded-full mr-3"></div>
                  <span>Download course materials</span>
                </div>
              </div>
            </div>
          </button>

          {/* Affiliate Card */}
          <button
            onClick={() => handleRoleSelection('affiliate')}
            disabled={loading}
            className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
              selectedRole === 'affiliate' 
                ? 'border-[#ed874a] scale-105' 
                : 'border-transparent hover:border-[#ed874a]/30'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {loading && selectedRole === 'affiliate' && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              </div>
            )}
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                I want to Earn
              </h2>
              
              <p className="text-gray-600 mb-6">
                Promote courses, earn commissions, track sales, and grow your income
              </p>
              
              <div className="space-y-2 text-sm text-left w-full">
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Get unique referral links</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Earn 100% commissions</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Track sales and earnings</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Request withdrawals</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            You can switch between roles anytime from your dashboard settings
          </p>
        </div>
      </div>
    </div>
  )
}

export default SelectRolePage
