'use client'

import { Crown, Zap, TrendingUp, Lock, Calendar, Clock, Sparkles, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PremiumMembershipCardProps {
  hasDCS: boolean
  expiryDate: string
  onUpgrade?: () => void
}

export function PremiumMembershipCard({ hasDCS, expiryDate, onUpgrade }: PremiumMembershipCardProps) {
  // Calculate days left
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  if (hasDCS) {
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
                <h2 className="text-2xl font-bold text-gray-900">Learner</h2>
              </div>
              <p className="text-gray-600 text-sm font-medium">
                Plan: Learner + Digital Cashflow System
              </p>
            </div>
            <Badge className="bg-green-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              DCS UNLOCKED
            </Badge>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-[#ed874a]" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">Earn 80% Commission + 20% Recurring</p>
                <p className="text-gray-500 text-xs mt-1">Lifetime promo tools included</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-[#ed874a]" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">Digital Cashflow Program Access</p>
                <p className="text-gray-500 text-xs mt-1">Complete training & resources</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-[#ed874a]" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">All Learner Features</p>
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

  // Learner Only Card (DCS Locked)
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6 shadow-xl border border-gray-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-900 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-900 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#ed874a]" />
              <h2 className="text-2xl font-bold text-gray-900">Digiafriq</h2>
            </div>
            <p className="text-gray-600 text-sm font-medium">
              Learner Membership
            </p>
            <p className="text-gray-500 text-xs mt-1">Plan: Learner Only</p>
          </div>
          <Badge className="bg-gray-400 text-white border-0 px-3 py-1 text-xs font-semibold">
            <Lock className="w-3 h-3 mr-1" />
            DCS LOCKED
          </Badge>
        </div>

        {/* Locked Feature Highlight */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 mb-5 border-2 border-dashed border-orange-300">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-[#ed874a]" />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-bold text-sm mb-1">Upgrade to unlock earnings</p>
              <p className="text-gray-600 text-xs leading-relaxed">
                Get the Digital Cashflow Program + lifetime promo tools. Earn 80% commission + 20% yearly recurring.
              </p>
            </div>
          </div>
          
          {onUpgrade && (
            <Button 
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-[#ed874a] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-semibold shadow-lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              Unlock Digital Cashflow System for $7
            </Button>
          )}
        </div>

        {/* Current Benefits */}
        <div className="space-y-3 mb-5">
          <p className="text-gray-700 font-semibold text-sm mb-2">Your Current Benefits:</p>
          
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-[#ed874a]" />
            </div>
            <div>
              <p className="text-gray-900 font-medium text-sm">Full Course Access</p>
              <p className="text-gray-500 text-xs mt-1">Learn all digital skills</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-[#ed874a]/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#ed874a]" />
            </div>
            <div>
              <p className="text-gray-900 font-medium text-sm">Premium Support</p>
              <p className="text-gray-500 text-xs mt-1">Priority assistance</p>
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
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-400/30 to-transparent"></div>
    </div>
  )
}
