"use client"
import React from 'react'
import { 
  Users, 
  DollarSign, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  UserPlus,
  CreditCard,
  ArrowUpRight,
  MoreHorizontal,
  Crown,
  GraduationCap
} from 'lucide-react'

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

interface RecentUsersCardProps {
  users: User[]
  loading: boolean
  error: string | null
}

const RecentUsersCard: React.FC<RecentUsersCardProps> = ({ users, loading, error }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'affiliate': return <Crown className="w-4 h-4" />
      case 'learner': return <GraduationCap className="w-4 h-4" />
      case 'admin': return <Users className="w-4 h-4" />
      default: return <UserPlus className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'affiliate': return 'bg-orange-100 text-orange-700 border border-orange-200'
      case 'learner': return 'bg-orange-100 text-orange-700 border border-orange-200'
      case 'admin': return 'bg-orange-100 text-orange-700 border border-orange-200'
      default: return 'bg-orange-100 text-orange-700 border border-orange-200'
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const names = name.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    return email[0].toUpperCase()
  }

  const getAvatarColor = (name: string | null, email: string) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-orange-400 to-orange-600',
      'from-teal-400 to-teal-600'
    ]
    const index = (name?.charCodeAt(0) || email.charCodeAt(0)) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Users</h3>
              <p className="text-sm text-gray-600">Latest member registrations</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Live</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-12 text-red-600">
          <div className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Error loading users</p>
          </div>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Users</h3>
              <p className="text-sm text-gray-600">Latest member registrations</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Live</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-gray-500">
          <div className="text-center">
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No recent users</p>
            <p className="text-sm text-gray-400 mt-1">New users will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Users</h3>
            <p className="text-sm text-gray-600">Latest member registrations</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
          <TrendingUp className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((user, index) => (
          <div 
            key={user.id} 
            className="group bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-white text-lg font-bold">
                    {getInitials(user.full_name, user.email)}
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {user.full_name || 'Unknown User'}
                    </p>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[180px]">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-600 hover:text-orange-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors">
          <span>View all users</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface RecentPaymentsCardProps {
  payments: Payment[]
  loading: boolean
  error: string | null
}

const RecentPaymentsCard: React.FC<RecentPaymentsCardProps> = ({ payments, loading, error }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-700 border border-red-200'
      default: return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  const formatAmount = (payment: Payment) => {
    const usdAmount = payment.base_currency_amount || (payment.currency === 'USD' ? payment.amount : payment.amount / 10)
    return `$${usdAmount.toFixed(2)} USD`
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Payments</h3>
              <p className="text-sm text-gray-600">Latest transaction activity</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
            <CreditCard className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Live</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-12 text-red-600">
          <div className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Error loading payments</p>
          </div>
        </div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Payments</h3>
              <p className="text-sm text-gray-600">Latest transaction activity</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
            <CreditCard className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Live</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-gray-500">
          <div className="text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No recent payments</p>
            <p className="text-sm text-gray-400 mt-1">Payment transactions will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Payments</h3>
            <p className="text-sm text-gray-600">Latest transaction activity</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 rounded-full">
          <CreditCard className="w-4 h-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => (
          <div 
            key={payment.id} 
            className="group bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center group-hover:bg-orange-300 transition-colors">
                  <CreditCard className="w-6 h-6 text-orange-700" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                    payment.status === 'completed' ? 'bg-green-500' :
                    payment.status === 'pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}>
                    {getStatusIcon(payment.status)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {payment.user?.email || payment.reference || `Transaction ${payment.id.slice(0, 8)}`}
                    </p>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="capitalize">{payment.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="font-medium text-gray-900">{formatAmount(payment)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors">
          <span>View all payments</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export { RecentUsersCard, RecentPaymentsCard }
