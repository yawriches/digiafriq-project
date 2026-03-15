"use client"
import React, { useState } from 'react'
import { 
  Activity, 
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAffiliateData } from '@/lib/hooks/useAffiliateData'

const TransactionsPage = () => {
  const { recentCommissions, recentPayouts, loading, error } = useAffiliateData()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')

  // Combine commissions and payouts into transactions (no mock fallback)
  const allTransactions = [
    ...recentCommissions.map(commission => {
      const anyCommission = commission as any
      const amount = (anyCommission.amount ?? anyCommission.commission_amount ?? 0) as number

      const rawStatus = (anyCommission.status as string) || ''
      const status =
        rawStatus === 'paid' || rawStatus === 'available'
          ? 'Completed'
          : rawStatus === 'pending'
          ? 'Pending'
          : rawStatus === 'cancelled'
          ? 'Cancelled'
          : rawStatus || 'Unknown'

      const statusColor =
        status === 'Completed'
          ? 'text-gray-700 bg-gray-100'
          : status === 'Pending'
          ? 'text-yellow-600 bg-yellow-100'
          : status === 'Cancelled'
          ? 'text-red-600 bg-red-100'
          : 'text-gray-700 bg-gray-100'

      return {
        id: commission.id.slice(0, 10).toUpperCase(),
        date: new Date(commission.created_at).toLocaleDateString('en-US'),
        type: 'Commission Earned',
        description: `Commission earned - ${status}`,
        amount: `+${amount.toFixed(2)} USD`,
        status,
        statusColor,
        category: 'commission',
        reference: commission.id.slice(0, 12).toUpperCase(),
      }
    }),
    ...recentPayouts.map(payout => ({
      id: payout.id.slice(0, 10).toUpperCase(),
      date: new Date(payout.created_at).toLocaleDateString('en-US'),
      type: payout.status === 'completed' ? 'Withdrawal' : 'Withdrawal Processing',
      description: `Payout ${payout.status}${payout.reference ? ` - Ref: ${payout.reference}` : ''}`,
      amount: `-${payout.amount.toFixed(2)} USD`,
      status:
        payout.status === 'completed'
          ? 'Completed'
          : payout.status === 'processing'
          ? 'Processing'
          : payout.status === 'pending'
          ? 'Pending'
          : 'Failed',
      statusColor:
        payout.status === 'completed'
          ? 'text-gray-700 bg-gray-100'
          : payout.status === 'processing'
          ? 'text-blue-600 bg-blue-100'
          : payout.status === 'pending'
          ? 'text-yellow-600 bg-yellow-100'
          : 'text-red-600 bg-red-100',
      category: 'withdrawal',
      reference: payout.reference || payout.id.slice(0, 12).toUpperCase(),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const transactions = allTransactions
  //     icon: ArrowUpRight,
  //     color: "text-green-600",
  //     bgColor: "bg-green-100"
  //   },
  //   {
  //     title: "Total Outgoing",
  //     value: "-85.63 USD",
  //     icon: ArrowDownLeft,
  //     color: "text-red-600",
  //     bgColor: "bg-red-100"
  //   },
  //   {
  //     title: "Net Balance",
  //     value: "-40.63 USD",
  //     icon: DollarSign,
  //     color: "text-gray-600",
  //     bgColor: "bg-gray-100"
  //   },
  //   {
  //     title: "This Month",
  //     value: "8 transactions",
  //     icon: Activity,
  //     color: "text-blue-600",
  //     bgColor: "bg-blue-100"
  //   }
  // ]

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = typeFilter === 'All Types' || transaction.type.includes(typeFilter.replace(' Earned', ''))
    const matchesStatus = statusFilter === 'All Status' || transaction.status === statusFilter
    
    let matchesDate = true
    if (dateFrom && dateTo) {
      const transactionDate = new Date(transaction.date)
      const fromDate = new Date(dateFrom)
      const toDate = new Date(dateTo)
      matchesDate = transactionDate >= fromDate && transactionDate <= toDate
    }
    
    return matchesType && matchesStatus && matchesDate
  })

  const getTransactionIcon = (type: string) => {
    if (type.includes('Commission') || type.includes('Earned')) {
      return <ArrowUpRight className="w-5 h-5 text-gray-600" />
    } else if (type.includes('Withdrawal') || type.includes('Fee')) {
      return <ArrowDownLeft className="w-5 h-5 text-gray-600" />
    } else {
      return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-gray-600" />
      case 'Pending':
        return <Clock className="w-4 h-4 text-gray-600" />
      case 'Processing':
        return <Clock className="w-4 h-4 text-gray-600" />
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1100px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Transaction History</h1>
            <p className="text-sm text-gray-500 mt-0.5">View all commissions and withdrawals</p>
          </div>
          <Button variant="outline" className="text-xs h-8 rounded-lg">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>

        {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20 outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20 outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20 outline-none bg-white">
                <option>All Types</option>
                <option>Commission</option>
                <option>Withdrawal</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20 outline-none bg-white">
                <option>All Status</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>Processing</option>
              </select>
            </div>
          </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All Transactions</h2>
        </div>
        <div>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#ed874a]" />
              <span className="ml-2 text-sm text-gray-500">Loading transactions...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-10">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm text-red-600">Error loading transactions: {error}</p>
            </div>
          )}

          {!loading && !error && allTransactions.length === 0 && (
            <div className="text-center py-14">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No transactions found</p>
              <p className="text-xs text-gray-500 mt-1">Your commissions and payouts will appear here</p>
            </div>
          )}

          {/* Mobile Cards - Hidden on desktop */}
          {!loading && !error && allTransactions.length > 0 && (
          <div className="block lg:hidden p-4 space-y-4">
            {filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">ID</span>
                    <span className="text-sm text-gray-600">{transaction.id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Type</span>
                    <span className="text-sm text-gray-600">{transaction.type}</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-900">Description</span>
                    <div className="text-right max-w-[200px]">
                      <div className="text-sm text-gray-600">{transaction.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Amount</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {transaction.amount}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Reference</span>
                    <span className="text-sm text-gray-600">{transaction.reference}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Status</span>
                    <span className={`text-sm px-2 py-1 rounded text-xs font-medium ${transaction.statusColor}`}>
                      {transaction.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Date</span>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{transaction.date}</div>
                      <div className="text-xs text-gray-500">1 month ago</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Desktop List - Hidden on mobile */}
          {!loading && !error && allTransactions.length > 0 && (
          <div className="hidden lg:block divide-y divide-gray-100">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{transaction.type}</p>
                    <p className="text-xs text-gray-500">{transaction.date} &middot; {transaction.reference}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{transaction.amount}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${transaction.statusColor}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
      </div>
  )
}

export default TransactionsPage
