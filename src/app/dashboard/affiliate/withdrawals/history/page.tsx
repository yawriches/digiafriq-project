"use client"
import React, { useEffect, useState } from 'react'
import { 
  Calendar, 
  Download,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { getUserWithdrawals, Withdrawal, formatWithdrawalAmount } from '@/lib/withdrawals'

interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  processed_at?: string | null
  completed_at?: string | null
  reference?: string | null
}

const WithdrawalHistoryPage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [withdrawalsResult, payoutsResult] = await Promise.all([
          getUserWithdrawals(),
          (supabase as any)
            .from('payouts')
            .select('*')
            .eq('affiliate_id', user.id)
            .order('created_at', { ascending: false })
        ])

        if (withdrawalsResult.error) {
          setError(withdrawalsResult.error)
          setWithdrawals([])
        } else {
          setWithdrawals(withdrawalsResult.data || [])
        }

        if (!payoutsResult.error && payoutsResult.data) {
          setPayouts(payoutsResult.data as Payout[])
        } else {
          setPayouts([])
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load withdrawal history')
        setWithdrawals([])
        setPayouts([])
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [user])

  // Map withdrawal requests (from withdrawals table)
  const requestRows = withdrawals.map(w => {
    const date = new Date(w.created_at).toLocaleDateString('en-US')
    const amountText = formatWithdrawalAmount(w.amount_usd, w.currency)

    const statusLabel =
      w.status === 'PAID'
        ? 'Completed'
        : w.status === 'PROCESSING' || w.status === 'APPROVED'
        ? 'Processing'
        : w.status === 'PENDING'
        ? 'Pending'
        : w.status === 'REJECTED' || w.status === 'FAILED'
        ? 'Failed'
        : w.status

    const statusColor =
      statusLabel === 'Completed'
        ? 'text-green-600 bg-green-100'
        : statusLabel === 'Processing'
        ? 'text-yellow-600 bg-yellow-100'
        : statusLabel === 'Pending'
        ? 'text-blue-600 bg-blue-100'
        : 'text-red-600 bg-red-100'

    const processedDate =
      (w.paid_at || w.processed_at)
        ? new Date((w.paid_at || w.processed_at) as string).toLocaleDateString('en-US')
        : 'Pending'

    return {
      date,
      amount: amountText,
      method: w.payout_channel === 'bank' ? 'Bank Transfer' : 'Mobile Money',
      reference: w.reference,
      status: statusLabel,
      statusColor,
      fee: '0.00 USD',
      netAmount: amountText,
      processedDate,
    }
  })

  // Map completed payouts (from payouts table)
  const payoutRows = payouts.map(p => {
    const date = new Date(p.created_at).toLocaleDateString('en-US')
    const amountText = formatWithdrawalAmount(p.amount, p.currency || 'USD')

    const statusLabel =
      p.status === 'completed'
        ? 'Completed'
        : p.status === 'processing'
        ? 'Processing'
        : p.status === 'pending'
        ? 'Pending'
        : 'Failed'

    const statusColor =
      statusLabel === 'Completed'
        ? 'text-green-600 bg-green-100'
        : statusLabel === 'Processing'
        ? 'text-yellow-600 bg-yellow-100'
        : statusLabel === 'Pending'
        ? 'text-blue-600 bg-blue-100'
        : 'text-red-600 bg-red-100'

    const processedDate =
      (p.completed_at || p.processed_at)
        ? new Date((p.completed_at || p.processed_at) as string).toLocaleDateString('en-US')
        : statusLabel === 'Completed'
        ? date
        : 'Pending'

    return {
      date,
      amount: amountText,
      method: 'Withdrawal',
      reference: p.reference || p.id.slice(0, 10).toUpperCase(),
      status: statusLabel,
      statusColor,
      fee: '0.00 USD',
      netAmount: amountText,
      processedDate,
    }
  })

  // Combined history sorted by most recent first
  const withdrawalHistory = [...requestRows, ...payoutRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const totalItems = withdrawalHistory.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentRows = withdrawalHistory.slice(startIndex, startIndex + itemsPerPage)

  // const summaryStats = [
  //   {
  //     title: "Total Withdrawn",
  //     value: "95.00 USD",
  //     icon: CheckCircle,
  //     color: "text-green-600",
  //     bgColor: "bg-green-100"
  //   },
  //   {
  //     title: "Total Fees Paid",
  //     value: "1.08 USD", 
  //     icon: CreditCard,
  //     color: "text-blue-600",
  //     bgColor: "bg-blue-100"
  //   },
  //   {
  //     title: "Successful Withdrawals",
  //     value: "3",
  //     icon: BarChart3,
  //     color: "text-purple-600",
  //     bgColor: "bg-purple-100"
  //   },
  //   {
  //     title: "This Month",
  //     value: "40.00 USD",
  //     icon: Calendar,
  //     color: "text-orange-600",
  //     bgColor: "bg-orange-100"
  //   }
  // ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Processing':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input 
                type="date" 
                className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input 
                type="date" 
                className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <select className="border border-gray-200 rounded-md px-3 py-2 text-sm">
              <option>All Status</option>
              <option>Completed</option>
              <option>Processing</option>
              <option>Failed</option>
            </select>
            <select className="border border-gray-200 rounded-md px-3 py-2 text-sm">
              <option>All Methods</option>
              <option>Bank Transfer</option>
              <option>PayPal</option>
              <option>Mobile Money</option>
            </select>
            <Button className="bg-[#ed874a] hover:bg-[#d76f32]">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              <span className="ml-3 text-gray-600">Loading withdrawal history...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Error loading withdrawals: {error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && withdrawalHistory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No withdrawal history</p>
              <p className="text-sm">Your withdrawal transactions will appear here</p>
            </div>
          )}

          {/* Mobile card list */}
          {!loading && !error && withdrawalHistory.length > 0 && (
            <div className="space-y-3 md:hidden">
              {currentRows.map((withdrawal, index) => (
                <div
                  key={`${withdrawal.reference}-${index}`}
                  className="border rounded-lg p-3 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{withdrawal.date}</span>
                    <span className="text-xs font-mono text-gray-500">{withdrawal.reference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{withdrawal.amount}</p>
                      <p className="text-xs text-gray-600">{withdrawal.method}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(withdrawal.status)}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${withdrawal.statusColor}`}
                      >
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Desktop table */}
          {!loading && !error && withdrawalHistory.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date Requested</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((withdrawal, index) => (
                  <tr key={`${withdrawal.reference}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{withdrawal.date}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{withdrawal.amount}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{withdrawal.method}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">{withdrawal.reference}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${withdrawal.statusColor}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination */}
          {!loading && !error && withdrawalHistory.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
              <span>
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default WithdrawalHistoryPage
