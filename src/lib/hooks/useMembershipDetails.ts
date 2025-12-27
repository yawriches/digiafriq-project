'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';
import { useSWR, supabaseFetcher, swrDefaults } from '@/lib/hooks/swr';

interface MembershipDetails {
  hasDCS: boolean;
  expiryDate: string | null;
  loading: boolean;
}

export function useMembershipDetails(): MembershipDetails {
  const { user } = useAuth();
  const key = user?.id ? ['membership-details', user.id] : null

  const fetcher = useCallback(async () => {
    if (!user) {
      return { hasDCS: false, expiryDate: null }
    }

    return supabaseFetcher(String(key), async () => {
      const { data: membership, error } = await supabase
        .from('user_memberships')
        .select('expires_at, has_digital_cashflow_addon')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: { expires_at: string | null; has_digital_cashflow_addon: boolean } | null; error: any };

      if (error) {
        throw error
      }

      return {
        hasDCS: membership?.has_digital_cashflow_addon || false,
        expiryDate: membership?.expires_at || null,
      }
    })
  }, [key, user])

  const { data, error, isLoading } = useSWR(key, fetcher, {
    ...swrDefaults,
    revalidateOnFocus: true,
  })

  return {
    hasDCS: data?.hasDCS ?? false,
    expiryDate: data?.expiryDate ?? null,
    loading: !data && isLoading,
  };
}
