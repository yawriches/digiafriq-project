"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

interface ProfileData {
  id: string
  email: string
  full_name: string | null
  avatar_url?: string | null
  phone?: string | null
  country?: string | null
  city?: string | null
  gender?: string | null
  date_of_birth?: string | null
  bio?: string | null
  payment_methods?: PaymentMethod[] | null
  role: 'learner' | 'affiliate' | 'admin'
  created_at: string
  updated_at: string
}

interface PaymentMethod {
  id: number
  type: 'bank' | 'mobile'
  bankName?: string
  accountNumber?: string
  accountName?: string
  network?: string
  mobileNumber?: string
  isDefault: boolean
}

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  city: string
  sex: string
  dateOfBirth: string
  bio: string
}

interface UseProfileReturn {
  profile: ProfileData | null
  profileForm: ProfileFormData
  paymentMethods: PaymentMethod[]
  loading: boolean
  error: string | null
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  updateProfileForm: (field: string, value: string) => void
  saveProfile: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => Promise<void>
  updatePaymentMethod: (id: number, method: Partial<PaymentMethod>) => Promise<void>
  deletePaymentMethod: (id: number) => Promise<void>
  setDefaultPaymentMethod: (id: number) => Promise<void>
}

export const useProfile = (): UseProfileReturn => {
  const { user, profile: authProfile } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    sex: '',
    dateOfBirth: '',
    bio: ''
  })
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile)
      
      // Parse full name into first and last name
      const nameParts = authProfile.full_name?.split(' ') || ['', '']
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      setProfileForm({
        firstName,
        lastName,
        email: authProfile.email || '',
        phone: authProfile.phone || '',
        country: authProfile.country || '',
        city: (authProfile as any).city || '',
        sex: (authProfile as any).sex || '',
        dateOfBirth: (authProfile as any).date_of_birth || '',
        bio: (authProfile as any).bio || ''
      })
      
      // Load payment methods
      if ((authProfile as any).payment_methods) {
        setPaymentMethods((authProfile as any).payment_methods || [])
      }
      
      setLoading(false)
    } else if (user) {
      // If we have user but no profile, try to fetch it
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [user, authProfile])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch profile: ${fetchError.message}`)
      }

      setProfile(data as ProfileData)
      
      // Parse full name into first and last name
      const nameParts = (data as any).full_name?.split(' ') || ['', '']
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      setProfileForm({
        firstName,
        lastName,
        email: (data as any).email || '',
        phone: (data as any).phone || '',
        country: (data as any).country || '',
        city: (data as any).city || '',
        sex: (data as any).sex || '',
        dateOfBirth: (data as any).date_of_birth || '',
        bio: (data as any).bio || ''
      })
      
      // Load payment methods
      if ((data as any).payment_methods) {
        setPaymentMethods((data as any).payment_methods || [])
      }

    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateProfileForm = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveProfile = async () => {
    if (!user || !profile) {
      throw new Error('No user or profile found')
    }

    try {
      setLoading(true)
      setError(null)

      // Combine first and last name
      const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim()

      const updates = {
        full_name: fullName,
        phone: profileForm.phone || null,
        country: profileForm.country || null,
        city: profileForm.city || null,
        sex: profileForm.sex || null,
        date_of_birth: profileForm.dateOfBirth || null,
        bio: profileForm.bio || null,
        updated_at: new Date().toISOString()
      }

      const { data, error: updateError } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      setProfile(data)
      setIsEditing(false)

    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('No user found')
    }

    try {
      setLoading(true)
      setError(null)

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (passwordError) {
        throw new Error(`Failed to change password: ${passwordError.message}`)
      }

    } catch (err: any) {
      console.error('Error changing password:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Payment method functions
  const savePaymentMethodsToDb = async (methods: PaymentMethod[]) => {
    if (!user) throw new Error('No user found')
    
    const { error: updateError } = await (supabase as any)
      .from('profiles')
      .update({ 
        payment_methods: methods,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Failed to save payment methods: ${updateError.message}`)
    }
  }

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id'>) => {
    try {
      setError(null)
      const newMethod: PaymentMethod = {
        ...method,
        id: Date.now(), // Use timestamp as unique ID
        isDefault: paymentMethods.length === 0 // First method is default
      }
      const updatedMethods = [...paymentMethods, newMethod]
      await savePaymentMethodsToDb(updatedMethods)
      setPaymentMethods(updatedMethods)
    } catch (err: any) {
      console.error('Error adding payment method:', err)
      setError(err.message)
      throw err
    }
  }

  const updatePaymentMethod = async (id: number, updates: Partial<PaymentMethod>) => {
    try {
      setError(null)
      const updatedMethods = paymentMethods.map(method => 
        method.id === id ? { ...method, ...updates } : method
      )
      await savePaymentMethodsToDb(updatedMethods)
      setPaymentMethods(updatedMethods)
    } catch (err: any) {
      console.error('Error updating payment method:', err)
      setError(err.message)
      throw err
    }
  }

  const deletePaymentMethod = async (id: number) => {
    try {
      setError(null)
      const updatedMethods = paymentMethods.filter(method => method.id !== id)
      // If we deleted the default, make the first remaining one default
      if (updatedMethods.length > 0 && !updatedMethods.some(m => m.isDefault)) {
        updatedMethods[0].isDefault = true
      }
      await savePaymentMethodsToDb(updatedMethods)
      setPaymentMethods(updatedMethods)
    } catch (err: any) {
      console.error('Error deleting payment method:', err)
      setError(err.message)
      throw err
    }
  }

  const setDefaultPaymentMethod = async (id: number) => {
    try {
      setError(null)
      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
      await savePaymentMethodsToDb(updatedMethods)
      setPaymentMethods(updatedMethods)
    } catch (err: any) {
      console.error('Error setting default payment method:', err)
      setError(err.message)
      throw err
    }
  }

  return {
    profile,
    profileForm,
    paymentMethods,
    loading,
    error,
    isEditing,
    setIsEditing,
    updateProfileForm,
    saveProfile,
    changePassword,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod
  }
}
