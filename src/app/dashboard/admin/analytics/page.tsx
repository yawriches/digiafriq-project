"use client"
import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Globe,
  BarChart3,
  BookOpen,
  UserCheck,
  CreditCard,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'

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
interface HeatmapRow { day: string; hours: number[] }

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([])
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([])
  const [paymentTrend, setPaymentTrend] = useState<PaymentTrendPoint[]>([])
  const [countryData, setCountryData] = useState<CountryPoint[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapRow[]>([])
  const [activeChart, setActiveChart] = useState<'users' | 'revenue' | 'payments'>('revenue')

  const initialLoadDone = React.useRef(false)

  const fetchAnalytics = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const response = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const data = await response.json()
      setOverview(data.overview)
      setUserGrowth(data.userGrowth || [])
      setRevenueTrend(data.revenueTrend || [])
      setPaymentTrend(data.paymentTrend || [])
      setCountryData(data.countryData || [])
      setHeatmap(data.heatmap || [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 15000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtShort = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
    return `$${n.toFixed(0)}`
  }

  const getCountryFlag = (country: string): string => {
    const codes: Record<string, string> = {
      'Ghana': 'GH', 'Nigeria': 'NG', 'United States': 'US', 'USA': 'US',
      'Kenya': 'KE', 'South Africa': 'ZA', 'United Kingdom': 'GB', 'UK': 'GB',
      'Cameroon': 'CM', 'Senegal': 'SN', 'Tanzania': 'TZ', 'Uganda': 'UG',
    }
    const code = codes[country]
    if (!code) return '🌍'
    const codePoints = code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Analytics">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  const o = overview!

  // Chart data helpers
  const getChartData = () => {
    if (activeChart === 'users') return userGrowth.map(d => ({ label: d.month, values: [d.learners, d.affiliates] }))
    if (activeChart === 'revenue') return revenueTrend.map(d => ({ label: d.month, values: [d.direct, d.affiliate] }))
    return paymentTrend.map(d => ({ label: d.month, values: [d.amount] }))
  }
  const chartData = getChartData()
  const chartMax = Math.max(...chartData.map(d => d.values.reduce((a, b) => a + b, 0)), 1)

  const chartColors = activeChart === 'payments'
    ? [['bg-emerald-500']]
    : activeChart === 'users'
      ? [['bg-blue-500'], ['bg-orange-500']]
      : [['bg-blue-500'], ['bg-orange-500']]

  const chartLegend = activeChart === 'users'
    ? [{ label: 'Learners', color: 'bg-blue-500' }, { label: 'Affiliates', color: 'bg-orange-500' }]
    : activeChart === 'revenue'
      ? [{ label: 'Direct', color: 'bg-blue-500' }, { label: 'Affiliate', color: 'bg-orange-500' }]
      : [{ label: 'Revenue', color: 'bg-emerald-500' }]

  // Heatmap
  const heatmapMax = Math.max(...heatmap.flatMap(r => r.hours), 1)

  return (
    <AdminDashboardLayout
      title="Analytics"
      headerAction={
        <Button variant="outline" onClick={fetchAnalytics} disabled={loading} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">{fmt(o.totalRevenue)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {o.revenueGrowthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-xs">{o.revenueGrowthPct >= 0 ? '+' : ''}{o.revenueGrowthPct}% vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{o.totalUsers.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {o.userGrowthPct >= 0
                      ? <ArrowUpRight className="w-3 h-3 text-green-600" />
                      : <ArrowDownRight className="w-3 h-3 text-red-600" />}
                    <span className={`text-xs ${o.userGrowthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {o.userGrowthPct >= 0 ? '+' : ''}{o.userGrowthPct}%
                    </span>
                    <span className="text-xs text-gray-400">this month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Affiliates</p>
                  <p className="text-2xl font-bold text-orange-600">{o.affiliates}</p>
                  <p className="text-xs text-gray-400 mt-1">{o.affiliatesOnboarded} onboarded</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Memberships</p>
                  <p className="text-2xl font-bold text-purple-600">{o.activeMemberships}</p>
                  <p className="text-xs text-gray-400 mt-1">{o.totalPayments} total payments</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Affiliate Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{fmt(o.affiliateRevenue)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {o.totalRevenue > 0 ? ((o.affiliateRevenue / o.totalRevenue) * 100).toFixed(1) : '0'}% of total
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Direct Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{fmt(o.directRevenue)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {o.totalRevenue > 0 ? ((o.directRevenue / o.totalRevenue) * 100).toFixed(1) : '0'}% of total
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Commissions</p>
                  <p className="text-xl font-bold text-gray-900">{fmt(o.totalCommissions)}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmt(o.pendingCommissions)} pending</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Courses</p>
                  <p className="text-xl font-bold text-gray-900">{o.totalCourses}</p>
                  <p className="text-xs text-gray-400 mt-1">{o.publishedCourses} published</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                {activeChart === 'users' ? 'User Growth' : activeChart === 'revenue' ? 'Revenue Trend' : 'Payment Volume'}
                <span className="text-sm font-normal text-gray-400">(Last 12 Months)</span>
              </CardTitle>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['revenue', 'users', 'payments'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveChart(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                      activeChart === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bar Chart */}
            <div className="h-64 flex items-end gap-1.5 pt-4">
              {chartData.map((point, i) => {
                const total = point.values.reduce((a, b) => a + b, 0)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <p className="font-medium">{point.label}</p>
                        {point.values.map((v, vi) => (
                          <p key={vi} className="text-gray-300">
                            {chartLegend[vi]?.label}: {activeChart === 'users' ? v : fmtShort(v)}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ height: `${Math.max((total / chartMax) * 100, 2)}%` }}>
                      {point.values.map((v, vi) => (
                        <div
                          key={vi}
                          className={`w-full ${chartColors[vi]?.[0] || 'bg-gray-400'}`}
                          style={{ height: total > 0 ? `${(v / total) * 100}%` : '0%' }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center">{point.label}</span>
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t">
              {chartLegend.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Row: Heatmap + Country */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signup Heatmap */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" />
                Signup Activity Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  {heatmap.map((row, di) => (
                    <div key={di} className="flex items-center gap-1 mb-1">
                      <span className="w-10 text-xs text-gray-500 font-medium">{row.day}</span>
                      <div className="flex gap-0.5 flex-1">
                        {row.hours.map((val, hi) => {
                          const intensity = val / heatmapMax
                          const bg = val === 0 ? 'bg-gray-100'
                            : intensity > 0.7 ? 'bg-orange-500'
                            : intensity > 0.4 ? 'bg-orange-400'
                            : intensity > 0.2 ? 'bg-orange-300'
                            : 'bg-orange-200'
                          return (
                            <div
                              key={hi}
                              className={`w-full h-5 rounded-sm ${bg} cursor-pointer transition-transform hover:scale-110`}
                              title={`${row.day} ${hi}:00 — ${val} signups`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="w-10" />
                    <div className="flex justify-between flex-1 text-[10px] text-gray-400">
                      {[0, 6, 12, 18, 23].map(h => <span key={h}>{h}:00</span>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-400">Less</span>
                    {['bg-gray-100', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400', 'bg-orange-500'].map((c, i) => (
                      <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
                    ))}
                    <span className="text-xs text-gray-400">More</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Country Breakdown */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-500" />
                Users by Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              {countryData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No country data available</p>
              ) : (
                <div className="space-y-3">
                  {countryData.map((c, i) => {
                    const pct = o.totalUsers > 0 ? (c.users / o.totalUsers) * 100 : 0
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-lg w-8">{getCountryFlag(c.country)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">{c.country}</span>
                            <span className="text-sm text-gray-500">{c.users} users</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-[#ed874a] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, 1)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">{pct.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown Bar */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden flex">
                  {o.totalRevenue > 0 && (
                    <>
                      <div
                        className="bg-orange-500 h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
                        style={{ width: `${(o.affiliateRevenue / o.totalRevenue) * 100}%`, minWidth: o.affiliateRevenue > 0 ? '50px' : '0' }}
                      >
                        {(o.affiliateRevenue / o.totalRevenue) * 100 > 8 ? `${((o.affiliateRevenue / o.totalRevenue) * 100).toFixed(1)}%` : ''}
                      </div>
                      <div
                        className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
                        style={{ width: `${(o.directRevenue / o.totalRevenue) * 100}%`, minWidth: o.directRevenue > 0 ? '50px' : '0' }}
                      >
                        {(o.directRevenue / o.totalRevenue) * 100 > 8 ? `${((o.directRevenue / o.totalRevenue) * 100).toFixed(1)}%` : ''}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-gray-600">Affiliate — {fmt(o.affiliateRevenue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600">Direct — {fmt(o.directRevenue)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}

export default AnalyticsPage
