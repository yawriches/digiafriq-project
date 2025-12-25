"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Globe,
  Filter,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'

// Constants
const DCS_PRICE_USD = 8
const MEMBERSHIP_PRICE_USD = 20

type TimePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
type ComparisonPeriod = 'weekly' | 'monthly' | 'yearly'

interface TimeSeriesData {
  label: string
  learnerOnly: number
  dcsAddon: number
  total: number
}

interface CountryData {
  country: string
  countryCode: string
  users: number
  sales: number
  learnerOnly: number
  dcsAddon: number
}

interface AnalyticsState {
  // Overview stats
  totalUsers: number
  totalSales: number
  dcsUsers: number
  dcsSales: number
  learnerOnlyUsers: number
  learnerOnlySales: number
  
  // Time series data
  userTimeSeries: TimeSeriesData[]
  salesTimeSeries: TimeSeriesData[]
  
  // Growth comparison
  userGrowthComparison: {
    current: { learnerOnly: number; dcsAddon: number }
    previous: { learnerOnly: number; dcsAddon: number }
  }
  salesGrowthComparison: {
    current: { learnerOnly: number; dcsAddon: number }
    previous: { learnerOnly: number; dcsAddon: number }
  }
  
  // Country data
  countryData: CountryData[]
  
  // Hourly heatmap
  hourlyData: { day: string; hours: number[] }[]
}

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily')
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('weekly')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sales' | 'country'>('overview')
  
  const [data, setData] = useState<AnalyticsState>({
    totalUsers: 0,
    totalSales: 0,
    dcsUsers: 0,
    dcsSales: 0,
    learnerOnlyUsers: 0,
    learnerOnlySales: 0,
    userTimeSeries: [],
    salesTimeSeries: [],
    userGrowthComparison: {
      current: { learnerOnly: 0, dcsAddon: 0 },
      previous: { learnerOnly: 0, dcsAddon: 0 }
    },
    salesGrowthComparison: {
      current: { learnerOnly: 0, dcsAddon: 0 },
      previous: { learnerOnly: 0, dcsAddon: 0 }
    },
    countryData: [],
    hourlyData: []
  })

  useEffect(() => {
    fetchAnalytics()
  }, [timePeriod, comparisonPeriod])

  const getDateRangeForPeriod = (period: TimePeriod) => {
    const now = new Date()
    const ranges: { [key in TimePeriod]: { start: Date; points: number; format: (d: Date) => string } } = {
      hourly: {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        points: 24,
        format: (d) => `${d.getHours()}:00`
      },
      daily: {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        points: 7,
        format: (d) => d.toLocaleDateString('en-US', { weekday: 'short' })
      },
      weekly: {
        start: new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000),
        points: 8,
        format: (d) => `Week ${Math.ceil(d.getDate() / 7)}`
      },
      monthly: {
        start: new Date(now.getFullYear(), now.getMonth() - 11, 1),
        points: 12,
        format: (d) => d.toLocaleDateString('en-US', { month: 'short' })
      },
      yearly: {
        start: new Date(now.getFullYear() - 4, 0, 1),
        points: 5,
        format: (d) => d.getFullYear().toString()
      }
    }
    return ranges[period]
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      const now = new Date()
      const periodConfig = getDateRangeForPeriod(timePeriod)
      
      // Fetch all required data in parallel
      const [
        profilesResult,
        membershipsResult,
        paymentsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at, country'),
        supabase.from('user_memberships').select('user_id, created_at, has_digital_cashflow_addon, is_active'),
        supabase.from('payments').select('*').eq('status', 'completed')
      ])

      const profiles = profilesResult.data || []
      const memberships = membershipsResult.data || []
      const payments = paymentsResult.data || []

      // Create a map of user_id to membership info
      const membershipMap = new Map<string, { hasDcs: boolean; createdAt: string }>()
      memberships.forEach((m: any) => {
        if (m.is_active) {
          membershipMap.set(m.user_id, {
            hasDcs: m.has_digital_cashflow_addon || false,
            createdAt: m.created_at
          })
        }
      })

      // Calculate totals
      const dcsUsers = memberships.filter((m: any) => m.has_digital_cashflow_addon && m.is_active).length
      const totalMemberships = memberships.filter((m: any) => m.is_active).length
      const learnerOnlyUsers = totalMemberships - dcsUsers

      // Calculate sales
      const dcsSales = dcsUsers * DCS_PRICE_USD
      const learnerOnlySales = learnerOnlyUsers * MEMBERSHIP_PRICE_USD
      const totalSales = dcsSales + learnerOnlySales + payments.reduce((sum: number, p: any) => {
        // Use base_currency_amount if available (USD), otherwise fallback to base_amount or conversion
        const usdAmount = p.base_currency_amount || p.base_amount || (p.currency === 'USD' ? p.amount : p.amount / 10)
        return sum + usdAmount
      }, 0)

      // Generate time series data
      const userTimeSeries: TimeSeriesData[] = []
      const salesTimeSeries: TimeSeriesData[] = []
      
      for (let i = 0; i < periodConfig.points; i++) {
        let pointDate: Date
        if (timePeriod === 'hourly') {
          pointDate = new Date(now.getTime() - (periodConfig.points - 1 - i) * 60 * 60 * 1000)
        } else if (timePeriod === 'daily') {
          pointDate = new Date(now.getTime() - (periodConfig.points - 1 - i) * 24 * 60 * 60 * 1000)
        } else if (timePeriod === 'weekly') {
          pointDate = new Date(now.getTime() - (periodConfig.points - 1 - i) * 7 * 24 * 60 * 60 * 1000)
        } else if (timePeriod === 'monthly') {
          pointDate = new Date(now.getFullYear(), now.getMonth() - (periodConfig.points - 1 - i), 1)
        } else {
          pointDate = new Date(now.getFullYear() - (periodConfig.points - 1 - i), 0, 1)
        }

        // Count users and sales for this period
        const periodUsers = memberships.filter((m: any) => {
          const mDate = new Date(m.created_at)
          return isInPeriod(mDate, pointDate, timePeriod) && m.is_active
        })
        
        const dcsInPeriod = periodUsers.filter((m: any) => m.has_digital_cashflow_addon).length
        const learnerInPeriod = periodUsers.length - dcsInPeriod

        userTimeSeries.push({
          label: periodConfig.format(pointDate),
          learnerOnly: learnerInPeriod,
          dcsAddon: dcsInPeriod,
          total: periodUsers.length
        })

        salesTimeSeries.push({
          label: periodConfig.format(pointDate),
          learnerOnly: learnerInPeriod * MEMBERSHIP_PRICE_USD,
          dcsAddon: dcsInPeriod * (MEMBERSHIP_PRICE_USD + DCS_PRICE_USD),
          total: learnerInPeriod * MEMBERSHIP_PRICE_USD + dcsInPeriod * (MEMBERSHIP_PRICE_USD + DCS_PRICE_USD)
        })
      }

      // Calculate growth comparison
      const compPeriodDays = comparisonPeriod === 'weekly' ? 7 : comparisonPeriod === 'monthly' ? 30 : 365
      const currentPeriodStart = new Date(now.getTime() - compPeriodDays * 24 * 60 * 60 * 1000)
      const previousPeriodStart = new Date(now.getTime() - 2 * compPeriodDays * 24 * 60 * 60 * 1000)

      const currentPeriodMemberships = memberships.filter((m: any) => {
        const mDate = new Date(m.created_at)
        return mDate >= currentPeriodStart && m.is_active
      })
      const previousPeriodMemberships = memberships.filter((m: any) => {
        const mDate = new Date(m.created_at)
        return mDate >= previousPeriodStart && mDate < currentPeriodStart && m.is_active
      })

      const userGrowthComparison = {
        current: {
          learnerOnly: currentPeriodMemberships.filter((m: any) => !m.has_digital_cashflow_addon).length,
          dcsAddon: currentPeriodMemberships.filter((m: any) => m.has_digital_cashflow_addon).length
        },
        previous: {
          learnerOnly: previousPeriodMemberships.filter((m: any) => !m.has_digital_cashflow_addon).length,
          dcsAddon: previousPeriodMemberships.filter((m: any) => m.has_digital_cashflow_addon).length
        }
      }

      const salesGrowthComparison = {
        current: {
          learnerOnly: userGrowthComparison.current.learnerOnly * MEMBERSHIP_PRICE_USD,
          dcsAddon: userGrowthComparison.current.dcsAddon * (MEMBERSHIP_PRICE_USD + DCS_PRICE_USD)
        },
        previous: {
          learnerOnly: userGrowthComparison.previous.learnerOnly * MEMBERSHIP_PRICE_USD,
          dcsAddon: userGrowthComparison.previous.dcsAddon * (MEMBERSHIP_PRICE_USD + DCS_PRICE_USD)
        }
      }

      // Country data
      const countryMap = new Map<string, CountryData>()
      profiles.forEach((p: any) => {
        const country = p.country || 'Unknown'
        const membership = membershipMap.get(p.id)
        
        if (!countryMap.has(country)) {
          countryMap.set(country, {
            country,
            countryCode: getCountryCode(country),
            users: 0,
            sales: 0,
            learnerOnly: 0,
            dcsAddon: 0
          })
        }
        
        const countryStats = countryMap.get(country)!
        countryStats.users++
        
        if (membership) {
          if (membership.hasDcs) {
            countryStats.dcsAddon++
            countryStats.sales += MEMBERSHIP_PRICE_USD + DCS_PRICE_USD
          } else {
            countryStats.learnerOnly++
            countryStats.sales += MEMBERSHIP_PRICE_USD
          }
        }
      })

      const countryData = Array.from(countryMap.values())
        .sort((a, b) => b.users - a.users)
        .slice(0, 10)

      // Hourly heatmap data
      const hourlyData = generateHourlyHeatmap(memberships)

      setData({
        totalUsers: profiles.length,
        totalSales,
        dcsUsers,
        dcsSales,
        learnerOnlyUsers,
        learnerOnlySales,
        userTimeSeries,
        salesTimeSeries,
        userGrowthComparison,
        salesGrowthComparison,
        countryData,
        hourlyData
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const isInPeriod = (date: Date, periodStart: Date, period: TimePeriod): boolean => {
    if (period === 'hourly') {
      return date.getHours() === periodStart.getHours() && 
             date.toDateString() === periodStart.toDateString()
    } else if (period === 'daily') {
      return date.toDateString() === periodStart.toDateString()
    } else if (period === 'weekly') {
      const weekStart = new Date(periodStart)
      const weekEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      return date >= weekStart && date < weekEnd
    } else if (period === 'monthly') {
      return date.getMonth() === periodStart.getMonth() && 
             date.getFullYear() === periodStart.getFullYear()
    } else {
      return date.getFullYear() === periodStart.getFullYear()
    }
  }

  const getCountryCode = (country: string): string => {
    const codes: { [key: string]: string } = {
      'Ghana': 'GH',
      'Nigeria': 'NG',
      'United States': 'US',
      'USA': 'US',
      'Kenya': 'KE',
      'South Africa': 'ZA',
      'United Kingdom': 'GB',
      'UK': 'GB',
      'Unknown': '??'
    }
    return codes[country] || '??'
  }

  const generateHourlyHeatmap = (memberships: any[]): { day: string; hours: number[] }[] => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    const heatmap = days.map(day => ({
      day,
      hours: Array(24).fill(0)
    }))

    memberships.forEach((m: any) => {
      const date = new Date(m.created_at)
      const dayIndex = (date.getDay() + 6) % 7 // Monday = 0
      const hour = date.getHours()
      if (heatmap[dayIndex]) {
        heatmap[dayIndex].hours[hour]++
      }
    })

    return heatmap
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getGrowthPercent = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Chart Components
  const AreaChart = ({ data, height = 200, showLegend = true }: { 
    data: TimeSeriesData[], 
    height?: number,
    showLegend?: boolean 
  }) => {
    if (data.length === 0) return <div className="text-center text-gray-400 py-8">No data available</div>
    
    const maxValue = Math.max(...data.map(d => d.total), 1)
    const padding = 40
    const chartWidth = 100
    const chartHeight = 100

    const getY = (value: number) => chartHeight - (value / maxValue) * (chartHeight - padding)
    const getX = (index: number) => (index / (data.length - 1 || 1)) * chartWidth

    // Create paths for stacked area
    const learnerPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.learnerOnly)}`).join(' ')
    const dcsPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.total)}`).join(' ')
    
    const learnerArea = `${learnerPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`
    const dcsArea = `${dcsPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

    return (
      <div>
        <div className="relative" style={{ height }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="learnerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="dcsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
              </linearGradient>
              <pattern id="stripes" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="4" stroke="#f97316" strokeWidth="2" strokeOpacity="0.3" />
              </pattern>
            </defs>
            
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
            ))}
            
            {/* DCS Area (behind) */}
            <path d={dcsArea} fill="url(#dcsGradient)" />
            <path d={dcsPath} fill="none" stroke="#8b5cf6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            
            {/* Learner Area (front with stripes) */}
            <path d={learnerArea} fill="url(#stripes)" />
            <path d={learnerPath} fill="none" stroke="#f97316" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            
            {/* Data points */}
            {data.map((d, i) => (
              <g key={i}>
                <circle cx={getX(i)} cy={getY(d.total)} r="3" fill="#8b5cf6" />
                <circle cx={getX(i)} cy={getY(d.learnerOnly)} r="3" fill="#f97316" />
              </g>
            ))}
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
            {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>
        
        {showLegend && (
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-orange-500 rounded opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)' }} />
              <span className="text-sm text-gray-600">Learner Only</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-purple-500 rounded opacity-60" />
              <span className="text-sm text-gray-600">DCS Addon</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  const DonutChart = ({ value, total, label, color }: { value: number, total: number, label: string, color: string }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0
    const circumference = 2 * Math.PI * 40
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
            <circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke={color} 
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{percentage.toFixed(1)}%</span>
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        </div>
      </div>
    )
  }

  const HourlyHeatmap = ({ data }: { data: { day: string; hours: number[] }[] }) => {
    const maxValue = Math.max(...data.flatMap(d => d.hours), 1)
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {data.map((row, dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-1 mb-1">
              <span className="w-10 text-xs text-gray-500">{row.day}</span>
              <div className="flex gap-0.5 flex-1">
                {row.hours.map((value, hourIndex) => {
                  const intensity = value / maxValue
                  const bgColor = value === 0 
                    ? 'bg-gray-100' 
                    : intensity > 0.7 
                      ? 'bg-orange-500' 
                      : intensity > 0.4 
                        ? 'bg-orange-400' 
                        : intensity > 0.2 
                          ? 'bg-orange-300' 
                          : 'bg-orange-200'
                  return (
                    <div 
                      key={hourIndex}
                      className={`w-full h-6 rounded-sm ${bgColor} cursor-pointer transition-transform hover:scale-110`}
                      title={`${row.day} ${hourIndex}:00 - ${value} signups`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1 mt-2">
            <span className="w-10"></span>
            <div className="flex justify-between flex-1 text-xs text-gray-400">
              {[0, 6, 12, 18, 23].map(h => (
                <span key={h}>{h}:00</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ComparisonBar = ({ 
    label, 
    current, 
    previous, 
    color 
  }: { 
    label: string
    current: number
    previous: number
    color: string 
  }) => {
    const growth = getGrowthPercent(current, previous)
    const maxVal = Math.max(current, previous, 1)
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className={`flex items-center text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(growth).toFixed(1)}%</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Current</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${color}`}
                style={{ width: `${(current / maxVal) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-16 text-right">{formatNumber(current)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-16">Previous</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gray-300"
                style={{ width: `${(previous / maxVal) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium w-16 text-right">{formatNumber(previous)}</span>
          </div>
        </div>
      </div>
    )
  }

  const totalUserGrowth = getGrowthPercent(
    data.userGrowthComparison.current.learnerOnly + data.userGrowthComparison.current.dcsAddon,
    data.userGrowthComparison.previous.learnerOnly + data.userGrowthComparison.previous.dcsAddon
  )
  
  const totalSalesGrowth = getGrowthPercent(
    data.salesGrowthComparison.current.learnerOnly + data.salesGrowthComparison.current.dcsAddon,
    data.salesGrowthComparison.previous.learnerOnly + data.salesGrowthComparison.previous.dcsAddon
  )

  return (
    <AdminDashboardLayout 
      title="Analytics"
      headerAction={
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Overview Card */}
            <Card className="md:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">Product overview</span>
                  <select 
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalSales)}</p>
                <p className="text-sm text-gray-500">Total sales</p>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Select by product</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      Learner Only
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      DCS Addon
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-gray-500">New sales:</span>
                  <span className="font-medium">{data.userGrowthComparison.current.learnerOnly + data.userGrowthComparison.current.dcsAddon}</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Sales Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Memberships</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.learnerOnlySales + data.dcsSales)}</p>
                    <div className={`flex items-center text-sm mt-1 ${totalSalesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      vs last {comparisonPeriod}
                      {totalSalesGrowth >= 0 ? <ArrowUpRight className="w-4 h-4 ml-1" /> : <ArrowDownRight className="w-4 h-4 ml-1" />}
                      {Math.abs(totalSalesGrowth).toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[40, 60, 45, 70, 55].map((h, i) => (
                      <div key={i} className="w-3 bg-orange-400 rounded-t" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                </div>
                <button className="mt-4 text-sm text-gray-600 flex items-center gap-1 hover:text-orange-600">
                  See Details <ArrowUpRight className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>

            {/* DCS Revenue Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">DCS Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.dcsSales)}</p>
                    <div className={`flex items-center text-sm mt-1 ${getGrowthPercent(data.salesGrowthComparison.current.dcsAddon, data.salesGrowthComparison.previous.dcsAddon) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      vs last {comparisonPeriod}
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                      {Math.abs(getGrowthPercent(data.salesGrowthComparison.current.dcsAddon, data.salesGrowthComparison.previous.dcsAddon)).toFixed(1)}%
                    </div>
                  </div>
                  <DonutChart 
                    value={data.dcsSales} 
                    total={data.totalSales} 
                    label="of total"
                    color="#8b5cf6"
                  />
                </div>
                <button className="mt-4 text-sm text-gray-600 flex items-center gap-1 hover:text-orange-600">
                  See Details <ArrowUpRight className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Analytics</CardTitle>
                <div className="flex items-center gap-2">
                  <select 
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                    className="text-sm border rounded px-3 py-1.5"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <span className="text-2xl font-bold">{formatCurrency(data.totalSales)}</span>
                    <span className="text-sm text-gray-500 ml-2">sales</span>
                    <span className={`text-sm ml-2 ${totalSalesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalSalesGrowth >= 0 ? '+' : ''}{totalSalesGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-900">
                      {((data.dcsUsers / (data.totalUsers || 1)) * 100).toFixed(2)}%
                    </span>
                    {' '}Conv.rate
                    <span className="text-green-600 ml-1">↑13%</span>
                  </div>
                </div>
                <AreaChart data={data.salesTimeSeries} height={250} />
              </CardContent>
            </Card>

            {/* Sales Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <DonutChart 
                    value={data.userGrowthComparison.current.learnerOnly + data.userGrowthComparison.current.dcsAddon}
                    total={data.userGrowthComparison.previous.learnerOnly + data.userGrowthComparison.previous.dcsAddon + data.userGrowthComparison.current.learnerOnly + data.userGrowthComparison.current.dcsAddon}
                    label="Since last period"
                    color="#f97316"
                  />
                  
                  <div className="w-full mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded" />
                        <span className="text-sm text-gray-600">Total Sales per day</span>
                      </div>
                      <span className="text-sm text-gray-500">For week</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-200 rounded" />
                        <span className="text-sm text-gray-600">Average Sales</span>
                      </div>
                      <span className="text-sm text-gray-500">For today</span>
                    </div>
                  </div>
                  
                  <button className="mt-6 text-sm text-gray-600 flex items-center gap-1 hover:text-orange-600">
                    See Details <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Heatmap & Growth Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Heatmap */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <CardTitle className="text-lg font-semibold">Total visits by hourly</CardTitle>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{formatNumber(data.totalUsers)}</span>
                  <span className={`text-sm ml-2 ${totalUserGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalUserGrowth >= 0 ? '+' : ''}{totalUserGrowth.toFixed(1)}%
                  </span>
                </div>
                <HourlyHeatmap data={data.hourlyData} />
              </CardContent>
            </Card>

            {/* User Growth Comparison */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">User Growth Comparison</CardTitle>
                <select 
                  value={comparisonPeriod}
                  onChange={(e) => setComparisonPeriod(e.target.value as ComparisonPeriod)}
                  className="text-sm border rounded px-3 py-1.5"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </CardHeader>
              <CardContent className="space-y-6">
                <ComparisonBar 
                  label="Learner Only"
                  current={data.userGrowthComparison.current.learnerOnly}
                  previous={data.userGrowthComparison.previous.learnerOnly}
                  color="bg-orange-500"
                />
                <ComparisonBar 
                  label="DCS Addon"
                  current={data.userGrowthComparison.current.dcsAddon}
                  previous={data.userGrowthComparison.previous.dcsAddon}
                  color="bg-purple-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sales Growth & Country Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Growth Comparison */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Sales Growth Comparison</CardTitle>
                <select 
                  value={comparisonPeriod}
                  onChange={(e) => setComparisonPeriod(e.target.value as ComparisonPeriod)}
                  className="text-sm border rounded px-3 py-1.5"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </CardHeader>
              <CardContent className="space-y-6">
                <ComparisonBar 
                  label="Learner Only"
                  current={data.salesGrowthComparison.current.learnerOnly}
                  previous={data.salesGrowthComparison.previous.learnerOnly}
                  color="bg-orange-500"
                />
                <ComparisonBar 
                  label="DCS Addon"
                  current={data.salesGrowthComparison.current.dcsAddon}
                  previous={data.salesGrowthComparison.previous.dcsAddon}
                  color="bg-purple-500"
                />
              </CardContent>
            </Card>

            {/* Country Breakdown */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-400" />
                  Users & Sales by Country
                </CardTitle>
                <button className="text-sm text-orange-600 flex items-center gap-1">
                  See Details <ArrowUpRight className="w-4 h-4" />
                </button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-2 font-medium">Country</th>
                        <th className="pb-2 font-medium text-right">Users</th>
                        <th className="pb-2 font-medium text-right">Sales</th>
                        <th className="pb-2 font-medium text-right">Learner</th>
                        <th className="pb-2 font-medium text-right">DCS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.countryData.slice(0, 5).map((country, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCountryFlag(country.countryCode)}</span>
                              <span className="font-medium">{country.country}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">{country.users}</td>
                          <td className="py-3 text-right font-medium">{formatCurrency(country.sales)}</td>
                          <td className="py-3 text-right text-orange-600">{country.learnerOnly}</td>
                          <td className="py-3 text-right text-purple-600">{country.dcsAddon}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Time Series */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">User Signups Over Time</CardTitle>
              <select 
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                className="text-sm border rounded px-3 py-1.5"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </CardHeader>
            <CardContent>
              <AreaChart data={data.userTimeSeries} height={200} />
            </CardContent>
          </Card>
        </div>
      )}
    </AdminDashboardLayout>
  )
}

// Helper function to get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  if (countryCode === '??' || !countryCode) return '🌍'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export default AnalyticsPage
