"use client"
import React, { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  Activity,
  Sparkles,
  Copy,
  Clock,
  Users,
  Trophy,
  ArrowRight,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAffiliateData } from '@/lib/hooks/useAffiliateData'
import { useAuth } from '@/lib/supabase/auth'
import { useReferralCode, useReferralStats, useCommissions } from '@/hooks/useReferrals'
import { toast } from 'sonner'
import { getUserWithdrawals, Withdrawal } from '@/lib/withdrawals'
import Link from 'next/link'
import { useCurrency, CURRENCY_RATES } from '@/contexts/CurrencyContext'
import { AffiliateDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { useLeaderboard } from '@/lib/hooks/useLeaderboard'

export const dynamic = 'force-dynamic'

const AffiliateDashboard = () => {
  const { stats: affiliateStats, recentCommissions, recentPayouts, affiliateProfile, loading: affiliateLoading, error } = useAffiliateData()
  const { user, profile } = useAuth()
  const { stats: referralStats, loading: referralStatsLoading } = useReferralStats()
  const { loading: commissionsLoading, getTotalEarnings, getAvailableEarnings } = useCommissions()
  const { referralCode, loading: referralCodeLoading, generateUrls } = useReferralCode()
  const { selectedCurrency, formatAmount, currencyLoading } = useCurrency()

  const urls = generateUrls()
  const { leaderboard, currentUserRank, loading: leaderboardLoading } = useLeaderboard()

  const totalEarnings = getTotalEarnings()
  const currentBalanceValue = getAvailableEarnings()
  const totalSales = affiliateStats.totalSales
  const loading = affiliateLoading || currencyLoading

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

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      toast.success('Link copied to clipboard!')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Affiliate'

  if (loading) return <AffiliateDashboardSkeleton />

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <p className="text-red-600 text-sm">Error loading dashboard: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-3 bg-red-600 hover:bg-red-700 text-sm h-9">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1200px]">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your affiliate performance and earnings.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" data-tooltip="earnings-tab">
        {/* Current Balance */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(currentBalanceValue)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        {/* Total Earnings */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(totalEarnings)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        {/* Sales */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalSales}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Withdrawals */}
      {pendingAmount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">Pending Withdrawals</p>
            <p className="text-xs text-amber-700">{formatAmount(pendingAmount)} awaiting review</p>
          </div>
        </div>
      )}

      {/* Referral Link Card */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-5 mb-6" data-tooltip="affiliate-link">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#ed874a]" />
          <h2 className="text-sm font-semibold text-gray-900">Your Sales Link</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Share this link to earn <span className="font-semibold text-[#ed874a]">60% commission</span> on every AI Cashflow Program sale.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs text-gray-700 truncate">
            {urls.affiliateUrl || urls.learnerUrl || 'Generating link...'}
          </div>
          <Button 
            className="bg-[#ed874a] hover:bg-[#d76f32] text-xs h-9 rounded-lg px-4 shrink-0"
            onClick={() => (urls.affiliateUrl || urls.learnerUrl) && copyToClipboard(urls.affiliateUrl || urls.learnerUrl)}
            disabled={!urls.affiliateUrl && !urls.learnerUrl}
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copy Link
          </Button>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#ed874a]" />
              <h2 className="text-sm font-semibold text-gray-900">Leaderboard</h2>
            </div>
            <Link href="/dashboard/affiliate/leaderboard" className="text-xs font-medium text-[#ed874a] hover:text-[#d76f32] flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {currentUserRank && (
            <div className="px-5 py-2 bg-[#ed874a]/5 border-b border-[#ed874a]/10">
              <p className="text-xs text-gray-600">Your rank: <span className="font-bold text-gray-900">#{currentUserRank}</span></p>
            </div>
          )}
          <div className="divide-y divide-gray-50">
            {leaderboardLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gray-100 rounded-full" />
                      <div className="h-3.5 bg-gray-100 rounded w-20" />
                    </div>
                    <div className="h-3.5 bg-gray-100 rounded w-14" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-10">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-500">No leaderboard data yet</p>
              </div>
            ) : (
              <div className="p-3">
                {leaderboard.slice(0, 7).map((entry) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                      entry.isCurrentUser ? 'bg-[#ed874a]/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        entry.rank === 2 ? 'bg-gray-200 text-gray-700' :
                        entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {entry.rank <= 3 ? entry.award : entry.rank}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {entry.name}{entry.isCurrentUser ? ' (You)' : ''}
                        </p>
                        <p className="text-[10px] text-gray-400">{entry.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-900">
                        ${entry.total_revenue >= 1000 ? `${(entry.total_revenue / 1000).toFixed(1)}K` : entry.total_revenue.toFixed(0)}
                      </p>
                      <p className="text-[10px] text-gray-400">{entry.total_referrals} sales</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <Link href="/dashboard/affiliate/activity/sales" className="text-xs font-medium text-[#ed874a] hover:text-[#d76f32] flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(() => {
              const activities = [
                ...recentCommissions.map((c: any) => ({
                  id: c.id, type: 'sale' as const,
                  amount: c.commission_amount || c.amount || 0,
                  status: c.status, created_at: c.created_at
                })),
                ...pendingWithdrawals.map((w: any) => ({
                  id: w.id, type: 'withdrawal' as const,
                  amount: w.amount_usd, status: w.status,
                  created_at: w.created_at
                })),
                ...recentPayouts.map((p: any) => ({
                  id: p.id, type: 'withdrawal' as const,
                  amount: p.amount, status: p.status,
                  created_at: p.created_at
                }))
              ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

              if (activities.length === 0) {
                return (
                  <div className="text-center py-10">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-500">No recent activities</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Sales and withdrawals will appear here</p>
                  </div>
                )
              }

              return (
                <div className="p-3">
                  {activities.slice(0, 8).map((activity) => {
                    const isSale = activity.type === 'sale'
                    return (
                      <div key={activity.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSale ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                            {isSale 
                              ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                              : <DollarSign className="w-4 h-4 text-gray-500" />
                            }
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-800">
                              {isSale ? 'Commission Earned' : 'Withdrawal'}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${isSale ? 'text-emerald-600' : 'text-gray-700'}`}>
                            {isSale ? '+' : '-'}{formatAmount(activity.amount)}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            activity.status === 'approved' || activity.status === 'APPROVED' || activity.status === 'completed' || activity.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-600'
                              : activity.status === 'pending' || activity.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {activity.status?.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AffiliateDashboard
