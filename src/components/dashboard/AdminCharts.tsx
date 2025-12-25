"use client"
import React from 'react'
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react'

interface ChartDataPoint {
  label: string
  value: number
  date?: string
}

interface AdminChartProps {
  data: ChartDataPoint[]
  title: string
  type: 'revenue' | 'users'
  color?: string
  height?: number
}

const AdminChart: React.FC<AdminChartProps> = ({ 
  data, 
  title, 
  type, 
  color = type === 'revenue' ? '#10b981' : '#3b82f6',
  height = 250 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          {type === 'revenue' ? <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" /> : <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />}
          <p>No data available</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const padding = 40
  const chartWidth = 100
  const chartHeight = 100

  const getY = (value: number) => chartHeight - (value / maxValue) * (chartHeight - padding)
  const getX = (index: number) => (index / (data.length - 1 || 1)) * chartWidth

  // Create gradient fill
  const gradientId = `gradient-${type}-${Math.random()}`
  const areaPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ')
  const fillArea = `${areaPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

  return (
    <div className="w-full">
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          
          {/* Area fill */}
          <path d={fillArea} fill={`url(#${gradientId})`} />
          
          {/* Line */}
          <path d={areaPath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          
          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.value)} r="3" fill={color} />
              <circle cx={getX(i)} cy={getY(d.value)} r="5" fill={color} fillOpacity="0.2" />
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
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded" style={{ backgroundColor: color }} />
          <span className="text-sm text-gray-600">{title}</span>
        </div>
      </div>
    </div>
  )
}

// Revenue trend card component
export const RevenueTrendCard: React.FC<{ 
  revenue: number; 
  growth: number; 
  chartData: ChartDataPoint[];
  selectedCurrency?: string;
  formatAmount?: (amount: number) => string;
}> = ({ 
  revenue, 
  growth, 
  chartData,
  selectedCurrency = 'USD',
  formatAmount = (amount) => `$${amount.toLocaleString()}`
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-green-50/50 to-teal-50/50"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-200">
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Analytics</h3>
              <p className="text-sm text-gray-600 font-medium">Weekly performance overview</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-sm ${
            growth >= 0 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {growth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              {formatAmount(revenue)}
            </p>
          </div>
          <p className="text-sm font-medium text-gray-600">Total platform revenue</p>
          
          {/* Progress indicator */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                 style={{ width: `${Math.min(growth * 4, 100)}%` }}>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <AdminChart 
            data={chartData} 
            title="Revenue Trend" 
            type="revenue" 
            color="#10b981" 
            height={140}
          />
        </div>
      </div>
    </div>
  )
}

// User growth card component
export const UserGrowthCard: React.FC<{ users: number; growth: number; chartData: ChartDataPoint[] }> = ({ 
  users, 
  growth, 
  chartData 
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-sm border border-blue-200">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">User Growth</h3>
              <p className="text-sm text-gray-600 font-medium">Member acquisition trends</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-sm ${
            growth >= 0 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {growth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {users.toLocaleString()}
            </p>
            <span className="text-lg font-semibold text-gray-500">Users</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Active platform members</p>
          
          {/* Progress indicator */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" 
                 style={{ width: `${Math.min(growth * 4, 100)}%` }}>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <AdminChart 
            data={chartData} 
            title="User Growth" 
            type="users" 
            color="#3b82f6" 
            height={140}
          />
        </div>
      </div>
    </div>
  )
}

// Summary stats card
export const SummaryStatsCard: React.FC<{
  title: string
  value: string | number
  change: number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
}> = ({ title, value, change, icon: Icon, color }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-orange-100`}>
          <Icon className="w-6 h-6 text-orange-600" />
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          change >= 0 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  )
}

export default AdminChart
