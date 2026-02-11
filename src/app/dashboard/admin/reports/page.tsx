"use client"
import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CreditCard,
  Award,
  Globe,
  Calendar,
  ArrowLeft,
  Loader2,
  Printer,
  BarChart3,
  PieChart,
  Activity,
  UserCheck,
  BookOpen
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Overview {
  totalUsers: number
  activeUsers: number
  affiliates: number
  affiliatesOnboarded: number
  activeMemberships: number
  totalCourses: number
  publishedCourses: number
  totalReferrals: number
  successfulReferrals: number
  totalRevenue: number
  affiliateRevenue: number
  directRevenue: number
  totalPayments: number
  totalCommissions: number
  pendingCommissions: number
  thisMonthUsers: number
  lastMonthUsers: number
  userGrowthPct: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  revenueGrowthPct: number
}

interface UserGrowthPoint { month: string; total: number; affiliates: number; learners: number }
interface RevenueTrendPoint { month: string; total: number; affiliate: number; direct: number }
interface PaymentTrendPoint { month: string; count: number; amount: number }
interface CountryPoint { country: string; users: number; affiliates: number; revenue: number }

interface CommissionStats {
  totalAmount: number
  approvedAmount: number
  pendingAmount: number
  paidAmount: number
  totalCount: number
  approvedCount: number
  pendingCount: number
  paidCount: number
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([])
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([])
  const [paymentTrend, setPaymentTrend] = useState<PaymentTrendPoint[]>([])
  const [countryData, setCountryData] = useState<CountryPoint[]>([])
  const [commissionStats, setCommissionStats] = useState<CommissionStats | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const initialLoadDone = React.useRef(false)

  const fetchReports = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return
      const headers = { 'Authorization': `Bearer ${sessionData.session.access_token}` }

      const [analyticsRes, commissionsRes] = await Promise.all([
        fetch('/api/admin/analytics', { headers }),
        fetch('/api/admin/commissions?page=1&limit=1', { headers }),
      ])

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setOverview(data.overview)
        setUserGrowth(data.userGrowth || [])
        setRevenueTrend(data.revenueTrend || [])
        setPaymentTrend(data.paymentTrend || [])
        setCountryData(data.countryData || [])
      }

      if (commissionsRes.ok) {
        const data = await commissionsRes.json()
        setCommissionStats(data.stats || null)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchReports, 15000)
    return () => clearInterval(interval)
  }, [fetchReports])

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtNum = (n: number) => n.toLocaleString()

  const handlePrint = () => window.print()

  const handleExportCSV = () => {
    if (!overview) return
    const rows = [
      ['Metric', 'Value'],
      ['Report Date', new Date().toLocaleDateString()],
      [''],
      ['--- USERS ---'],
      ['Total Users', String(overview.totalUsers)],
      ['Active Users', String(overview.activeUsers)],
      ['Affiliates', String(overview.affiliates)],
      ['Affiliates Onboarded', String(overview.affiliatesOnboarded)],
      ['This Month Signups', String(overview.thisMonthUsers)],
      ['Last Month Signups', String(overview.lastMonthUsers)],
      ['User Growth %', `${overview.userGrowthPct}%`],
      [''],
      ['--- REVENUE ---'],
      ['Total Revenue (USD)', fmt(overview.totalRevenue)],
      ['Affiliate Revenue', fmt(overview.affiliateRevenue)],
      ['Direct Revenue', fmt(overview.directRevenue)],
      ['This Month Revenue', fmt(overview.thisMonthRevenue)],
      ['Last Month Revenue', fmt(overview.lastMonthRevenue)],
      ['Revenue Growth %', `${overview.revenueGrowthPct}%`],
      ['Total Payments', String(overview.totalPayments)],
      [''],
      ['--- COMMISSIONS ---'],
      ['Total Commissions (USD)', fmt(commissionStats?.totalAmount || 0)],
      ['Approved / Available', fmt(commissionStats?.approvedAmount || 0)],
      ['Pending', fmt(commissionStats?.pendingAmount || 0)],
      ['Paid Out', fmt(commissionStats?.paidAmount || 0)],
      [''],
      ['--- PLATFORM ---'],
      ['Total Courses', String(overview.totalCourses)],
      ['Published Courses', String(overview.publishedCourses)],
      ['Active Memberships', String(overview.activeMemberships)],
      ['Total Referrals', String(overview.totalReferrals)],
      [''],
      ['--- MONTHLY REVENUE TREND ---'],
      ['Month', 'Total', 'Affiliate', 'Direct'],
      ...revenueTrend.map(r => [r.month, r.total.toFixed(2), r.affiliate.toFixed(2), r.direct.toFixed(2)]),
      [''],
      ['--- MONTHLY USER GROWTH ---'],
      ['Month', 'Total', 'Learners', 'Affiliates'],
      ...userGrowth.map(u => [u.month, String(u.total), String(u.learners), String(u.affiliates)]),
      [''],
      ['--- COUNTRY BREAKDOWN ---'],
      ['Country', 'Users', 'Affiliates', 'Revenue (USD)'],
      ...countryData.map(c => [c.country, String(c.users), String(c.affiliates), c.revenue.toFixed(2)]),
    ]

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `platform-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Reports">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Generating reports...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  const o = overview!
  const cs = commissionStats

  const affiliatePct = o.totalRevenue > 0 ? ((o.affiliateRevenue / o.totalRevenue) * 100).toFixed(1) : '0'
  const directPct = o.totalRevenue > 0 ? ((o.directRevenue / o.totalRevenue) * 100).toFixed(1) : '0'

  // Revenue chart max
  const revenueMax = Math.max(...revenueTrend.map(d => d.total), 1)
  const userMax = Math.max(...userGrowth.map(d => d.total), 1)
  const paymentMax = Math.max(...paymentTrend.map(d => d.amount), 1)

  return (
    <AdminDashboardLayout title="Reports">
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Reports</h1>
              <p className="text-sm text-gray-500">
                Comprehensive overview &middot; Last updated: {lastUpdated?.toLocaleTimeString() || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchReports}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button size="sm" onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">DigiafrIQ Platform Report</h1>
          <p className="text-sm text-gray-500">Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        </div>

        {/* ── SECTION 1: Executive Summary ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Executive Summary</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900">{fmt(o.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Users</p>
                    <p className="text-xl font-bold text-gray-900">{fmtNum(o.totalUsers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Payments</p>
                    <p className="text-xl font-bold text-gray-900">{fmtNum(o.totalPayments)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Commissions</p>
                    <p className="text-xl font-bold text-gray-900">{fmt(cs?.totalAmount || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── SECTION 2: Growth Metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Growth Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-lg font-bold text-gray-900">{fmtNum(o.thisMonthUsers)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Last Month</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">{fmtNum(o.lastMonthUsers)}</p>
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${o.userGrowthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {o.userGrowthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {o.userGrowthPct >= 0 ? '+' : ''}{o.userGrowthPct}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-medium">{fmtNum(o.activeUsers)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Affiliates</span>
                  <span className="font-medium">{fmtNum(o.affiliates)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Onboarded Affiliates</span>
                  <span className="font-medium">{fmtNum(o.affiliatesOnboarded)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Growth Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Revenue Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(o.thisMonthRevenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Last Month</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">{fmt(o.lastMonthRevenue)}</p>
                    <div className={`flex items-center gap-0.5 text-xs font-medium ${o.revenueGrowthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {o.revenueGrowthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {o.revenueGrowthPct >= 0 ? '+' : ''}{o.revenueGrowthPct}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-gray-600">Affiliate Revenue</span>
                  </div>
                  <span className="font-medium">{fmt(o.affiliateRevenue)} <span className="text-gray-400 text-xs">({affiliatePct}%)</span></span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-gray-600">Direct Revenue</span>
                  </div>
                  <span className="font-medium">{fmt(o.directRevenue)} <span className="text-gray-400 text-xs">({directPct}%)</span></span>
                </div>
                {/* Revenue split bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex mt-2">
                  <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${affiliatePct}%` }} />
                  <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${directPct}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── SECTION 3: Revenue Trend Chart ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Monthly Revenue Trend (12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1 pt-2">
              {revenueTrend.map((point, i) => {
                const height = Math.max((point.total / revenueMax) * 100, 2)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 print:hidden">
                      <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow">
                        <p className="font-medium">{point.month}</p>
                        <p>Total: ${point.total.toFixed(2)}</p>
                        <p className="text-orange-300">Aff: ${point.affiliate.toFixed(2)}</p>
                        <p className="text-blue-300">Dir: ${point.direct.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="w-full rounded-t bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer min-h-[2px]" style={{ height: `${height}%` }} />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{point.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 4: User Growth Chart ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Monthly User Signups (12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-end gap-1 pt-2">
              {userGrowth.map((point, i) => {
                const learnerH = userMax > 0 ? (point.learners / userMax) * 100 : 0
                const affH = userMax > 0 ? (point.affiliates / userMax) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 print:hidden">
                      <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow">
                        <p className="font-medium">{point.month}: {point.total}</p>
                        <p className="text-blue-300">Learners: {point.learners}</p>
                        <p className="text-orange-300">Affiliates: {point.affiliates}</p>
                      </div>
                    </div>
                    <div className="w-full flex flex-col-reverse" style={{ height: '100%' }}>
                      <div className="w-full bg-blue-500 rounded-t-sm min-h-0 transition-all" style={{ height: `${Math.max(learnerH, learnerH > 0 ? 1 : 0)}%` }} />
                      <div className="w-full bg-orange-500 min-h-0 transition-all" style={{ height: `${Math.max(affH, affH > 0 ? 1 : 0)}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{point.month}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 text-xs mt-3 pt-2 border-t">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-gray-500">Learners</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-gray-500">Affiliates</span></div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 5: Commissions & Platform ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commissions Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Commissions Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Total', amount: cs?.totalAmount || 0, count: cs?.totalCount || 0, color: 'bg-gray-900', textColor: 'text-gray-900' },
                  { label: 'Approved / Available', amount: cs?.approvedAmount || 0, count: cs?.approvedCount || 0, color: 'bg-green-500', textColor: 'text-green-700' },
                  { label: 'Pending', amount: cs?.pendingAmount || 0, count: cs?.pendingCount || 0, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                  { label: 'Paid Out', amount: cs?.paidAmount || 0, count: cs?.paidCount || 0, color: 'bg-blue-500', textColor: 'text-blue-700' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.count}</Badge>
                    </div>
                    <span className={`text-sm font-semibold ${item.textColor}`}>{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Total Courses', value: fmtNum(o.totalCourses), icon: <BookOpen className="w-4 h-4 text-indigo-500" /> },
                  { label: 'Published Courses', value: fmtNum(o.publishedCourses), icon: <BookOpen className="w-4 h-4 text-green-500" /> },
                  { label: 'Active Memberships', value: fmtNum(o.activeMemberships), icon: <CreditCard className="w-4 h-4 text-orange-500" /> },
                  { label: 'Total Referrals', value: fmtNum(o.totalReferrals), icon: <Users className="w-4 h-4 text-blue-500" /> },
                  { label: 'Successful Referrals', value: fmtNum(o.successfulReferrals), icon: <UserCheck className="w-4 h-4 text-green-500" /> },
                  { label: 'Pending Commissions', value: fmt(o.pendingCommissions), icon: <DollarSign className="w-4 h-4 text-yellow-500" /> },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── SECTION 6: Country Breakdown Table ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" />
              Revenue by Country
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No country data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-600">Country</th>
                      <th className="text-right py-2.5 px-4 font-medium text-gray-600">Users</th>
                      <th className="text-right py-2.5 px-4 font-medium text-gray-600">Affiliates</th>
                      <th className="text-right py-2.5 px-4 font-medium text-gray-600">Revenue (USD)</th>
                      <th className="text-right py-2.5 px-4 font-medium text-gray-600">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryData.map((c, i) => {
                      const share = o.totalRevenue > 0 ? ((c.revenue / o.totalRevenue) * 100).toFixed(1) : '0'
                      return (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2.5 px-4 font-medium text-gray-900">{c.country}</td>
                          <td className="py-2.5 px-4 text-right text-gray-700">{fmtNum(c.users)}</td>
                          <td className="py-2.5 px-4 text-right text-gray-700">{fmtNum(c.affiliates)}</td>
                          <td className="py-2.5 px-4 text-right font-semibold text-gray-900">{fmt(c.revenue)}</td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${share}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{share}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 7: Payment Volume Chart ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-600" />
              Monthly Payment Volume (12 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-36 flex items-end gap-1 pt-2">
              {paymentTrend.map((point, i) => {
                const height = Math.max((point.amount / paymentMax) * 100, 2)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 print:hidden">
                      <div className="bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow">
                        <p className="font-medium">{point.month}</p>
                        <p>{point.count} payments &middot; ${point.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="w-full rounded-t bg-orange-500 hover:bg-orange-400 transition-all cursor-pointer min-h-[2px]" style={{ height: `${height}%` }} />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{point.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
          <p>DigiafrIQ Platform Report &middot; Auto-refreshes every 15 seconds &middot; {new Date().getFullYear()}</p>
        </div>
      </div>
    </AdminDashboardLayout>
  )
}
