'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { useRouter } from 'next/navigation'
import { User, Briefcase, Loader2, Lock } from 'lucide-react'

type UserRole = 'learner' | 'affiliate' | 'admin'

interface RoleSwitcherProps {
  className?: string
}

export default function RoleSwitcher({ className = '' }: RoleSwitcherProps) {
  const { profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!profile) return null

  // Get available roles from profile
  const availableRoles = (profile as any).available_roles || [profile.role]
  const activeRole = (profile as any).active_role || profile.role

  // All possible roles to display
  const allRoles: UserRole[] = ['learner', 'affiliate']

  // Check if user has access to a role
  const hasRole = (role: UserRole) => availableRoles.includes(role)
  const isLocked = (role: UserRole) => !hasRole(role)

  const handleRoleClick = async (role: UserRole) => {
    // If role is active, do nothing
    if (role === activeRole) return

    // If role is locked, handle based on role type
    if (isLocked(role)) {
      if (role === 'affiliate') {
        // Redirect to affiliate dashboard to show pending payment
        router.push('/dashboard/affiliate')
      } else if (role === 'learner') {
        // Learner role is free - just add it automatically
        // This shouldn't normally happen, but handle it gracefully
        setError('Please contact support to activate the learner role.')
      }
      return
    }

    // Switch to the role
    setSwitching(true)
    setError(null)
    
    try {
      // Import supabase client dynamically to avoid circular dependencies
      const { supabase } = await import('@/lib/supabase/client')
      
      // Validate session before proceeding
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        console.warn('⚠️ Session expired during role switch')
        setError('Your session has expired. Please log in again.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
        setSwitching(false)
        return
      }
      
      // Call the switch_active_role function
      const { error: switchError } = await (supabase as any).rpc('switch_active_role', {
        user_id: profile.id,
        new_active_role: role
      })

      if (switchError) {
        console.error('Error switching role:', switchError)
        setError('Failed to switch role. Please try again.')
        setSwitching(false)
        return
      }

      // Refresh profile to get updated role
      await refreshProfile()

      // Redirect to appropriate dashboard with full page reload
      // This ensures the layout re-executes and properly loads the new role
      const dashboardMap: Record<UserRole, string> = {
        learner: '/dashboard/learner',
        affiliate: '/dashboard/affiliate',
        admin: '/dashboard/admin'
      }

      // Use window.location.href for full page reload instead of router.push
      window.location.href = dashboardMap[role]
    } catch (err) {
      console.error('Unexpected error switching role:', err)
      setError('An unexpected error occurred.')
    } finally {
      setSwitching(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'learner':
        return <User className="w-4 h-4" />
      case 'affiliate':
        return <Briefcase className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'learner':
        return 'Learner'
      case 'affiliate':
        return 'Affiliate'
      case 'admin':
        return 'Admin'
      default:
        return role
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Switch Role</h3>
        {switching && <Loader2 className="w-4 h-4 animate-spin text-[#ed874a]" />}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {allRoles.map((role: UserRole) => {
          const locked = isLocked(role)
          const active = role === activeRole
          
          return (
            <button
              key={role}
              onClick={() => handleRoleClick(role)}
              disabled={switching || active}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 flex-1 relative
                ${active
                  ? 'bg-[#ed874a] text-white shadow-md'
                  : locked
                  ? 'bg-gray-50 text-gray-400 border-2 border-dashed border-gray-300 hover:border-[#ed874a] hover:text-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${switching ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {locked && <Lock className="w-3 h-3 absolute top-1 right-1" />}
              {getRoleIcon(role)}
              <span>{getRoleLabel(role)}</span>
              {locked && <span className="text-xs ml-1">(Locked)</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs text-gray-500">
          Currently viewing as: <span className="font-semibold text-gray-700">{getRoleLabel(activeRole)}</span>
        </p>
        {allRoles.some(role => isLocked(role)) && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Click locked role to get started
          </p>
        )}
      </div>
    </div>
  )
}
