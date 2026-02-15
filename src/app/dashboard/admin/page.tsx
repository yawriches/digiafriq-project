"use client"
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Award,
  Link2,
  BarChart3,
  Clock,
  ArrowRight,
  RefreshCw,
  Globe,
  CreditCard,
  Crown,
  Loader2,
  FileText,
  Settings,
  Bell,
  Activity,
  UserCheck,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

interface DashboardData {
  stats: {
    totalUsers: number
    activeUsers: number
    totalRevenue: number
    activeCourses: number
    activeAffiliates: number
    totalPayments: number
    totalCommissions: number
    affiliatesOnboarded: number
    affiliateSales: number
    directSales: number
    totalLearners: number
    unpaidAccounts: number
  }
  recentUsers: { id: string; email: string; full_name: string | null; role: string; created_at: string }[]
  recentPayments: {
    id: string; amount: number; currency: string; status: string; created_at: string;
    user?: { email: string; full_name: string | null }
  }[]
}

const AdminDashboard = () => {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const initialLoadDone = React.useRef(false)

  const fetchDashboard = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const headers = { 'Authorization': `Bearer ${sessionData.session.access_token}` }
      const response = await fetch('/api/admin/dashboard-stats', { headers })
      if (!response.ok) throw new Error('Failed to fetch')
      const apiData = await response.json()

      // Fetch recent payments with user info
      const { data: recentPaymentsRaw } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8)

      const recentPayments = await Promise.all(
        (recentPaymentsRaw || []).map(async (p: any) => {
          let user = undefined
          if (p.user_id) {
            const { data: userData } = await supabase
              .from('profiles').select('id, full_name, email').eq('id', p.user_id).single()
            if (userData) user = { email: userData.email, full_name: userData.full_name }
          }
          if (!user && p.metadata) {
            const meta = p.metadata
            const guestEmail = meta.guest_email || meta.email || null
            const guestName = meta.guest_name || meta.full_name || null
            if (guestEmail || guestName) user = { email: guestEmail || '', full_name: guestName }
          }
          return {
            id: p.id, amount: p.amount, currency: p.currency || 'USD',
            status: p.status, created_at: p.created_at, user,
          }
        })
      )

      setData({ ...apiData, recentPayments })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 15000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtNum = (n: number) => n.toLocaleString()
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Dashboard">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  const s = data?.stats || {
    totalUsers: 0, activeUsers: 0, totalRevenue: 0, activeCourses: 0,
    activeAffiliates: 0, totalPayments: 0, totalCommissions: 0,
    affiliatesOnboarded: 0, affiliateSales: 0, directSales: 0,
    totalLearners: 0, unpaidAccounts: 0,
  }

  const totalSales = s.affiliateSales + s.directSales
  const affPct = totalSales > 0 ? ((s.affiliateSales / totalSales) * 100).toFixed(0) : '0'
  const directPct = totalSales > 0 ? ((s.directSales / totalSales) * 100).toFixed(0) : '0'

  return (
    <AdminDashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Real-time platform metrics {lastUpdated && <span>&middot; Updated {lastUpdated.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchDashboard}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/admin/reports')}>
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/admin/settings')}>
              <Settings className="w-4 h-4 mr-1.5" />
            </Button>
          </div>
        </div>

        {/* Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/admin/revenue')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">{fmt(s.totalRevenue)}</p>
                  <p className="text-xs text-emerald-200 mt-1">{fmtNum(s.totalPayments)} payments</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/admin/users')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total Users</p>
                  <p className="text-2xl font-bold mt-1">{fmtNum(s.totalUsers)}</p>
                  <p className="text-xs text-blue-200 mt-1">{fmtNum(s.activeUsers)} active</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-amber-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/admin/commissions')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-100">Commissions</p>
                  <p className="text-2xl font-bold mt-1">{fmt(s.totalCommissions)}</p>
                  <p className="text-xs text-orange-200 mt-1">{fmtNum(s.affiliatesOnboarded)} affiliates</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-violet-600 text-white cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/admin/analytics')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-100">Total Sales</p>
                  <p className="text-2xl font-bold mt-1">{fmtNum(totalSales)}</p>
                  <p className="text-xs text-purple-200 mt-1">{fmtNum(s.activeCourses)} courses</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats + Sales Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* User Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">User Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Active Users', value: fmtNum(s.activeUsers), icon: <UserCheck className="w-4 h-4 text-green-500" />, color: 'bg-green-50' },
                { label: 'Affiliates', value: fmtNum(s.activeAffiliates), icon: <Crown className="w-4 h-4 text-orange-500" />, color: 'bg-orange-50' },
                { label: 'Onboarded Affiliates', value: fmtNum(s.affiliatesOnboarded), icon: <Award className="w-4 h-4 text-purple-500" />, color: 'bg-purple-50' },
                { label: 'Learners', value: fmtNum(s.totalLearners || 0), icon: <BookOpen className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>{item.icon}</div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sales Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-600">Affiliate Sales</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{fmtNum(s.affiliateSales)}</span>
                    <span className="text-xs text-gray-400 ml-1.5">({affPct}%)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600">Direct Sales</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{fmtNum(s.directSales)}</span>
                    <span className="text-xs text-gray-400 ml-1.5">({directPct}%)</span>
                  </div>
                </div>
                {/* Split bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                  <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${affPct}%` }} />
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${directPct}%` }} />
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Sales</span>
                    <span className="text-lg font-bold text-gray-900">{fmtNum(totalSales)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Payments', icon: CreditCard, color: 'text-green-600 bg-green-50', href: '/dashboard/admin/payments' },
                { label: 'Add User', icon: UserPlus, color: 'text-blue-600 bg-blue-50', href: '/dashboard/admin/add-user' },
                { label: 'Create Course', icon: BookOpen, color: 'text-purple-600 bg-purple-50', href: '/dashboard/admin/courses/create' },
                { label: 'Analytics', icon: BarChart3, color: 'text-orange-600 bg-orange-50', href: '/dashboard/admin/analytics' },
                { label: 'Notifications', icon: Bell, color: 'text-rose-600 bg-rose-50', href: '/dashboard/admin/notifications' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Users */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Users</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600" onClick={() => router.push('/dashboard/admin/users')}>
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(data?.recentUsers || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No recent users</p>
              ) : (
                <div className="space-y-2">
                  {(data?.recentUsers || []).slice(0, 6).map((user, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {(user.full_name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{user.full_name || 'No name'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{user.role}</Badge>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(user.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Payments</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600" onClick={() => router.push('/dashboard/admin/payments')}>
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(data?.recentPayments || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No recent payments</p>
              ) : (
                <div className="space-y-2">
                  {(data?.recentPayments || []).slice(0, 6).map((payment, i) => {
                    const statusColor = payment.status === 'completed' ? 'bg-green-100 text-green-700'
                      : payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                    const currencySymbol: Record<string, string> = { USD: '$', GHS: '₵', NGN: '₦', EUR: '€', GBP: '£' }
                    const sym = currencySymbol[payment.currency?.toUpperCase()] || payment.currency || '$'
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payment.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <CreditCard className={`w-4 h-4 ${payment.status === 'completed' ? 'text-green-500' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                              {payment.user?.full_name || payment.user?.email || 'Guest'}
                            </p>
                            <p className="text-xs text-gray-400">{timeAgo(payment.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{sym}{payment.amount?.toLocaleString()}</p>
                          <Badge className={`text-[10px] px-1.5 py-0 ${statusColor}`}>{payment.status}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Status */}
        <div className="flex items-center justify-between py-3 px-1 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Live</span>
            </div>
            <span className="text-xs text-gray-400">Auto-refreshes every 15s</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {lastUpdated?.toLocaleTimeString() || '—'}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}

export default AdminDashboard
