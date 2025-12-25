"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Monitor, Trophy, Calendar, Loader2 } from 'lucide-react'
import { useContests } from '@/lib/hooks/useContests'

interface Contest {
  sl: number
  id: string
  name: string
  period: string
  status: string
}

const EndedContestsPage = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const { endedContests: backendContests, loading, error } = useContests()

  // Transform backend data to match the expected format
  const endedContests: Contest[] = backendContests.map((contest: any, index: number) => {
    const startDate = new Date(contest.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const endDate = new Date(contest.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    return {
      sl: index + 1,
      id: contest.id,
      name: contest.name,
      period: `${startDate} - ${endDate}`,
      status: 'Ended'
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
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

  const filteredContests = endedContests.filter(contest =>
    contest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contest.period.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDetailsClick = (contestId: string) => {
    router.push(`/dashboard/affiliate/contests/${contestId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ended Contests</h1>
        
        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
          <button className="absolute right-0 top-0 h-full px-4 bg-gray-500 text-white rounded-r-lg hover:bg-gray-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="block lg:hidden space-y-4">
        {filteredContests.map((contest) => (
          <div key={contest.sl} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">#{contest.sl}</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600 border border-gray-300">
                    {contest.status}
                  </span>
                </div>
                <Trophy className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                {contest.name}
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium">Period:</span>
                  <span className="ml-2">{contest.period}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleDetailsClick(contest.id)}
                className="w-full bg-transparent border border-gray-500 text-gray-600 rounded-lg py-3 px-4 font-semibold text-sm flex items-center justify-center space-x-2 hover:bg-gray-500 hover:text-white transition-all"
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
            <p className="text-gray-500 text-lg">No ended contests found.</p>
          </div>
        )}
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium text-gray-700">SL</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Name</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Period</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Action</th>
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
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-600 bg-white">
                      {contest.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleDetailsClick(contest.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-500 text-gray-600 rounded-lg hover:bg-gray-500 hover:text-white transition-all"
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
            <p className="text-gray-500">No ended contests found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EndedContestsPage
