"use client"
import React from 'react'
import { Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLeaderboard } from '@/lib/hooks/useLeaderboard'

const LeaderboardPage = () => {
  const { leaderboard, currentUserRank, loading, error } = useLeaderboard()

  const formatRevenue = (amount: number): string => {
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
    return `$${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-[900px]">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Leaderboard</h1>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-[#ed874a]" />
          <span className="ml-2 text-sm text-gray-500">Loading leaderboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 max-w-[900px]">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Leaderboard</h1>
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <p className="text-sm text-red-600">Error loading leaderboard: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-3 bg-red-600 hover:bg-red-700 text-sm h-9">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-[900px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leaderboard</h1>
          {currentUserRank && (
            <p className="text-sm text-gray-500 mt-0.5">Your rank: <span className="font-bold text-gray-900">#{currentUserRank}</span></p>
          )}
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 text-center py-16">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-700">No leaderboard data available</p>
          <p className="text-xs text-gray-400 mt-1">Start referring to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          {/* Mobile Cards */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {leaderboard.map((affiliate) => (
              <div 
                key={affiliate.rank}
                className={`p-4 ${affiliate.isCurrentUser ? 'bg-[#ed874a]/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                      affiliate.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      affiliate.rank === 2 ? 'bg-gray-200 text-gray-700' :
                      affiliate.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {affiliate.rank <= 3 ? affiliate.award : affiliate.rank}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {affiliate.name}{affiliate.isCurrentUser ? ' (You)' : ''}
                      </p>
                      <p className="text-xs text-gray-500">{affiliate.level} &middot; {affiliate.total_referrals} referrals</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatRevenue(affiliate.total_revenue)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Rank</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Affiliate</th>
                  <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Level</th>
                  <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th className="text-right py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Referrals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((affiliate) => (
                  <tr 
                    key={affiliate.rank}
                    className={`transition-colors ${affiliate.isCurrentUser ? 'bg-[#ed874a]/5' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-3.5 px-5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        affiliate.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        affiliate.rank === 2 ? 'bg-gray-200 text-gray-700' :
                        affiliate.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {affiliate.rank <= 3 ? affiliate.award : affiliate.rank}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm font-medium text-gray-900">
                        {affiliate.name}{affiliate.isCurrentUser ? ' (You)' : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-sm text-gray-600">{affiliate.level}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatRevenue(affiliate.total_revenue)}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-sm text-gray-600">{affiliate.total_referrals}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaderboardPage
