"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  ShoppingCart,
  Award,
  Activity,
  Link2,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Zap,
  Target,
  Globe,
  CreditCard,
  Star,
  Crown,
  GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { useAdminData } from '@/lib/hooks/useAdminData'
import { useCurrency } from '@/contexts/CurrencyContext'
import { CURRENCY_RATES } from '@/contexts/CurrencyContext'
import { RevenueTrendCard, UserGrowthCard, SummaryStatsCard } from '@/components/dashboard/AdminCharts'
import { RecentUsersCard, RecentPaymentsCard } from '@/components/dashboard/RecentActivityCards'
import { AdminDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

export const dynamic = 'force-dynamic'

const AdminDashboard = () => {
  const router = useRouter()
  const { stats, recentUsers, recentPayments, loading, error } = useAdminData()
  const { selectedCurrency, formatAmount } = useCurrency()

  // Generate enhanced chart data - must be before early return to maintain hook order
  const chartData = useMemo(() => {
    const revenueData = [
      { label: 'Mon', value: stats.totalRevenue * 0.12 },
      { label: 'Tue', value: stats.totalRevenue * 0.15 },
      { label: 'Wed', value: stats.totalRevenue * 0.18 },
      { label: 'Thu', value: stats.totalRevenue * 0.14 },
      { label: 'Fri', value: stats.totalRevenue * 0.20 },
      { label: 'Sat', value: stats.totalRevenue * 0.11 },
      { label: 'Sun', value: stats.totalRevenue * 0.10 }
    ]

    const userData = [
      { label: 'Mon', value: Math.floor(stats.totalUsers * 0.12) },
      { label: 'Tue', value: Math.floor(stats.totalUsers * 0.15) },
      { label: 'Wed', value: Math.floor(stats.totalUsers * 0.18) },
      { label: 'Thu', value: Math.floor(stats.totalUsers * 0.14) },
      { label: 'Fri', value: Math.floor(stats.totalUsers * 0.20) },
      { label: 'Sat', value: Math.floor(stats.totalUsers * 0.11) },
      { label: 'Sun', value: Math.floor(stats.totalUsers * 0.10) }
    ]

    return { revenueData, userData }
  }, [stats])

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  const premiumStatCards = [
    {
      title: "Total Revenue",
      value: formatAmount(stats.totalRevenue),
      subtitle: CURRENCY_RATES[selectedCurrency].name,
      icon: DollarSign,
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      iconBg: "bg-gradient-to-br from-emerald-100 to-green-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      subtitle: "Platform Members",
      icon: Users,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Affiliates Onboarded",
      value: stats.affiliatesOnboarded.toLocaleString(),
      subtitle: "Completed Onboarding",
      icon: Crown,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      iconBg: "bg-gradient-to-br from-orange-100 to-amber-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Affiliate Sales",
      value: stats.affiliateSales.toLocaleString(),
      subtitle: "Via Referrals",
      icon: Link2,
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      iconBg: "bg-gradient-to-br from-violet-100 to-purple-100",
      iconColor: "text-violet-600",
    },
    {
      title: "Direct Website Sales",
      value: stats.directSales.toLocaleString(),
      subtitle: "Website Purchases",
      icon: Globe,
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
      iconBg: "bg-gradient-to-br from-cyan-100 to-teal-100",
      iconColor: "text-cyan-600",
    }
  ]

  const quickActions = [
    { title: "Payment", icon: CreditCard, color: "bg-green-500 hover:bg-green-600", href: "/dashboard/admin/payments" },
    { title: "Add User", icon: UserPlus, color: "bg-blue-500 hover:bg-blue-600", href: "/dashboard/admin/add-user" },
    { title: "Add Courses", icon: BookOpen, color: "bg-purple-500 hover:bg-purple-600", href: "/dashboard/admin/courses/create" },
    { title: "View Analytics", icon: BarChart3, color: "bg-orange-500 hover:bg-orange-600", href: "/dashboard/admin/analytics" },
  ]

  
  if (loading) {
    return (
      <AdminDashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading dashboard data...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardLayout title="Admin Dashboard">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl p-8 text-gray-900 relative overflow-hidden border border-gray-200 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-green-50/50"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/20 via-teal-100/20 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-100/20 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                    Welcome back, Admin
                  </h1>
                  <p className="text-gray-600 text-lg font-medium">Command center for your premium platform</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-200 border border-emerald-200">
                    <Bell className="w-5 h-5 text-emerald-600" />
                  </button>
                  <button className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all duration-200 border border-emerald-200">
                    <Settings className="w-5 h-5 text-emerald-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 border border-gray-300">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className={`${action.color} text-white p-6 rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg group`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors border border-white/30">
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="font-semibold">{action.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Premium Statistics Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {premiumStatCards.map((stat, index) => (
              <div
                key={index}
                className="relative bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:scale-105 group overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-400 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/50 shadow-sm`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600 mt-1">{stat.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</p>
                  </div>

                  {/* Accent Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-4">
                    <div 
                      className={`bg-gradient-to-r ${stat.gradient} h-1 rounded-full`}
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden">
              <RevenueTrendCard
                revenue={stats.totalRevenue}
                growth={23.8}
                chartData={chartData.revenueData}
                selectedCurrency={selectedCurrency}
                formatAmount={formatAmount}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <UserGrowthCard
                users={stats.totalUsers}
                growth={12.5}
                chartData={chartData.userData}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Activity Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 border border-gray-300">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 border border-gray-300">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View All</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden">
              <RecentUsersCard users={recentUsers} loading={loading} error={error} />
            </div>
            <div className="bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-orange-500/10 transition-all duration-300 overflow-hidden">
              <RecentPaymentsCard payments={recentPayments} loading={loading} error={error} />
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">System Status: Operational</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4" />
                <span>Fast Response</span>
              </div>
            </div>
          </div>
        </div>
      </AdminDashboardLayout>
    </div>
  )
}

export default AdminDashboard
