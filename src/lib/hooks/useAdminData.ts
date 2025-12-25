"use client"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { CURRENCY_RATES } from '@/contexts/CurrencyContext'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  pendingUsers: number
  totalRevenue: number
  activeCourses: number
  activeAffiliates: number
  totalPayments: number
  totalCommissions: number
}

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  base_currency_amount?: number
  status: string
  reference: string | null
  created_at: string
  user?: {
    email: string
    full_name: string | null
  }
}

interface AdminData {
  stats: AdminStats
  recentUsers: User[]
  recentPayments: Payment[]
  loading: boolean
  error: string | null
}

export const useAdminData = (): AdminData => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    pendingUsers: 0,
    totalRevenue: 0,
    activeCourses: 0,
    activeAffiliates: 0,
    totalPayments: 0,
    totalCommissions: 0
  })
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get total revenue from payments (with currency for proper conversion) - same as user management
        const { data: revenueData, error: revenueError } = await supabase
          .from('payments')
          .select('amount, currency')
          .eq('status', 'completed')

        if (revenueError) {
          console.error('🔍 Admin Dashboard - Revenue fetch error:', revenueError)
          throw revenueError
        }

        console.log('🔍 Admin Dashboard - Revenue data fetched:', revenueData?.length || 0)
        if (revenueData && revenueData.length > 0) {
          console.log('🔍 Admin Dashboard - Sample revenue data:', revenueData[0])
        }

        // Calculate revenue using exact same logic as user management
        const totalRevenue = revenueData?.reduce((sum: number, p: any) => {
          // Convert payment amount to USD based on its currency
          const currency = p.currency?.toUpperCase() || 'USD'
          let usdAmount = p.amount
          
          console.log(`🔍 Processing payment: ${p.amount} ${currency}`)
          
          // If currency is not USD, convert to USD
          if (currency !== 'USD' && currency in CURRENCY_RATES) {
            usdAmount = p.amount / CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES].rate
            console.log(`🔍 Converted ${p.amount} ${currency} to ${usdAmount} USD`)
          }
          
          return sum + usdAmount
        }, 0) || 0

        console.log('🔍 Admin Dashboard - Total revenue calculated:', totalRevenue)

        // Fetch other data
        const [
          usersResult,
          coursesResult,
          commissionsResult
        ] = await Promise.all([
          (supabase as any).from('profiles').select('*'),
          (supabase as any).from('courses').select('*'),
          (supabase as any).from('commissions').select('*')
        ])

        // Check for errors in data fetching
        if (usersResult.error) {
          console.error('🔍 Admin Dashboard - Users fetch error:', usersResult.error)
        }

        // Process users
        const users = usersResult.data || []
        const affiliates = users.filter((u: User) => u.role === 'affiliate')
        
        // Calculate user status counts
        const activeUsers = users.filter((u: any) => u.status === 'active').length
        const suspendedUsers = users.filter((u: any) => u.status === 'suspended').length
        const pendingUsers = users.filter((u: any) => u.status === 'pending').length

        // Process courses
        const courses = coursesResult.data || []

        // Process commissions
        const commissions = commissionsResult.data || []
        const totalCommissions = commissions.reduce((sum: number, c: any) => {
          // Convert commission amount to USD based on its currency
          const currency = c.commission_currency?.toUpperCase() || 'USD'
          let usdAmount = c.commission_amount || c.amount || 0
          
          // If currency is not USD, convert to USD using proper rates
          if (currency !== 'USD' && currency in CURRENCY_RATES) {
            usdAmount = usdAmount / CURRENCY_RATES[currency as keyof typeof CURRENCY_RATES].rate
          }
          
          return sum + usdAmount
        }, 0)

        // Set stats
        setStats({
          totalUsers: users.length,
          activeUsers,
          suspendedUsers,
          pendingUsers,
          totalRevenue,
          activeCourses: courses.length,
          activeAffiliates: affiliates.length,
          totalPayments: revenueData?.length || 0,
          totalCommissions
        })

        // Set recent users (last 5)
        setRecentUsers(users.slice(0, 5))

        // Set recent payments (last 5) - use revenue data since we don't have full payment data
        setRecentPayments([])

      } catch (err: any) {
        console.error('Error fetching admin data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  return {
    stats,
    recentUsers,
    recentPayments,
    loading,
    error
  }
}
