"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Monitor, 
  Trophy, 
  Calendar,
  Loader2
} from 'lucide-react'
import { useContests } from '@/lib/hooks/useContests'

interface Contest {
  sl: number
  id: string
  name: string
  period: string
  status: string
}

const RunningContestsPage = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const { runningContests: backendContests, loading, error } = useContests()

  // Transform backend data to match the expected format
  const runningContests: Contest[] = backendContests.map((contest: any, index: number) => {
    const startDate = new Date(contest.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const endDate = new Date(contest.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    return {
      sl: index + 1,
      id: contest.id,
      name: contest.name,
      period: `${startDate} - ${endDate}`,
      status: 'Running'
    }
  })

  if (loading) {
    return (
      <div className="p-4 lg:p-6"><div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#ed874a]" />
        <span className="ml-2 text-sm text-gray-500">Loading contests...</span>
      </div></div>
    )
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6"><div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <p className="text-sm text-red-600">Error loading contests: {error}</p>
      </div></div>
    )
  }

  const filteredContests = runningContests.filter(contest =>
    contest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contest.period.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDetailsClick = (contestId: string) => {
    router.push(`/dashboard/affiliate/contests/${contestId}`)
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Running Contests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Active contests you can participate in</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20 outline-none"
          />
        </div>
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="block lg:hidden space-y-4">
        {filteredContests.map((contest) => (
          <div key={contest.sl} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#ed874a]/10 border-b border-[#ed874a]/20 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#ed874a]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#ed874a] font-bold text-sm">#{contest.sl}</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    {contest.status}
                  </span>
                </div>
                <Trophy className="w-6 h-6 text-[#ed874a]" />
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                {contest.name}
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-3 text-[#ed874a]" />
                  <span className="font-medium">Period:</span>
                  <span className="ml-2">{contest.period}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleDetailsClick(contest.id)}
                className="w-full bg-transparent border border-[#ed874a] text-[#ed874a] rounded-lg py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 hover:bg-[#ed874a] hover:text-white transition-all"
              >
                <Monitor className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}

        {/* Empty State - Mobile */}
        {filteredContests.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No contests found matching your search.</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredContests.map((contest, index) => (
                <tr
                  key={contest.sl}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="py-4 px-6 text-gray-700">{contest.sl}</td>
                  <td className="py-4 px-6 text-gray-700">{contest.name}</td>
                  <td className="py-4 px-6 text-gray-700">{contest.period}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">
                      {contest.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleDetailsClick(contest.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-[#ed874a] text-[#ed874a] rounded-lg hover:bg-[#ed874a] hover:text-white transition-all"
                    >
                      <Monitor className="w-4 h-4" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State - Desktop */}
        {filteredContests.length === 0 && (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No contests found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RunningContestsPage
