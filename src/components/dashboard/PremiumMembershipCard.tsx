'use client'

import { Crown, Zap, TrendingUp, Calendar, Clock, Sparkles, Award, AlertTriangle, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface PremiumMembershipCardProps {
  expiryDate: string
}

export function PremiumMembershipCard({ expiryDate }: PremiumMembershipCardProps) {
  // Calculate days left
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = daysLeft <= 0
  const isExpiringSoon = !isExpired && daysLeft <= 7

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 shadow-xl border ${
      isExpired
        ? 'bg-gradient-to-br from-red-50 via-gray-100 to-red-50 border-red-300'
        : isExpiringSoon
        ? 'bg-gradient-to-br from-amber-50 via-gray-100 to-amber-50 border-amber-300'
        : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 border-gray-300'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ed874a] rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ed874a] rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Expiry Warning Banner */}
        {(isExpired || isExpiringSoon) && (
          <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${
            isExpired
              ? 'bg-red-50 border border-red-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isExpired ? 'text-red-500' : 'text-amber-500'
            }`} />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                {isExpired
                  ? 'Your membership has expired'
                  : `Your membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
                }
              </p>
              <p className={`text-xs mt-1 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                {isExpired
                  ? 'Renew now to regain full access to all courses, tools, and features. Your progress and earnings are safe.'
                  : 'Renew before it expires to maintain uninterrupted access to all features.'
                }
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-[#ed874a]" />
              <h2 className="text-2xl font-bold text-gray-900">AI Cashflow Program</h2>
            </div>
            <p className="text-gray-600 text-sm font-medium">
              {isExpired ? 'Membership Expired' : 'Full Access Member'}
            </p>
          </div>
          {isExpired ? (
            <Badge className="bg-red-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-lg">
              <AlertTriangle className="w-3 h-3 mr-1" />
              EXPIRED
            </Badge>
          ) : isExpiringSoon ? (
            <Badge className="bg-amber-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-lg">
              <Clock className="w-3 h-3 mr-1" />
              EXPIRING SOON
            </Badge>
          ) : (
            <Badge className="bg-green-500 text-white border-0 px-3 py-1 text-xs font-semibold shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              ACTIVE
            </Badge>
          )}
        </div>

        {/* Benefits */}
        <div className={`space-y-3 mb-5 ${isExpired ? 'opacity-60' : ''}`}>
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
        <div className={`bg-white rounded-2xl p-4 border-2 shadow-sm ${
          isExpired ? 'border-red-200' : isExpiringSoon ? 'border-amber-200' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-700" />
              <span className="text-gray-900 font-semibold text-sm">Membership Status</span>
            </div>
            {isExpired ? (
              <Badge className="bg-red-500 text-white border-0 px-2 py-0.5 text-xs font-bold">
                EXPIRED
              </Badge>
            ) : isExpiringSoon ? (
              <Badge className="bg-amber-500 text-white border-0 px-2 py-0.5 text-xs font-bold">
                EXPIRING
              </Badge>
            ) : (
              <Badge className="bg-green-500 text-white border-0 px-2 py-0.5 text-xs font-bold">
                ACTIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isExpired
                ? `Expired on ${new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : `${daysLeft} days remaining • 1 Year Validity`
              }
            </span>
          </div>
        </div>

        {/* Renewal CTA */}
        {(isExpired || isExpiringSoon) && (
          <div className="mt-5">
            <Link href="/dashboard/learner/membership">
              <button className="w-full flex items-center justify-center gap-2 bg-[#ed874a] hover:bg-[#d76f32] text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg hover:shadow-xl">
                <RefreshCw className="w-5 h-5" />
                {isExpired ? 'Renew Membership Now' : 'Renew Early'}
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Subtle Top Edge */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent to-transparent ${
        isExpired ? 'via-red-400/50' : isExpiringSoon ? 'via-amber-400/50' : 'via-[#ed874a]/30'
      }`}></div>
    </div>
  )
}
