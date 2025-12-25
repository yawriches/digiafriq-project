'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth';

interface LearnerPaymentStatus {
  hasPaid: boolean;
  paymentDate: string | null;
  paymentAmount: number | null;
  paymentReference: string | null;
  loading: boolean;
  error: string | null;
}

export function useLearnerPaymentStatus(): LearnerPaymentStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<LearnerPaymentStatus>({
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
        const { data, error } = await supabase
          .from('profiles')
          .select('learner_has_paid, learner_payment_date, learner_payment_amount, learner_payment_reference')
          .eq('id', user.id)
          .maybeSingle() as { 
            data: { 
              learner_has_paid: boolean; 
              learner_payment_date: string | null; 
              learner_payment_amount: number | null; 
              learner_payment_reference: string | null; 
            } | null; 
            error: any 
          };

        // If error and it's not a "no rows" error, log it
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching learner payment status:', error);
          setStatus({
            hasPaid: false,
            paymentDate: null,
            paymentAmount: null,
            paymentReference: null,
            loading: false,
            error: error.message,
          });
          return;
        }

        // If no data (user doesn't exist), treat as unpaid
        if (!data) {
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

        // User exists, return payment status
        setStatus({
          hasPaid: data.learner_has_paid || false,
          paymentDate: data.learner_payment_date || null,
          paymentAmount: data.learner_payment_amount || null,
          paymentReference: data.learner_payment_reference || null,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Unexpected error fetching learner payment status:', err);
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
