'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { MembershipCard } from '@/components/dashboard/MembershipCard'
import { PremiumMembershipCard } from '@/components/dashboard/PremiumMembershipCard'
import { useMembershipDetails } from '@/lib/hooks/useMembershipDetails'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  has_digital_cashflow?: boolean;
  digital_cashflow_price?: number;
}

export default function LearnerMembershipPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasDCS, expiryDate, loading: membershipLoading } = useMembershipDetails()
  const [memberships, setMemberships] = useState<MembershipPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(null)

  // Check if user has active membership
  const hasActiveMembership = !membershipLoading && expiryDate !== null

  const handleSelect = useCallback((id: string, withDigitalCashflow: boolean) => {
    window.location.href = `/checkout/${id}${withDigitalCashflow ? '?addon=digital-cashflow' : ''}`
  }, [])

  const handleUpgrade = useCallback(() => {
    // Navigate to checkout with $7 addon-only purchase
    if (activeMembershipId) {
      router.push(`/checkout/${activeMembershipId}?addon=digital-cashflow&upgrade=true`)
    }
  }, [activeMembershipId, router])

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const { data, error } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('member_type', 'learner')
          .eq('is_active', true)
          .order('price')

        if (error) {
          console.error('Error fetching memberships:', error)
          setError('Error loading memberships')
        } else {
          setMemberships(data || [])
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error loading memberships')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchMemberships()
    }
  }, [user])

  // Fetch active membership ID for upgrade
  useEffect(() => {
    const fetchActiveMembership = async () => {
      if (!user) return

      const { data } = await supabase
        .from('user_memberships')
        .select('membership_package_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: any }

      if (data?.membership_package_id) {
        setActiveMembershipId(data.membership_package_id)
      }
    }

    if (hasActiveMembership) {
      fetchActiveMembership()
    }
  }, [user, hasActiveMembership])

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
        {/* Show Premium Card if user has active membership */}
        {hasActiveMembership ? (
          <div>
            <div className="space-y-4 text-center mb-8">
              <h1 className="text-3xl font-bold">Your Membership</h1>
              <p className="text-lg text-muted-foreground">
                Manage your active membership
              </p>
            </div>
            <PremiumMembershipCard 
              hasDCS={hasDCS}
              expiryDate={expiryDate!}
              onUpgrade={!hasDCS ? handleUpgrade : undefined}
            />
          </div>
        ) : (
          /* Show Membership Selection if no active membership */
          <>
            <div className="space-y-4 text-center">
              <h1 className="text-3xl font-bold">Choose Your Membership</h1>
              <p className="text-lg text-muted-foreground">
                Select a plan that best fits your learning goals
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {memberships?.map((membership) => (
                <MembershipCard
                  key={membership.id}
                  membership={{
                    ...membership,
                    has_digital_cashflow: membership.has_digital_cashflow || false,
                    digital_cashflow_price: membership.digital_cashflow_price || 0
                  }}
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
