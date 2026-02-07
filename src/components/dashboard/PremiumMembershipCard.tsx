'use client'

import { Crown, Zap, TrendingUp, Calendar, Clock, Sparkles, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PremiumMembershipCardProps {
  expiryDate: string
}

export function PremiumMembershipCard({ expiryDate }: PremiumMembershipCardProps) {
  // Calculate days left
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6 shadow-xl border border-gray-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ed874a] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ed874a] rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-[#ed874a]" />
              <h2 className="text-2xl font-bold text-gray-900">AI Cashflow Program</h2>
            </div>
            <p className="text-gray-600 text-sm font-medium">
              Full Access Member
            </p>
          </div>
          <Badge className="bg-green-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            ACTIVE
          </Badge>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-[#ed874a]" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">Earn 60% Commission</p>
              <p className="text-gray-500 text-xs mt-1">On every sale you generate</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-[#ed874a]" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">AI Cashflow Program Access</p>
              <p className="text-gray-500 text-xs mt-1">Complete training & resources</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-[#ed874a]" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">All Platform Features</p>
              <p className="text-gray-500 text-xs mt-1">Full course access & support</p>
            </div>
          </div>
        </div>

        {/* Membership Status */}
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-700" />
              <span className="text-gray-900 font-semibold text-sm">Membership Status</span>
            </div>
            <Badge className="bg-green-500 text-white border-0 px-2 py-0.5 text-xs font-bold">
              ACTIVE
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'} • 1 Year Validity
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Top Edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ed874a]/30 to-transparent"></div>
    </div>
  )
}
