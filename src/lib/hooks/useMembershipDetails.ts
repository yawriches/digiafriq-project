'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

interface MembershipDetails {
  hasDCS: boolean;
  expiryDate: string | null;
  loading: boolean;
}

export function useMembershipDetails(): MembershipDetails {
  const { user } = useAuth();
  const [details, setDetails] = useState<MembershipDetails>({
    hasDCS: false,
    expiryDate: null,
    loading: true,
  });

  useEffect(() => {
    const fetchMembershipDetails = async () => {
      if (!user) {
        setDetails({ hasDCS: false, expiryDate: null, loading: false });
        return;
      }

      try {
        // Get active learner membership
        const { data: membership, error } = await supabase
          .from('user_memberships')
          .select('expires_at, has_digital_cashflow_addon')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as { data: { expires_at: string | null; has_digital_cashflow_addon: boolean } | null; error: any };

        if (error) {
          console.error('Error fetching membership details:', error);
          setDetails({ hasDCS: false, expiryDate: null, loading: false });
          return;
        }

        // No membership found is not an error - user just doesn't have one yet
        setDetails({
          hasDCS: membership?.has_digital_cashflow_addon || false,
          expiryDate: membership?.expires_at || null,
          loading: false,
        });
      } catch (err) {
        console.error('Unexpected error:', err);
        setDetails({ hasDCS: false, expiryDate: null, loading: false });
      }
    };

    fetchMembershipDetails();
  }, [user]);

  return details;
}
