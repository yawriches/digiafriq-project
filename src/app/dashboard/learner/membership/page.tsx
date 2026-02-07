'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import { MembershipCard } from '@/components/dashboard/MembershipCard'
import { PremiumMembershipCard } from '@/components/dashboard/PremiumMembershipCard'
import { useMembershipDetails } from '@/lib/hooks/useMembershipDetails'
import { Loader2 } from 'lucide-react'

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
  const { expiryDate, loading: membershipLoading } = useMembershipDetails()
  const [memberships, setMemberships] = useState<MembershipPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user has active membership
  const hasActiveMembership = !membershipLoading && expiryDate !== null

  const handleSelect = useCallback((id: string) => {
    window.location.href = `/checkout/${id}`
  }, [])

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
              expiryDate={expiryDate!}
            />
          </div>
        ) : (
          /* Show Membership Selection if no active membership */
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
