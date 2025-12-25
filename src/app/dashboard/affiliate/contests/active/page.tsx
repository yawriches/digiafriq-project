"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Monitor, 
  Loader2,
  Trophy
} from 'lucide-react'
import { useContests } from '@/lib/hooks/useContests'

interface Contest {
  sl: number
  id: string
  name: string
  campaign: string
  winner: string
  status: string
}

const ActiveContestsPage = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const { runningContests: backendContests, loading, error } = useContests()

  // Transform backend data to match the expected format
  const activeContests: Contest[] = backendContests.map((contest: any, index: number) => {
    return {
      sl: index + 1,
      id: contest.id,
      name: contest.name,
      campaign: contest.campaign || 'DigiAfriq Campaign',
      winner: contest.winner_criteria || 'All target satisfied',
      status: 'Active'
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-2 text-gray-600">Loading contests...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading contests: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    )
  }

  const filteredContests = activeContests.filter(contest =>
    contest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contest.campaign.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDetailsClick = (contestId: string) => {
    router.push(`/dashboard/affiliate/contests/${contestId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Active Contests</h1>

        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ed874a] focus:border-transparent"
          />
          <button className="absolute right-0 top-0 h-full px-4 bg-[#ed874a] text-white rounded-r-lg hover:bg-[#d76f32] transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="block lg:hidden space-y-4">
        {filteredContests.map((contest) => (
          <div key={contest.sl} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Content - Stacked Layout */}
            <div className="divide-y divide-gray-100">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="font-semibold text-gray-700">SL</span>
                <span className="text-[#ed874a] font-medium">{contest.sl}</span>
              </div>
              
              <div className="flex justify-between items-center px-4 py-3">
                <span className="font-semibold text-gray-700">Name</span>
                <span className="text-[#ed874a] text-right max-w-[60%]">{contest.name}</span>
              </div>
              
              <div className="flex justify-between items-center px-4 py-3">
                <span className="font-semibold text-gray-700">Campaign</span>
                <span className="text-[#ed874a] text-right max-w-[60%]">{contest.campaign}</span>
              </div>
              
              <div className="flex justify-between items-center px-4 py-3">
                <span className="font-semibold text-gray-700">Winner</span>
                <span className="text-gray-600 text-right max-w-[60%]">{contest.winner}</span>
              </div>
              
              <div className="flex justify-between items-center px-4 py-3">
                <span className="font-semibold text-gray-700">Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-[#ed874a] text-[#ed874a] bg-white">
                  {contest.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center px-4 py-3">
                <span className="font-semibold text-gray-700">Action</span>
                <button
                  onClick={() => handleDetailsClick(contest.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-[#ed874a] text-[#ed874a] rounded-lg hover:bg-[#ed874a] hover:text-white transition-all"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State - Mobile */}
        {filteredContests.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No active contests found.</p>
          </div>
        )}
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#ed874a] text-white">
                <th className="text-left py-4 px-6 font-medium">SL</th>
                <th className="text-left py-4 px-6 font-medium">Name</th>
                <th className="text-left py-4 px-6 font-medium">Campaign</th>
                <th className="text-left py-4 px-6 font-medium">Winner</th>
                <th className="text-left py-4 px-6 font-medium">Status</th>
                <th className="text-left py-4 px-6 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredContests.map((contest, index) => (
                <React.Fragment key={contest.sl}>
                  <tr
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-6 text-gray-700">{contest.sl}</td>
                    <td className="py-4 px-6 text-gray-700">{contest.name}</td>
                    <td className="py-4 px-6 text-gray-700">{contest.campaign}</td>
                    <td className="py-4 px-6 text-gray-700">{contest.winner}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-[#ed874a] text-[#ed874a] bg-white">
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
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State - Desktop */}
        {filteredContests.length === 0 && (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active contests found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActiveContestsPage
