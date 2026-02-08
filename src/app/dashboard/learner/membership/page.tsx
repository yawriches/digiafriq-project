'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { MembershipCard } from '@/components/dashboard/MembershipCard'
import { PremiumMembershipCard } from '@/components/dashboard/PremiumMembershipCard'
import { Loader2, ShieldCheck, BookOpen, TrendingUp, RefreshCw } from 'lucide-react'

interface MembershipPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_months: number;
  member_type: 'learner' | 'affiliate';
  is_active: boolean;
  features: string[];
  created_at: string;
}

export default function LearnerMembershipPage() {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<MembershipPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Direct membership status check (no SWR caching)
  const [hasActiveMembership, setHasActiveMembership] = useState(false)
  const [isRenewal, setIsRenewal] = useState(false)
  const [expiredDate, setExpiredDate] = useState<string | null>(null)
  const [activeExpiryDate, setActiveExpiryDate] = useState<string | null>(null)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)

  // Renewal price override
  const RENEWAL_PRICE = 10

  const handleSelect = useCallback((id: string) => {
    if (isRenewal) {
      window.location.href = `/checkout/${id}?renewal=true`
    } else {
      window.location.href = `/checkout/${id}`
    }
  }, [isRenewal])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        // Fetch membership packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('member_type', 'learner')
          .eq('is_active', true)
          .order('price')

        if (packagesError) {
          console.error('Error fetching memberships:', packagesError)
          setError('Error loading memberships')
          setLoading(false)
          return
        }
        setMemberships(packagesData || [])

        // Check for active (non-expired) membership
        const { count: activeCount } = await supabase
          .from('user_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        const hasActive = (activeCount ?? 0) > 0

        // If active, get the expiry date
        if (hasActive) {
          const result = await supabase
            .from('user_memberships')
            .select('expires_at')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1)
            .single()
          const activeMembership = result.data as { expires_at: string } | null

          if (activeMembership) {
            setActiveExpiryDate(activeMembership.expires_at)
            const days = Math.ceil((new Date(activeMembership.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            setDaysRemaining(days)
            setIsExpiringSoon(days > 0 && days <= 7)
            // If expiring soon, treat as renewal eligible
            setHasActiveMembership(days > 7)
            setIsRenewal(days <= 7)
          } else {
            setHasActiveMembership(true)
            setIsRenewal(false)
          }
        } else {
          // No active membership - check for expired membership (renewal case)
          const { data: expiredMembership } = await supabase
            .from('user_memberships')
            .select('expires_at')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .lte('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          setHasActiveMembership(false)
          if (expiredMembership) {
            // User had a membership that expired - this is a renewal
            setIsRenewal(true)
            setExpiredDate(expiredMembership.expires_at)
          } else {
            // User never had a membership - new user
            setIsRenewal(false)
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error loading memberships')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Loading memberships...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>
  }

  return (
    <div className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Show Premium Card if user has active membership (not expiring soon) */}
        {hasActiveMembership ? (
          <div>
            <div className="space-y-4 text-center mb-8">
              <h1 className="text-3xl font-bold">Your Membership</h1>
              <p className="text-lg text-muted-foreground">
                Manage your active membership
              </p>
            </div>
            <PremiumMembershipCard 
              expiryDate={activeExpiryDate!}
            />
          </div>
        ) : isRenewal ? (
          /* Show Renewal UI for expired or expiring-soon members */
          <>
            <div className="space-y-4 text-center">
              <h1 className="text-3xl font-bold text-gray-900">Renew Your Membership</h1>
              <p className="text-lg text-muted-foreground">
                {expiredDate ? (
                  <>
                    Your membership expired on{' '}
                    <span className="font-semibold text-red-600">
                      {new Date(expiredDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </>
                ) : isExpiringSoon ? (
                  <>
                    Your membership expires in{' '}
                    <span className="font-semibold text-amber-600">
                      {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
                    </span>
                    {' — '}renew now at a discounted rate!
                  </>
                ) : (
                  <>Renew your membership to continue access</>
                )}
              </p>
            </div>

            {/* Data Preservation Notice */}
            <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800 text-lg">Your data is safe</h3>
                  <p className="text-green-700 text-sm mt-1">
                    All your course progress, earnings, credentials, and settings are preserved. 
                    Renew to regain full access immediately.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-green-100">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">Course progress saved</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-green-100">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">Earnings preserved</span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-green-100">
                  <RefreshCw className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800 font-medium">Instant reactivation</span>
                </div>
              </div>
            </div>

            {/* Membership packages for renewal */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {memberships?.map((membership) => (
                <MembershipCard
                  key={membership.id}
                  membership={membership}
                  onSelect={handleSelect}
                  isRenewal
                  renewalPrice={RENEWAL_PRICE}
                />
              ))}
            </div>
          </>
        ) : (
          /* Show Membership Selection if no active membership (first-time) */
          <>
            <div className="space-y-4 text-center">
              <h1 className="text-3xl font-bold">Get Started with AI Cashflow</h1>
              <p className="text-lg text-muted-foreground">
                Join the AI Cashflow Program and unlock all features
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {memberships?.map((membership) => (
                <MembershipCard
                  key={membership.id}
                  membership={membership}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
