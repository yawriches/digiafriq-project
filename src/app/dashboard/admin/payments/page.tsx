"use client"
import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Search, 
  Download,
  Eye,
  Loader2,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  X,
  User,
  Calendar,
  Globe,
  Building,
  ShoppingCart,
  Users,
  Award,
  Link2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Payment {
  id: string
  user_id: string
  course_id: string | null
  affiliate_id: string | null
  amount: number
  currency: string
  base_amount: number | null
  base_currency: string | null
  paid_amount: number | null
  paid_currency: string | null
  exchange_rate: number | null
  paystack_reference: string | null
  provider_reference: string | null
  paystack_transaction_id: string | null
  status: string
  payment_method: string | null
  provider: string | null
  country_code: string | null
  payment_type: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  metadata: any
  // Joined data
  user?: {
    id: string
    full_name: string | null
    email: string | null
  }
  course?: {
    id: string
    title: string
  }
}

interface RevenueByType {
  membership: number
  referral: number
  direct: number
}

interface RevenueByCurrency {
  [key: string]: number
}

const PaymentsManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [searchTerm, statusFilter, typeFilter, providerFilter, dateRange, payments])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Fetch payments first
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) throw paymentsError

      // Fetch user details for each payment
      const paymentsWithUsers = await Promise.all(
        (paymentsData || []).map(async (payment: any) => {
          let user = null
          let course = null

          // Fetch user if user_id exists
          if (payment.user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .eq('id', payment.user_id)
              .single()
            user = userData
          }

          // Fetch course if course_id exists
          if (payment.course_id) {
            const { data: courseData } = await supabase
              .from('courses')
              .select('id, title')
              .eq('id', payment.course_id)
              .single()
            course = courseData
          }

          return { ...payment, user, course }
        })
      )

      setPayments(paymentsWithUsers)
    } catch (error: any) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = payments

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(payment => 
        (payment.provider_reference || payment.paystack_reference)?.toLowerCase().includes(search) ||
        payment.user?.full_name?.toLowerCase().includes(search) ||
        payment.user?.email?.toLowerCase().includes(search) ||
        payment.course?.title?.toLowerCase().includes(search)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.payment_type === typeFilter)
    }

    if (providerFilter !== 'all') {
      filtered = filtered.filter(payment => payment.provider === providerFilter)
    }

    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.created_at)
        const startDate = new Date(dateRange.startDate!)
        const endDate = new Date(dateRange.endDate!)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        return paymentDate >= startDate && paymentDate <= endDate
      })
    }

    setFilteredPayments(filtered)
  }

  const handleExport = () => {
    const csvContent = [
      ['Reference', 'User', 'Email', 'Amount', 'Currency', 'Base Amount (USD)', 'Base Currency Amount (USD)', 'Type', 'Provider', 'Status', 'Date'].join(','),
      ...filteredPayments.map(p => [
        p.provider_reference || p.paystack_reference || 'N/A',
        p.user?.full_name || 'N/A',
        p.user?.email || 'N/A',
        p.amount,
        p.currency,
        p.base_amount || 'N/A',
        (p as any).base_currency_amount || 'N/A',
        p.payment_type || 'N/A',
        p.provider || 'N/A',
        p.status,
        new Date(p.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Payments exported successfully')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'course': return <ShoppingCart className="w-4 h-4 text-blue-600" />
      case 'membership': return <Users className="w-4 h-4 text-purple-600" />
      default: return <CreditCard className="w-4 h-4 text-gray-600" />
    }
  }

  const getTypeBadgeColor = (type: string | null) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-700'
      case 'membership': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'GHS': '₵',
      'NGN': '₦'
    }
    return `${symbols[currency] || currency}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Helper function to convert amount to USD
  const toUSD = (amount: number, currency: string | null): number => {
    if (!currency || currency === 'USD') return amount
    // Approximate exchange rates (should match your database rates)
    const rates: { [key: string]: number } = {
      'GHS': 10,    // 1 USD = 10 GHS
      'NGN': 1400,  // 1 USD = 1400 NGN
    }
    const rate = rates[currency] || 1
    return amount / rate
  }

  // Calculate stats - Use base_amount if available, otherwise convert from local currency
  const completedPayments = payments.filter(p => p.status === 'completed')
  const paymentsRevenueUSD = completedPayments.reduce((sum, p) => {
    const usdAmount = (p as any).base_currency_amount || p.base_amount || toUSD(p.amount, p.currency)
    return sum + usdAmount
  }, 0)
  
  // Total revenue from payments
  const totalRevenueUSD = paymentsRevenueUSD
  
  const pendingPayments = payments.filter(p => p.status === 'pending')
  const pendingAmountUSD = pendingPayments.reduce((sum, p) => {
    const usdAmount = (p as any).base_currency_amount || p.base_amount || toUSD(p.amount, p.currency)
    return sum + usdAmount
  }, 0)
  
  const failedPayments = payments.filter(p => p.status === 'failed')

  // Revenue by type - Use base_currency_amount if available, then base_amount, otherwise convert
  const getAmountUSD = (p: Payment) => (p as any).base_currency_amount || p.base_amount || toUSD(p.amount, p.currency)
  
  const membershipTypes = ['membership', 'referral_membership', 'addon_upgrade']
  const referralPayments = completedPayments.filter(p => p.payment_type === 'referral_membership' || (p.metadata?.is_referral_signup === true || p.metadata?.referral_code))
  const directPayments = completedPayments.filter(p => !referralPayments.includes(p))
  const revenueByType: RevenueByType = {
    membership: completedPayments.filter(p => membershipTypes.includes(p.payment_type || '')).reduce((sum, p) => sum + getAmountUSD(p), 0),
    referral: referralPayments.reduce((sum, p) => sum + getAmountUSD(p), 0),
    direct: directPayments.reduce((sum, p) => sum + getAmountUSD(p), 0),
  }

  // Revenue by currency
  const revenueByCurrency: RevenueByCurrency = completedPayments.reduce((acc, p) => {
    const currency = p.currency || 'USD'
    acc[currency] = (acc[currency] || 0) + p.amount
    return acc
  }, {} as RevenueByCurrency)

  return (
    <AdminDashboardLayout 
      title="Payments Management"
      headerAction={
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range"
            className="min-w-[240px]"
          />
          <Button 
            variant="outline"
            onClick={fetchPayments}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue (USD)</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenueUSD, 'USD')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedPayments.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</p>
                <p className="text-xs text-gray-500">{formatCurrency(pendingAmountUSD, 'USD')}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedPayments.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards - Row 2: Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Referral Payments</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(revenueByType.referral, 'USD')}</p>
                <p className="text-xs text-gray-500">{referralPayments.length} payment{referralPayments.length !== 1 ? 's' : ''}</p>
              </div>
              <Link2 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Direct Website Payments</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(revenueByType.direct, 'USD')}</p>
                <p className="text-xs text-gray-500">{directPayments.length} payment{directPayments.length !== 1 ? 's' : ''}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Currency */}
      {Object.keys(revenueByCurrency).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Revenue by Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(revenueByCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold">{formatCurrency(amount, currency)}</span>
                  <span className="text-sm text-gray-500">({currency})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by reference, user name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="course">Course</option>
              <option value="membership">Membership</option>
            </select>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Providers</option>
              <option value="paystack">Paystack</option>
              <option value="kora">Kora</option>
            </select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Payments ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              <span className="ml-3 text-gray-600">Loading payments...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No payments found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Provider</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-900">
                          {(payment.provider_reference || payment.paystack_reference)?.slice(0, 12) || 'N/A'}...
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {payment.user?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{payment.user?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          {payment.base_amount && payment.currency !== 'USD' && (
                            <p className="text-xs text-gray-500">
                              ≈ {formatCurrency(payment.base_amount, 'USD')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(payment.payment_type)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadgeColor(payment.payment_type)}`}>
                            {payment.payment_type || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600 capitalize">{payment.provider || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payment.status)}
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(payment.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedPayment.status)}
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadgeColor(selectedPayment.status)}`}>
                    {selectedPayment.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedPayment.payment_type)}
                  <span className={`px-3 py-1 text-sm rounded-full ${getTypeBadgeColor(selectedPayment.payment_type)}`}>
                    {selectedPayment.payment_type || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Amount Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </p>
                {selectedPayment.base_amount && selectedPayment.currency !== 'USD' && (
                  <p className="text-sm text-gray-500 mt-1">
                    ≈ {formatCurrency(selectedPayment.base_amount, 'USD')} (Exchange rate: {selectedPayment.exchange_rate})
                  </p>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="w-4 h-4" /> User
                  </p>
                  <p className="font-medium">{selectedPayment.user?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Date
                  </p>
                  <p className="font-medium">{new Date(selectedPayment.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">{new Date(selectedPayment.created_at).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Building className="w-4 h-4" /> Provider
                  </p>
                  <p className="font-medium capitalize">{selectedPayment.provider || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Globe className="w-4 h-4" /> Country
                  </p>
                  <p className="font-medium">{selectedPayment.country_code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{selectedPayment.payment_method || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-mono text-sm break-all">{selectedPayment.provider_reference || selectedPayment.paystack_reference || 'N/A'}</p>
                </div>
              </div>

              {/* Course/Product Info */}
              {selectedPayment.course && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Course Purchased</p>
                  <p className="font-medium">{selectedPayment.course.title}</p>
                </div>
              )}

              {/* Transaction ID */}
              {selectedPayment.paystack_transaction_id && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                    {selectedPayment.paystack_transaction_id}
                  </p>
                </div>
              )}

              {/* Paid At */}
              {selectedPayment.paid_at && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-1">Payment Confirmed</p>
                  <p className="font-medium">
                    {new Date(selectedPayment.paid_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setSelectedPayment(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  )
}

export default PaymentsManagement
