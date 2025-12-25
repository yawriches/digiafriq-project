'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

interface AffiliatePaymentStatus {
  hasPaid: boolean;
  paymentDate: string | null;
  paymentAmount: number | null;
  paymentReference: string | null;
  loading: boolean;
  error: string | null;
}

export function useAffiliatePaymentStatus(): AffiliatePaymentStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<AffiliatePaymentStatus>({
    hasPaid: false,
    paymentDate: null,
    paymentAmount: null,
    paymentReference: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchPaymentStatus() {
      if (!user) {
        setStatus({
          hasPaid: false,
          paymentDate: null,
          paymentAmount: null,
          paymentReference: null,
          loading: false,
          error: 'User not authenticated',
        });
        return;
      }

      try {
        console.log('🔍 Fetching affiliate payment status for user:', user.id);
        
        const { data, error } = await supabase
          .from('affiliate_profiles')
          .select('has_paid, payment_date, payment_amount, payment_reference')
          .eq('id', user.id)  // Changed from user_id to id
          .maybeSingle() as { 
            data: { 
              has_paid: boolean; 
              payment_date: string | null; 
              payment_amount: number | null; 
              payment_reference: string | null; 
            } | null; 
            error: any 
          };

        // If error and it's not a "no rows" error, log it
        if (error && error.code !== 'PGRST116') {
          console.warn('⚠️ Error fetching affiliate payment status:', {
            code: error?.code,
            message: error?.message,
          });
          setStatus({
            hasPaid: false,
            paymentDate: null,
            paymentAmount: null,
            paymentReference: null,
            loading: false,
            error: error?.message || 'Unknown error',
          });
          return;
        }

        // If no data (user doesn't have affiliate profile), treat as unpaid
        if (!data) {
          console.log('ℹ️ No affiliate profile found for user, treating as unpaid');
          setStatus({
            hasPaid: false,
            paymentDate: null,
            paymentAmount: null,
            paymentReference: null,
            loading: false,
            error: null,
          });
          return;
        }

        // User has affiliate profile, return payment status
        console.log('✅ Affiliate payment status fetched:', {
          hasPaid: data.has_paid,
          paymentDate: data.payment_date,
        });
        setStatus({
          hasPaid: data.has_paid || false,
          paymentDate: data.payment_date || null,
          paymentAmount: data.payment_amount || null,
          paymentReference: data.payment_reference || null,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.warn('⚠️ Exception fetching payment status:', err);
        setStatus({
          hasPaid: false,
          paymentDate: null,
          paymentAmount: null,
          paymentReference: null,
          loading: false,
          error: 'Failed to fetch payment status',
        });
      }
    }

    fetchPaymentStatus();
  }, [user]);

  return status;
}
