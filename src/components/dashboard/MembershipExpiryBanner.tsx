'use client'

import { AlertTriangle, Clock, RefreshCw, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus'

export function MembershipExpiryBanner() {
  const { isExpiringSoon, isExpired, daysRemaining } = useMembershipStatus()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || (!isExpiringSoon && !isExpired)) return null

  return (
    <div className={`mx-4 mt-4 mb-2 rounded-xl p-3 flex items-center gap-3 ${
      isExpired
        ? 'bg-red-50 border border-red-200'
        : 'bg-amber-50 border border-amber-200'
    }`}>
      {isExpired ? (
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
      ) : (
        <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
          {isExpired
            ? 'Your membership has expired'
            : `Membership expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
          }
        </p>
      </div>
      <Link
        href="/dashboard/learner/membership"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition flex-shrink-0 ${
          isExpired
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-amber-500 hover:bg-amber-600'
        }`}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Renew
      </Link>
      {!isExpired && (
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-400 hover:text-amber-600 transition flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
