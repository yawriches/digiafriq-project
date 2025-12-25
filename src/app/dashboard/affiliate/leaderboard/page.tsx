"use client"
import React from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLeaderboard } from '@/lib/hooks/useLeaderboard'

const LeaderboardPage = () => {
  const { leaderboard, currentUserRank, loading, error } = useLeaderboard()

  // Format earnings for display
  const formatEarnings = (earnings: number): string => {
    if (earnings >= 1000) {
      return `$${(earnings / 1000).toFixed(1)}K`
    }
    return `$${earnings.toFixed(2)}`
  }

  if (loading) {
    return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
              <span className="ml-2 text-gray-600">Loading leaderboard...</span>
            </div>
          </CardContent>
        </Card>
    )
  }

  if (error) {
    return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">Error loading leaderboard: {error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-2 bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
        
        <Card className="overflow-hidden">
        <CardContent className="p-0">

          {/* Mobile Cards - Hidden on desktop */}
          <div className="block lg:hidden space-y-3 p-4">
            {leaderboard.map((affiliate) => (
              <div 
                key={affiliate.rank}
                className={`bg-white rounded-lg border p-4 ${
                  affiliate.isCurrentUser ? 'border-gray-400 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                      <span className="text-sm font-semibold text-gray-700">#{affiliate.rank}</span>
                    </div>
                    <div>
                      <h3 className={`text-base font-semibold ${
                        affiliate.isCurrentUser ? 'text-gray-900' : 'text-gray-800'
                      }`}>
                        {affiliate.name}
                      </h3>
                      <p className="text-sm text-gray-500">{affiliate.level}</p>
                      <p className="text-xs text-gray-400">{affiliate.total_referrals} referrals</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{formatEarnings(affiliate.total_earnings)}</div>
                    <div className="text-xl">{affiliate.award}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#ed874a] text-white">
                  <th className="text-left py-4 px-6 font-semibold text-base">Rank</th>
                  <th className="text-left py-4 px-6 font-semibold text-base">Affiliate</th>
                  <th className="text-left py-4 px-6 font-semibold text-base">Level</th>
                  <th className="text-right py-4 px-6 font-semibold text-base">Total Amount</th>
                  <th className="text-center py-4 px-6 font-semibold text-base">Award</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {leaderboard.map((affiliate, index) => (
                  <tr 
                    key={affiliate.rank} 
                    className={`border-b border-gray-200 ${
                      affiliate.isCurrentUser ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="py-5 px-6">
                      <span className="text-gray-600 font-medium text-base">
                        {affiliate.rank}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`font-semibold text-base ${
                        affiliate.isCurrentUser ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {affiliate.name}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-gray-600 text-base">
                        {affiliate.level}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <span className="text-gray-600 font-medium text-base">***** USD</span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-3xl">
                        {affiliate.rank === 1 ? '🏆' : affiliate.rank === 2 ? '🥈' : affiliate.rank === 3 ? '🥉' : '🏅'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {leaderboard.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-gray-500 text-lg mb-2">No leaderboard data available</p>
              <p className="text-gray-400 text-sm">Start referring affiliates to appear on the leaderboard!</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
  )
}

export default LeaderboardPage
