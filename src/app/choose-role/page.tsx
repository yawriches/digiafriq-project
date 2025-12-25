"use client"
import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { GraduationCap, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const ChooseRolePage = () => {
  const router = useRouter()
  const { user, profile, switchRole, addRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'learner' | 'affiliate' | null>(null)
  const [error, setError] = useState('')

  const handleRoleSelect = (role: 'learner' | 'affiliate') => {
    setSelectedRole(role)
    setError('')
  }

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log(`🎯 User selected role: ${selectedRole}`)
      
      // Check if user has this role in available_roles
      const hasRole = profile?.available_roles?.includes(selectedRole)
      
      if (!hasRole) {
        console.log(`➕ Adding ${selectedRole} to available roles...`)
        const addResult = await addRole(selectedRole)
        if (addResult.error) {
          console.error('❌ Error adding role:', addResult.error)
          setError(`Failed to add role: ${addResult.error.message}`)
          setLoading(false)
          return
        }
        console.log(`✅ Role ${selectedRole} added successfully`)
      }
      
      // Switch to the selected role
      const result = await switchRole(selectedRole)
      
      if (result.error) {
        console.error('❌ Error switching role:', result.error)
        setError(`Failed to switch role: ${result.error.message}`)
        setLoading(false)
        return
      }
      
      console.log(`✅ Role switched to: ${selectedRole}`)
      
      // Small delay to ensure profile is updated
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to appropriate dashboard
      // Check if learner has existing membership first
      if (selectedRole === 'learner') {
        try {
          // Check for active learner membership
          if (!user?.id) {
            console.error('User ID not available for membership check')
            router.push('/dashboard/learner/membership')
            return
          }

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
          
          if (hasLearnerMembership) {
            // Learner with active membership - go directly to dashboard
            router.push('/dashboard/learner')
          } else {
            // Learner without membership - go to membership page
            router.push('/dashboard/learner/membership')
          }
        } catch (error) {
          console.error('Error checking learner membership:', error)
          // Fallback to membership page
          router.push('/dashboard/learner/membership')
        }
      } else {
        // For affiliates, redirect to main dashboard
        router.push('/dashboard/affiliate')
      }
    } catch (error) {
      console.error('❌ Error selecting role:', error)
      setError('An error occurred while selecting your role. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#ed874a]/5 via-white to-[#d76f32]/5 px-4 py-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#ed874a]/5 via-white to-[#d76f32]/5 px-4 py-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border-0 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-[#4A0D66] mb-1">
            How do you plan to use DigiAfriq today?
          </h2>
          <p className="text-[#ed874a]">
            Don&apos;t worry, you can switch between profiles anytime.
          </p>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 max-w-4xl mx-auto mb-6">
          {/* Learner Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('learner')}
            disabled={loading}
            className={`relative group w-full text-left rounded-2xl border transition-all duration-200 p-8 bg-white shadow-sm ${
              selectedRole === 'learner'
                ? 'border-[#ed874a] ring-2 ring-[#ed874a]/20'
                : 'border-[#ed874a]/20 hover:border-[#ed874a]/40 hover:shadow-md'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {/* Radio indicator */}
            <span className={`absolute top-6 right-6 h-6 w-6 rounded-full border-2 ${
              selectedRole === 'learner' ? 'border-[#ed874a] bg-[#ed874a]' : 'border-gray-300 bg-white'
            }`}>
              {selectedRole === 'learner' && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </span>
              )}
            </span>

            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-[#ed874a]/10 text-[#ed874a]`}>
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[#4A0D66] text-lg leading-relaxed">
                  I&apos;m a <span className="font-semibold">learner</span>, I want access to digital skills courses.
                </p>
              </div>
            </div>
          </button>

          {/* Affiliate Card */}
          <button
            type="button"
            onClick={() => handleRoleSelect('affiliate')}
            disabled={loading}
            className={`relative group w-full text-left rounded-2xl border transition-all duration-200 p-8 bg-white shadow-sm ${
              selectedRole === 'affiliate'
                ? 'border-[#ed874a] ring-2 ring-[#ed874a]/20'
                : 'border-[#ed874a]/20 hover:border-[#ed874a]/40 hover:shadow-md'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {/* Radio indicator */}
            <span className={`absolute top-6 right-6 h-6 w-6 rounded-full border-2 ${
              selectedRole === 'affiliate' ? 'border-[#ed874a] bg-[#ed874a]' : 'border-gray-300 bg-white'
            }`}>
              {selectedRole === 'affiliate' && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </span>
              )}
            </span>

            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-[#ed874a]/10 text-[#ed874a]`}>
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[#4A0D66] text-lg leading-relaxed">
                  I&apos;m an <span className="font-semibold">affiliate</span>, I want to earn income by promoting courses.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Dynamic CTA */}
        <Button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          className={`${
            !selectedRole || loading
              ? 'w-full bg-gray-300 text-white text-lg py-3 mt-2 font-semibold rounded-xl cursor-not-allowed'
              : 'w-full bg-[#ed874a] hover:bg-[#d76f32] text-white text-lg py-3 mt-2 font-semibold rounded-xl'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Setting up your profile...
            </>
          ) : (
            selectedRole
              ? `Continue as a ${selectedRole === 'learner' ? 'learner' : 'affiliate'}`
              : 'Choose a profile'
          )}
        </Button>

        {error && <div className="text-red-600 text-sm text-center mt-4">{error}</div>}
      </div>
    </div>
    </Suspense>
  )
}

export default ChooseRolePage
