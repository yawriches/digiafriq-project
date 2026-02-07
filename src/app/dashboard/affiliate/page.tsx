"use client"
import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Activity,
  Sparkles,
  Copy,
  UserPlus,
  Clock,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAffiliateData } from '@/lib/hooks/useAffiliateData'
import { useAuth } from '@/lib/supabase/auth'
import { useReferralCode, useReferralStats, useCommissions } from '@/hooks/useReferrals'
import { toast } from 'sonner'
import { getUserWithdrawals, Withdrawal } from '@/lib/withdrawals'
import Link from 'next/link'
import { useCurrency, CURRENCY_RATES } from '@/contexts/CurrencyContext'
import { AffiliateDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

export const dynamic = 'force-dynamic'

const AffiliateDashboard = () => {
  const { stats: affiliateStats, recentCommissions, recentPayouts, affiliateProfile, loading: affiliateLoading, error } = useAffiliateData()
  const { user, profile } = useAuth()
  const { stats: referralStats, loading: referralStatsLoading } = useReferralStats()
  const { loading: commissionsLoading, getTotalEarnings, getAvailableEarnings } = useCommissions()
  const { referralCode, loading: referralCodeLoading, generateUrls } = useReferralCode()
  const { selectedCurrency, formatAmount, currencyLoading } = useCurrency()

  const urls = generateUrls()

  const totalEarnings = getTotalEarnings()
  const currentBalanceValue = getAvailableEarnings()
  
  // Use real-time sales counts from affiliateStats (fetched from database)
  const totalSales = affiliateStats.totalSales

  const loading = affiliateLoading || currencyLoading

  // Pending withdrawals state
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true)

  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (!user) return
      setWithdrawalsLoading(true)
      const { data, error } = await getUserWithdrawals()
      if (!error && data) {
        setPendingWithdrawals(data.filter(w => w.status === 'PENDING' || w.status === 'APPROVED'))
      }
      setWithdrawalsLoading(false)
    }
    fetchWithdrawals()
  }, [user])

  const pendingAmount = pendingWithdrawals
    .filter(w => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amount_usd, 0)

  // Copy to clipboard function with fallback
  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      toast.success('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
      toast.error('Failed to copy link')
    }
  }

  const statsCards = [
    {
      title: "Current Balance",
      value: formatAmount(currentBalanceValue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100"
    },
    {
      title: "Total Earnings", 
      value: formatAmount(totalEarnings),
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50", 
      iconBg: "bg-blue-100"
    },
    {
      title: "Number of Sales",
      value: totalSales.toString(),
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    }
  ]

  if (loading) {
    return <AffiliateDashboardSkeleton />
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading dashboard: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-600 hover:bg-red-700"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
      <div className="p-6">
      {/* Compact Welcome Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Welcome, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Affiliate'}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">Track your affiliate performance</p>
          </div>
          {!loading && (
            <div className="text-right">
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {formatAmount(currentBalanceValue)}
              </p>
              <p className="text-xs text-gray-500">Balance ({CURRENCY_RATES[selectedCurrency].name})</p>
            </div>
          )}
        </div>

        {/* Date Filter - Mobile responsive */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <input 
              type="date"
              placeholder="Start date"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed874a] focus:border-transparent text-gray-700 bg-white"
            />
            <input 
              type="date"
              placeholder="End date"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed874a] focus:border-transparent text-gray-700 bg-white"
            />
          </div>
          <Button className="bg-[#ed874a] hover:bg-[#d76f32] text-white px-6 py-2.5 rounded-lg font-medium w-full sm:w-auto">
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Grid - Mobile optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" data-tooltip="earnings-tab">
        {statsCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Pending Withdrawals Card */}
      {pendingAmount > 0 && (
        <Card className="mb-6 border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pending Withdrawals</h3>
                <p className="text-sm text-yellow-600">
                  <span className="font-medium">{formatAmount(pendingAmount)}</span> awaiting review
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Cashflow Referral Link Section */}
      <div className="mb-8" data-tooltip="affiliate-link">
        <Card className="border-2 border-[#ed874a]/20 bg-gradient-to-br from-orange-50/50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-[#ed874a]" />
              Your Sales Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Share this link to earn <span className="font-semibold text-[#ed874a]">60% commission</span> on every AI Cashflow Program sale.
            </p>
            <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <code className="flex-1 text-sm bg-gray-50 p-3 rounded-lg border text-gray-800 font-mono break-all">
                  {urls.affiliateUrl || urls.learnerUrl || 'Generating link...'}
                </code>
                <Button 
                  size="lg" 
                  className="bg-[#ed874a] hover:bg-[#d76f32] text-white w-full sm:w-auto"
                  onClick={() => (urls.affiliateUrl || urls.learnerUrl) && copyToClipboard(urls.affiliateUrl || urls.learnerUrl)}
                  disabled={!urls.affiliateUrl && !urls.learnerUrl}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities - Combined sales and withdrawals */}
      <div className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Activity className="w-5 h-5 mr-2 text-gray-600" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : (() => {
              // Combine commissions, withdrawal requests, and payout withdrawals into a single activities array
              const activities = [
                // Sales from commissions
                ...recentCommissions.map((c: any) => ({
                  id: c.id,
                  type: 'sale' as const,
                  subType: c.commission_type || 'learner',
                  amount: c.commission_amount || c.amount || 0,
                  status: c.status,
                  description: c.notes || c.description,
                  created_at: c.created_at
                })),
                // Pending/approved withdrawal requests (from withdrawals table)
                ...pendingWithdrawals.map((w: any) => ({
                  id: w.id,
                  type: 'withdrawal' as const,
                  subType: 'request',
                  amount: w.amount_usd,
                  status: w.status,
                  description: `Withdrawal request`,
                  created_at: w.created_at
                })),
                // Completed / processing payouts (from payouts table)
                ...recentPayouts.map((p: any) => ({
                  id: p.id,
                  type: 'withdrawal' as const,
                  subType: 'payout',
                  amount: p.amount,
                  status: p.status,
                  description: `Withdrawal`,
                  created_at: p.created_at
                }))
              ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

              if (activities.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-400" />
                    <p className="text-sm">No recent activities</p>
                    <p className="text-xs mt-1">Your sales and withdrawal activities will appear here</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {activities.slice(0, 10).map((activity) => {
                    const isSale = activity.type === 'sale';
                    const isWithdrawal = activity.type === 'withdrawal';

                    // Simplified colors for AI Cashflow
                    const bgColor = isSale ? 'bg-orange-50 hover:bg-orange-100' : 'bg-gray-50 hover:bg-gray-100';
                    const iconBg = isSale ? 'bg-orange-100' : 'bg-gray-200';
                    const iconColor = isSale ? 'text-[#ed874a]' : 'text-gray-600';
                    const amountColor = isWithdrawal ? 'text-gray-700' : 'text-green-600';
                    const amountPrefix = isWithdrawal ? '-' : '+';

                    const activityLabel = isSale ? 'AI Cashflow Sale' : 'Withdrawal';
                    const ActivityIcon = isSale ? Sparkles : DollarSign;

                    return (
                      <div 
                        key={activity.id} 
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${bgColor}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                            <ActivityIcon className={`w-5 h-5 ${iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {activityLabel}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                activity.status === 'approved' || activity.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                activity.status === 'pending' || activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                activity.status === 'completed' || activity.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.status?.toLowerCase()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(activity.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${amountColor}`}>
                            {amountPrefix}{formatAmount(activity.amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

export default AffiliateDashboard
