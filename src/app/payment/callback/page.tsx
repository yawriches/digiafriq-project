'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'error';

interface PaymentVerification {
  status: PaymentStatus;
  membershipType?: 'learner' | 'affiliate';
  membershipName?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  isAddonUpgrade?: boolean;
}

function PaymentCallbackPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshProfile } = useAuth();

  // Add unique instance ID for debugging
  const [instanceId] = useState(() => Math.random().toString(36).substr(2, 9));
  console.log('🔥 Component instance ID:', instanceId);

  const [verification, setVerification] = useState<PaymentVerification>({
    status: 'verifying'
  });

  // Add flag to track if verification is already running
  const verificationInProgressRef = useRef(false); // Track if verification is already running

  // Track whether we've already attempted verification
  const hasAttemptedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RETRIES = 3;
  const retryCountRef = useRef(0);

  const verifyPayment = async (userId?: string) => {
    // Prevent duplicate verification calls
    if (verificationInProgressRef.current || hasAttemptedRef.current) {
      return;
    }
    
    verificationInProgressRef.current = true;
    hasAttemptedRef.current = true;
    
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    const paymentRef = reference || trxref;

    if (!paymentRef) {
      setVerification({ status: 'error' });
      toast.error('No payment reference found');
      verificationInProgressRef.current = false;
      return;
    }

    // Retry loop with exponential backoff
    while (retryCountRef.current <= MAX_RETRIES) {
      const attempt = retryCountRef.current + 1;
      try {
        console.log(`Verifying payment (attempt ${attempt}/${MAX_RETRIES + 1}) with reference:`, paymentRef, 'user_id:', userId);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: paymentRef,
            user_id: userId
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        console.log('Payment verification response:', data);

        if (data.success && data.payment) {
          const isAddonUpgrade = data.payment.payment_type === 'addon_upgrade';

          const { data: membershipData, error: membershipError } = await supabase
            .from('membership_packages')
            .select('name, member_type, price, currency')
            .eq('id', data.payment.membership_package_id)
            .single();

          if (membershipError) {
            console.error('Error fetching membership details:', membershipError);
          }

          setVerification({
            status: 'success',
            membershipType: (membershipData as any)?.member_type,
            membershipName: (membershipData as any)?.name,
            amount: data.payment.amount,
            currency: data.payment.currency,
            reference: paymentRef,
            isAddonUpgrade
          });

          if (isAddonUpgrade) {
            toast.success('Digital Cashflow System unlocked!');
          } else {
            toast.success('Payment verified successfully!');
          }

          // Refresh user profile if user is available
          try { await refreshProfile(); } catch (e) { /* ignore if no session */ }

          // Redirect after 3 seconds
          setTimeout(() => {
            if (isAddonUpgrade) {
              router.push('/dashboard/learner/membership');
            } else {
              redirectToAppropriateDashboard((membershipData as any)?.member_type || 'learner');
            }
          }, 3000);

          verificationInProgressRef.current = false;
          return; // Success — exit
        }

        // Non-success response from API (e.g. provider couldn't confirm yet)
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000);
          console.log(`⏳ Verification attempt ${attempt} returned non-success, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // All retries exhausted
        setVerification({ status: 'failed' });
        toast.error(data.message || 'Payment verification failed. If you made a payment, please contact support.');
        verificationInProgressRef.current = false;
        return;

      } catch (error) {
        console.error(`Payment verification error (attempt ${attempt}):`, error);

        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000);
          console.log(`⏳ Network error, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // All retries exhausted
        setVerification({ status: 'error' });
        toast.error('Failed to verify payment. Please check your connection and try again.');
        verificationInProgressRef.current = false;
        return;
      }
    }
  };

  useEffect(() => {
    if (verification.status !== 'verifying' || hasAttemptedRef.current) return;

    // If user is already available, verify immediately
    if (user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      verifyPayment(user.id);
      return;
    }

    // If user is not yet available, wait up to 5 seconds then verify without user_id
    // The backend can still find the payment by reference alone
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (!hasAttemptedRef.current) {
          console.log('⏰ Auth timeout - verifying payment without user_id');
          verifyPayment(undefined);
        }
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [user]); // Only depend on user

  const redirectToAppropriateDashboard = (membershipType: 'learner' | 'affiliate') => {
    if (membershipType === 'affiliate') {
      router.push('/dashboard/affiliate');
    } else {
      router.push('/dashboard/learner');
    }
  };

  const handleRetry = () => {
    retryCountRef.current = 0;
    hasAttemptedRef.current = false;
    verificationInProgressRef.current = false;
    setVerification({ status: 'verifying' });
    // Re-trigger verification
    if (user) {
      verifyPayment(user.id);
    } else {
      verifyPayment(undefined);
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard/learner/membership');
  };

  const renderVerificationContent = () => {
    switch (verification.status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="w-16 h-16 text-orange-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h2>
            <div className="bg-green-50/50 border border-green-200/70 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-700 mb-2">
                {verification.isAddonUpgrade ? '🎉 Digital Cashflow System Unlocked!' : `${verification.membershipName} Activated`}
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                {!verification.isAddonUpgrade && (
                  <p><strong>Type:</strong> {verification.membershipType?.charAt(0).toUpperCase()}{verification.membershipType?.slice(1)} Membership</p>
                )}
                <p><strong>Amount:</strong> {verification.currency} {verification.amount}</p>
                <p><strong>Reference:</strong> {verification.reference}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              {verification.isAddonUpgrade 
                ? 'Redirecting you to your membership page...'
                : `Redirecting you to your ${verification.membershipType} dashboard...`
              }
            </p>
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              </div>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't verify your payment. This might be due to a cancelled transaction or payment processing issue.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-[#ed874a] to-orange-500 text-white rounded-lg hover:from-orange-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Retry Verification
              </button>
              <button
                onClick={handleGoHome}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Memberships
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Error
            </h2>
            <p className="text-gray-600 mb-6">
              An error occurred while verifying your payment. Please contact support if this persists.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-[#ed874a] to-orange-500 text-white rounded-lg hover:from-orange-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Try Again
              </button>
              <button
                onClick={handleGoHome}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Memberships
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
    <div className="max-w-md w-full">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-orange-100 p-8">
        {renderVerificationContent()}
      </div>
      
      {/* Support Info */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Need help? Contact{' '}
          <a href="mailto:support@digiafriq.com" className="text-orange-600 hover:underline">
            support@digiafriq.com
          </a>
        </p>
      </div>
    </div>
  </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCallbackPageInner />
    </Suspense>
  )
}
