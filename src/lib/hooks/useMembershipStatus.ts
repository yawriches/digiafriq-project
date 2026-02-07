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
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
  learnerExpiresAt: string | null;
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
        daysRemaining: null,
        isExpiringSoon: false,
        isExpired: false,
        learnerExpiresAt: null,
      }
    }

    return supabaseFetcher(String(key), async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as any;

      // Query 1: Only truly active memberships (not expired)
      // This matches the DB function pattern: is_active=true AND expires_at > NOW()
      const { data: activeMembershipsRaw, error: activeError } = await supabase
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
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString()) as any;

      // Query 2: Expired memberships (for renewal detection only)
      const { data: expiredMembershipsRaw } = await supabase
        .from('user_memberships')
        .select(`
          id,
          expires_at,
          affiliate_lifetime_access,
          membership_packages (
            id,
            name,
            member_type
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1) as any;

      if (activeError) {
        throw activeError
      }

      const activeMemberships = (activeMembershipsRaw || []).map((m: any) => ({
        id: m.id,
        membershipName: m.membership_packages?.name || 'Unknown',
        membershipType: m.membership_packages?.member_type || 'learner',
        expiresAt: m.expires_at,
        isActive: m.is_active,
        isLifetimeAccess: m.affiliate_lifetime_access || false
      }));

      const hasLearnerMembership = activeMemberships.some((m: any) =>
        m.membershipType === 'learner'
      );

      const hasAffiliateMembership = activeMemberships.some((m: any) =>
        m.membershipType === 'affiliate'
      ) || profile?.role === 'affiliate';

      const hasLifetimeAffiliateAccess = activeMemberships.some((m: any) =>
        m.membershipType === 'affiliate' && m.isLifetimeAccess
      );

      // Find the learner membership with the latest expiry (from active ones)
      const learnerMembership = activeMemberships
        .filter((m: any) => m.membershipType === 'learner')
        .sort((a: any, b: any) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime())[0]

      // Check for expired learner membership (for renewal detection)
      const expiredLearner = (expiredMembershipsRaw || []).find((m: any) =>
        m.membership_packages?.member_type === 'learner' && !m.affiliate_lifetime_access
      )

      // Use active learner expiry if available, otherwise expired learner expiry
      const learnerExpiresAt = learnerMembership?.expiresAt || expiredLearner?.expires_at || null
      let daysRemaining: number | null = null
      if (learnerExpiresAt) {
        daysRemaining = Math.ceil((new Date(learnerExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }

      const isExpired = !hasLearnerMembership && expiredLearner !== undefined
      const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7

      return {
        hasLearnerMembership,
        hasAffiliateMembership,
        hasLifetimeAffiliateAccess,
        activeMemberships,
        daysRemaining,
        isExpiringSoon,
        isExpired,
        learnerExpiresAt,
      }
    })
  }, [key, user])

  const { data, error, isLoading, mutate } = useSWR(shouldFetch ? key : null, fetcher, {
    ...swrDefaults,
    revalidateOnFocus: true,
    keepPreviousData: false,
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
    daysRemaining: data?.daysRemaining ?? null,
    isExpiringSoon: data?.isExpiringSoon ?? false,
    isExpired: data?.isExpired ?? false,
    learnerExpiresAt: data?.learnerExpiresAt ?? null,
    loading,
    error: error ? (error as any).message ?? String(error) : null,
    refresh: async () => {
      await mutate()
    },
  };
}
