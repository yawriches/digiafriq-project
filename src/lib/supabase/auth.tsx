'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './client'
import { Database } from './types'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserRole = Database['public']['Enums']['user_role']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  switchRole: (newRole: UserRole) => Promise<{ error: Error | null }>
  addRole: (newRole: UserRole) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user ID:', userId)
      
      // First validate session is still valid
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        console.warn('⚠️ Session invalid or expired during profile fetch:', sessionError?.message)
        // Clear auth state and let middleware handle redirect
        await supabase.auth.signOut()
        return null
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No profile found for user (this is normal for new users):', userId)
        } else {
          console.warn('⚠️ Error fetching profile:', {
            code: error.code,
            message: error.message
          })
        }
        return null
      }

      console.log('✅ Profile fetched successfully:', data)
      return data
    } catch (error) {
      console.error('💥 Unexpected error fetching profile:', error)
      // Check if it's a network/session error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Invalid session') || 
          errorMessage.includes('JWT') ||
          errorMessage.includes('401')) {
        console.warn('🔐 Session expired, signing out...')
        await supabase.auth.signOut()
      }
      return null
    }
  }

  // Create profile for new user with retry logic
  const createProfile = async (user: User, fullName?: string) => {
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get full_name from user metadata if not provided
        const name = fullName || user.user_metadata?.full_name || null
        
        console.log(`👤 Creating profile (attempt ${attempt}/${maxRetries}) for user:`, {
          id: user.id,
          email: user.email,
          full_name: name
        })
        
        const profileData = {
          id: user.id,
          email: user.email!,
          full_name: name,
          role: 'learner' as const,
          active_role: 'learner' as const,
          available_roles: ['learner']
        }
        
        const { data, error } = await (supabase as any)
          .from('profiles')
          .insert([profileData])
          .select()
          .single()

        if (error) {
          console.warn(`⚠️ Error creating profile (attempt ${attempt}):`, {
            code: error.code,
            message: error.message
          })
          
          // Don't retry on duplicate key errors
          if (error.code === '23505') {
            console.log('ℹ️ Profile already exists, fetching it instead')
            return await fetchProfile(user.id)
          }
          
          // Retry on network errors
          if (attempt < maxRetries) {
            console.log(`⏳ Retrying in 1 second...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
          
          return null
        }

        console.log('✅ Profile created successfully:', data)
        return data
      } catch (error) {
        console.warn(`⚠️ Exception creating profile (attempt ${attempt}):`, error)
        
        // Retry on network errors
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in 1 second...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        
        return null
      }
    }
    
    return null
  }

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing profile for user:', user.id)
      const profileData = (await fetchProfile(user.id)) as Profile | null
      if (profileData) {
        console.log('✅ Profile refreshed:', profileData.id)
        setProfile(profileData)
      } else {
        console.warn('⚠️ Profile refresh returned null, keeping existing profile state')
      }
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('🔄 Starting sign-up process for:', email)
      console.log('📝 Full name provided:', fullName)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: undefined // Disable email confirmation
        }
      })

      if (error) {
        console.error('❌ Supabase sign-up error:', error)
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        return { error }
      }

      console.log('✅ Supabase sign-up successful:', {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          email_confirmed_at: data.user.email_confirmed_at,
          created_at: data.user.created_at
        } : null,
        session: data.session ? 'Session created' : 'No session (email confirmation required)'
      })

      // Profile creation will be handled in the auth state change listener
      // when the user confirms their email and signs in
      return { error: null }
    } catch (error) {
      console.error('💥 Unexpected error during sign-up:', error)
      return { error: error as AuthError }
    }
  }

  // Sign in function with retry logic
  const signIn = async (email: string, password: string) => {
    const maxRetries = 3
    let lastError: AuthError | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting sign-in (attempt ${attempt}/${maxRetries}) for:`, email)
        console.log('📋 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          console.error(`❌ Sign-in error (attempt ${attempt}):`, {
            message: error.message,
            status: error.status,
            name: error.name
          })
          lastError = error
          
          // Don't retry on auth errors (invalid credentials)
          if (error.status === 400 || error.message.includes('Invalid')) {
            return { error }
          }
          
          // Retry on network errors
          if (attempt < maxRetries) {
            console.log(`⏳ Retrying in 1 second...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
        } else {
          console.log('✅ Sign-in successful')
          return { error: null }
        }
      } catch (error) {
        console.error(`💥 Sign-in exception (attempt ${attempt}):`, error)
        lastError = error as AuthError
        
        // Retry on network errors
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in 1 second...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
      }
    }

    return { error: lastError }
  }

  const resetPassword = async (email: string) => {
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || '').trim()
      const origin = baseUrl
        ? (baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`)
        : window.location.origin

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/set-password`,
      })

      if (error) {
        return { error }
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      console.log('🔄 Starting sign-out process...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Sign-out error:', error)
        return { error }
      }
      
      console.log('✅ Sign-out successful, clearing state...')
      setUser(null)
      setProfile(null)
      setSession(null)
      
      // Clear any pending data
      localStorage.removeItem('pendingRole')
      localStorage.removeItem('pendingUserData')
      
      console.log('✅ State cleared successfully')
      return { error: null }
    } catch (error) {
      console.error('💥 Unexpected sign-out error:', error)
      return { error: error as AuthError }
    }
  }

  // Update profile function
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) return { error: new Error(error.message) }

      setProfile(data)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Switch active role function
  const switchRole = async (newRole: UserRole) => {
    let currentUser = user
    
    // If user is null in context, try to get current session
    if (!currentUser) {
      console.log('🔄 User not in context for switchRole, fetching current session...')
      const { data: { session } } = await supabase.auth.getSession()
      currentUser = session?.user || null
      console.log('📊 Current session user for switchRole:', {
        hasUser: !!currentUser,
        userId: currentUser?.id,
        userEmail: currentUser?.email
      })
    }
    
    if (!currentUser) return { error: new Error('No user logged in') }

    try {
      console.log('🔄 Switching role to:', newRole, 'for user:', currentUser.id)
      
      const { error } = await (supabase as any).rpc('switch_active_role', {
        user_id: currentUser.id,
        new_active_role: newRole
      })

      if (error) {
        console.error('❌ Error switching role:', error)
        return { error: new Error(error.message) }
      }

      // Refresh profile to get updated role
      await refreshProfile()
      
      console.log('✅ Role switched successfully to:', newRole)
      return { error: null }
    } catch (error) {
      console.error('💥 Unexpected error switching role:', error)
      return { error: error as Error }
    }
  }

  // Add role to user function
  const addRole = async (newRole: UserRole) => {
    let currentUser = user
    
    // If user is null in context, try to get current session
    if (!currentUser) {
      console.log('🔄 User not in context, fetching current session...')
      const { data: { session } } = await supabase.auth.getSession()
      currentUser = session?.user || null
      console.log('📊 Current session user:', {
        hasUser: !!currentUser,
        userId: currentUser?.id,
        userEmail: currentUser?.email
      })
    }
    
    if (!currentUser) return { error: new Error('No user logged in') }

    try {
      console.log('➕ Adding role:', newRole, 'for user:', currentUser.id)
      
      const { error } = await (supabase as any).rpc('add_role_to_user', {
        user_id: currentUser.id,
        new_role: newRole
      })

      if (error) {
        console.error('❌ Error adding role:', error)
        return { error: new Error(error.message) }
      }

      // Refresh profile to get updated available roles
      await refreshProfile()
      
      console.log('✅ Role added successfully:', newRole)
      return { error: null }
    } catch (error) {
      console.error('💥 Unexpected error adding role:', error)
      return { error: error as Error }
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔄 Getting initial session...')
      
      try {
        // Add timeout to prevent infinite loading
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000) // 5 second timeout
        )
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any
        const { data: { session } } = result
        
        if (session) {
          console.log('✅ Initial session found:', session.user.id)
          setSession(session)
          setUser(session.user)
          
          console.log('👤 Initial session found, fetching/creating profile...')
          
          // Fetch or create profile
          let profileData = await fetchProfile(session.user.id)
          if (!profileData) {
            console.log('🎆 No profile found during initial load, creating one...')
            profileData = await createProfile(session.user)
          }
          setProfile(profileData)
        } else {
          console.log('🚪 No initial session found')
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Session timeout') {
          console.warn('⏰ Session check timed out after 5 seconds - continuing without session')
        } else {
          console.error('❌ Error getting initial session:', error)
        }
        console.log('🔄 Continuing without session - user can access login page')
        // Continue without session - user can still access login page
      }
      
      setLoading(false)
      console.log('✅ Initial session check complete')
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change detected:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          emailConfirmed: session?.user?.email_confirmed_at
        })
        
        // Handle session expiration events
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('⚠️ Token refresh failed, session expired')
          // Clear state and let middleware handle redirect
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          console.log('🚪 User signed out or session expired')
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)

        let profileData: Profile | null = null
        
        if (session?.user) {
          console.log('👤 User session found, managing profile...')
          console.log('📋 Session details:', {
            userId: session.user.id,
            email: session.user.email,
            hasAccessToken: !!session.access_token
          })
          
          // Try to fetch existing profile first
          console.log('🔍 Attempting to fetch existing profile...')
          profileData = await fetchProfile(session.user.id)
          
          // If we have a profile in state and fetch failed, use the existing one
          if (!profileData && profile) {
            console.log('✅ Using existing profile from state:', profile.id)
            profileData = profile
          }
          
          if (!profileData) {
            console.log('🔄 No profile found, creating one now...')
            
            // Create profile for any user without one (regardless of event type)
            // Check if there's a pending role from signup
            const pendingRole = localStorage.getItem('pendingRole')
            const pendingUserData = localStorage.getItem('pendingUserData')
            const defaultRole = pendingRole || 'learner'
            
            let additionalData = {}
            if (pendingUserData) {
              try {
                additionalData = JSON.parse(pendingUserData)
              } catch (e) {
                console.error('Error parsing pending user data:', e)
              }
            }
            
            console.log('📝 Creating profile with role:', defaultRole)
            console.log('📝 Additional user data:', additionalData)
            
            // Create profile with the selected role and additional data
            const userData = additionalData as { country?: string; phoneNumber?: string }
            const profileToCreate = {
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || null,
              role: 'learner',
              active_role: 'learner',
              available_roles: ['learner'],
              country: userData.country || null,
              phone: userData.phoneNumber || null
            }
            
            console.log('💾 Inserting profile into database:', profileToCreate)
            
            const { data, error } = await (supabase as any)
              .from('profiles')
              .insert([profileToCreate])
              .select()
              .single()
            
            if (error) {
              console.warn('⚠️ Error creating profile:', {
                code: error?.code,
                message: error?.message,
                details: error?.details,
                hint: error?.hint
              })
              
              // Try to fetch the profile in case it was created despite the error
              console.log('🔄 Attempting to fetch profile after error...')
              const { data: existingProfile, error: fetchError } = await (supabase as any)
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              if (existingProfile) {
                console.log('✅ Profile exists despite error, using it:', existingProfile)
                profileData = existingProfile
              } else {
                console.error('❌ Profile still not found after error:', fetchError)
                profileData = null
              }
            } else {
              console.log('✅ Profile created successfully:', data)
              profileData = data
              // Clear the pending data
              localStorage.removeItem('pendingRole')
              localStorage.removeItem('pendingUserData')
            }
          }
          
          if (profileData) {
            setProfile(profileData)
            console.log('📊 Profile state updated:', `Profile set: ${profileData.id}`)
          } else {
            console.warn('⚠️ No profile data available, profile state not updated')
          }
        } else {
          console.log('🚪 No user session, clearing profile')
          setProfile(null)
        }

        setLoading(false)
        console.log('✅ Auth state change processing complete', {
          hasProfile: !!profileData,
          profileId: profileData?.id,
          profileRole: profileData?.role
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Handle bfcache restoration and session recovery
  useEffect(() => {
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 Page restored from bfcache, refreshing auth state...')
        await recoverSession()
      }
    }

    // Handle visibility change (user returns to tab after being away)
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('👁️ Tab became visible, checking session...')
        await recoverSession()
      }
    }

    const recoverSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('⚠️ Session check failed:', error.message)
          // Clear state and let middleware handle redirect
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (session) {
          console.log('✅ Session is valid, updating state')
          setSession(session)
          setUser(session.user)
          
          // Only fetch profile if we don't have one or if user ID changed
          if (!profile || profile.id !== session.user.id) {
            const profileData = await fetchProfile(session.user.id)
            if (profileData) {
              setProfile(profileData)
            }
          }
        } else {
          console.log('🚪 No session found, clearing state')
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('💥 Session recovery error:', error)
        // Clear state on any error to prevent infinite loading
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    resetPassword,
    signOut,
    updateProfile,
    refreshProfile,
    switchRole,
    addRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Role-based hooks
export function useRequireAuth(redirectTo = '/auth/signin') {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}

export function useRequireRole(requiredRole: UserRole, redirectTo = '/dashboard') {
  const { profile, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && profile && profile.role !== requiredRole) {
      window.location.href = redirectTo
    }
  }, [profile, loading, requiredRole, redirectTo])

  return { profile, loading }
}

export function useIsAdmin() {
  const { profile } = useAuth()
  return profile?.role === 'admin'
}

export function useIsAffiliate() {
  const { profile } = useAuth()
  return profile?.role === 'affiliate'
}

export function useIsLearner() {
  const { profile } = useAuth()
  return profile?.role === 'learner'
}
