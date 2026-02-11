"use client"
import React, { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Loader2,
  ArrowLeft,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Stats {
  totalRevenue: number
  affiliateRevenue: number
  directRevenue: number
  totalPayments: number
  affiliatePayments: number
  directPayments: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  monthOverMonthChange: number
}

interface ChartPoint {
  total: number
  affiliate: number
  direct: number
  month?: string
  day?: string
}

type ChartView = 'monthly' | 'daily'

export default function RevenuePage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [monthlyChart, setMonthlyChart] = useState<ChartPoint[]>([])
  const [dailyChart, setDailyChart] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [chartView, setChartView] = useState<ChartView>('monthly')
  const [chartType, setChartType] = useState<'total' | 'affiliate' | 'direct'>('total')

  const initialLoadDone = React.useRef(false)

  const fetchRevenue = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) return

      const response = await fetch('/api/admin/revenue', {
        headers: { 'Authorization': `Bearer ${sessionData.session.access_token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch revenue data')

      const data = await response.json()
      setStats(data.stats)
      setMonthlyChart(data.monthlyChart || [])
      setDailyChart(data.dailyChart || [])
    } catch (error) {
      console.error('Error fetching revenue:', error)
    } finally {
      setLoading(false)
      initialLoadDone.current = true
    }
  }, [])

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchRevenue, 15000)
    return () => clearInterval(interval)
  }, [fetchRevenue])

  const chartData = chartView === 'monthly' ? monthlyChart : dailyChart
  const maxValue = Math.max(...chartData.map(d => d.total), 1)

  const getBarHeight = (value: number) => {
    return Math.max((value / maxValue) * 100, 2)
  }

  const affiliatePercent = stats && stats.totalRevenue > 0
    ? ((stats.affiliateRevenue / stats.totalRevenue) * 100).toFixed(1)
    : '0'
  const directPercent = stats && stats.totalRevenue > 0
    ? ((stats.directRevenue / stats.totalRevenue) * 100).toFixed(1)
    : '0'

  if (loading) {
    return (
      <AdminDashboardLayout title="Revenue">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading revenue data...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Revenue">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchRevenue()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Overview</h1>
              <p className="text-sm text-gray-500">Track all revenue streams across your platform</p>
            </div>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">Total Revenue</p>
                  <p className="text-3xl font-bold mt-1">${(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-emerald-200 mt-2">{stats?.totalPayments || 0} payments</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Affiliate Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">${(stats?.affiliateRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats?.affiliatePayments || 0} sales ({affiliatePercent}%)</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Direct Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">${(stats?.directRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats?.directPayments || 0} sales ({directPercent}%)</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats?.thisMonthRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {(stats?.monthOverMonthChange || 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${(stats?.monthOverMonthChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(stats?.monthOverMonthChange || 0) >= 0 ? '+' : ''}{stats?.monthOverMonthChange || 0}% vs last month
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown Bar */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden flex">
                  <div
                    className="bg-orange-500 h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
                    style={{ width: `${affiliatePercent}%`, minWidth: Number(affiliatePercent) > 0 ? '60px' : '0' }}
                  >
                    {Number(affiliatePercent) > 5 ? `${affiliatePercent}%` : ''}
                  </div>
                  <div
                    className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
                    style={{ width: `${directPercent}%`, minWidth: Number(directPercent) > 0 ? '60px' : '0' }}
                  >
                    {Number(directPercent) > 5 ? `${directPercent}%` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-gray-600">Affiliate ({affiliatePercent}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600">Direct ({directPercent}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                Revenue Trend
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('total')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'total' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Total
                  </button>
                  <button
                    onClick={() => setChartType('affiliate')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'affiliate' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Affiliate
                  </button>
                  <button
                    onClick={() => setChartType('direct')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'direct' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Direct
                  </button>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartView('monthly')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartView === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    12 Months
                  </button>
                  <button
                    onClick={() => setChartView('daily')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartView === 'daily' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    30 Days
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-end gap-1 pt-4">
              {chartData.map((point, i) => {
                const value = point[chartType]
                const height = getBarHeight(value)
                const barColor = chartType === 'affiliate' ? 'bg-orange-500' : chartType === 'direct' ? 'bg-blue-500' : 'bg-emerald-500'
                const label = point.month || point.day || ''

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p>${value.toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-md ${barColor} transition-all duration-300 hover:opacity-80 cursor-pointer min-h-[2px]`}
                      style={{ height: `${height}%` }}
                    />
                    {/* Label */}
                    <span className="text-[10px] text-gray-400 truncate w-full text-center leading-tight">
                      {chartView === 'monthly' ? label : (i % 3 === 0 ? label : '')}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stacked Comparison Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Affiliate vs Direct Revenue ({chartView === 'monthly' ? 'Monthly' : 'Daily'})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-1 pt-4">
              {chartData.map((point, i) => {
                const affiliateH = maxValue > 0 ? (point.affiliate / maxValue) * 100 : 0
                const directH = maxValue > 0 ? (point.direct / maxValue) * 100 : 0
                const label = point.month || point.day || ''

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-orange-300">Affiliate: ${point.affiliate.toFixed(2)}</p>
                        <p className="text-blue-300">Direct: ${point.direct.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="w-full flex flex-col-reverse" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-orange-500 rounded-t-sm transition-all duration-300 min-h-0"
                        style={{ height: `${Math.max(affiliateH, affiliateH > 0 ? 1 : 0)}%` }}
                      />
                      <div
                        className="w-full bg-blue-500 transition-all duration-300 min-h-0"
                        style={{ height: `${Math.max(directH, directH > 0 ? 1 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 truncate w-full text-center leading-tight">
                      {chartView === 'monthly' ? label : (i % 3 === 0 ? label : '')}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-6 text-sm mt-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-600">Affiliate Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600">Direct Revenue</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}
