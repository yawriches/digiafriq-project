'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { useSWR, supabaseFetcher, swrDefaults } from '@/lib/hooks/swr';

interface MembershipStatus {
  hasLearnerMembership: boolean;
  hasAffiliateMembership: boolean;
  hasLifetimeAffiliateAccess: boolean;
  activeMemberships: Array<{
    id: string;
    membershipName: string;
    membershipType: 'learner' | 'affiliate';
    expiresAt: string;
    isActive: boolean;
    isLifetimeAccess?: boolean;
  }>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMembershipStatus(): MembershipStatus {
  const { user, loading: authLoading, session } = useAuth();
  const isAuthReady = !authLoading;
  const hasSession = !!session;
  const shouldFetch = isAuthReady && !!user && hasSession;
  const key = user?.id ? ['membership-status', user.id] : null

  const fetcher = useCallback(async () => {
    if (!user) {
      return {
        hasLearnerMembership: false,
        hasAffiliateMembership: false,
        hasLifetimeAffiliateAccess: false,
        activeMemberships: [],
      }
    }

    return supabaseFetcher(String(key), async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as any;

      const { data: memberships, error } = await supabase
        .from('user_memberships')
        .select(`
          id,
          is_active,
          expires_at,
          affiliate_lifetime_access,
          membership_packages (
            id,
            name,
            member_type
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true) as any;

      if (error) {
        throw error
      }

      const activeMemberships = (memberships || []).filter((m: any) => {
        const isActive = m.is_active;
        const isExpired = new Date(m.expires_at) <= new Date();
        const isLifetimeAccess = m.affiliate_lifetime_access;
        return isActive && (!isExpired || isLifetimeAccess);
      }).map((m: any) => ({
        id: m.id,
        membershipName: m.membership_packages?.name || 'Unknown',
        membershipType: m.membership_packages?.member_type || 'learner',
        expiresAt: m.expires_at,
        isActive: m.is_active,
        isLifetimeAccess: m.affiliate_lifetime_access || false
      }));

      const hasLearnerMembership = activeMemberships.some((m: any) =>
        m.membershipType === 'learner' && (m.isLifetimeAccess || new Date(m.expiresAt) > new Date())
      );

      const hasAffiliateMembership = activeMemberships.some((m: any) =>
        m.membershipType === 'affiliate' && (m.isLifetimeAccess || new Date(m.expiresAt) > new Date())
      ) || profile?.role === 'affiliate';

      const hasLifetimeAffiliateAccess = activeMemberships.some((m: any) =>
        m.membershipType === 'affiliate' && m.isLifetimeAccess
      );

      return {
        hasLearnerMembership,
        hasAffiliateMembership,
        hasLifetimeAffiliateAccess,
        activeMemberships,
      }
    })
  }, [key, user])

  const { data, error, isLoading, mutate } = useSWR(shouldFetch ? key : null, fetcher, {
    ...swrDefaults,
    revalidateOnFocus: true,
  })

  const loading = (() => {
    if (!isAuthReady) return true;
    if (!user) return false;
    if (!hasSession) return true;
    return !data && isLoading;
  })();

  return {
    hasLearnerMembership: data?.hasLearnerMembership ?? false,
    hasAffiliateMembership: data?.hasAffiliateMembership ?? false,
    hasLifetimeAffiliateAccess: data?.hasLifetimeAffiliateAccess ?? false,
    activeMemberships: data?.activeMemberships ?? [],
    loading,
    error: error ? (error as any).message ?? String(error) : null,
    refresh: async () => {
      await mutate()
    },
  };
}
