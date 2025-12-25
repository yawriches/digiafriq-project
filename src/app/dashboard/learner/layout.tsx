'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus';
import LearnerDashboardLayout from '@/components/dashboard/LearnerDashboardLayout';
import { Loader2 } from 'lucide-react';

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasLearnerMembership, loading } = useMembershipStatus();

  // Membership and checkout pages should always be accessible
  const isMembershipPage = pathname === '/dashboard/learner/membership';
  const isCheckoutPage = pathname?.startsWith('/dashboard/learner/membership/checkout');
  const isCoursePlayerPage = pathname?.startsWith('/dashboard/learner/courses/') && pathname !== '/dashboard/learner/courses';
  const isPaymentRelatedPage = isMembershipPage || isCheckoutPage;

  useEffect(() => {
    // If user doesn't have learner membership and is not on payment-related pages, redirect to membership
    // Add a small delay to allow membership status to load after login
    const redirectTimer = setTimeout(() => {
      if (!loading && !hasLearnerMembership && !isPaymentRelatedPage) {
        console.log('🔄 Learner layout: No membership found, redirecting to membership page')
        router.push('/dashboard/learner/membership');
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(redirectTimer);
  }, [hasLearnerMembership, loading, isPaymentRelatedPage, router]);

  // Show simple loading state without dashboard layout to avoid double loaders
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#ed874a] mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have learner membership and tries to access non-payment pages, they'll be redirected by useEffect
  // Show simple redirect loading without dashboard layout
  if (!hasLearnerMembership && !isPaymentRelatedPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#ed874a] mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render checkout page without dashboard layout
  if (isCheckoutPage) {
    return <>{children}</>;
  }

  // Render course player page without dashboard layout (fullscreen experience)
  if (isCoursePlayerPage) {
    return <>{children}</>;
  }

  // Render other pages within dashboard layout
  return <LearnerDashboardLayout>{children}</LearnerDashboardLayout>;
}
