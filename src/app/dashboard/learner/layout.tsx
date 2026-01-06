'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus';
import { useAuth } from '@/lib/supabase/auth';
import LearnerDashboardLayout from '@/components/dashboard/LearnerDashboardLayout';
import { Loader2 } from 'lucide-react';
import { LearnerDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasLearnerMembership, loading } = useMembershipStatus();
  const { user, profile, loading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, pathname]);

  const isMembershipPage = pathname === '/dashboard/learner/membership';
  const isCheckoutPage = pathname?.startsWith('/dashboard/learner/membership/checkout');
  const isCoursePlayerPage = pathname?.startsWith('/dashboard/learner/courses/') && pathname !== '/dashboard/learner/courses';
  const isPaymentRelatedPage = isMembershipPage || isCheckoutPage;

  // Admin users can access learner dashboard without membership check
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      // Skip redirect for admin users
      if (isAdmin) return;
      
      if (!loading && !hasLearnerMembership && !isPaymentRelatedPage) {
        router.push('/dashboard/learner/membership');
      }
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [hasLearnerMembership, loading, isPaymentRelatedPage, isAdmin, router]);

  // While membership is being confirmed, never redirect or show gated content.
  // Render a skeleton placeholder to avoid a flash of the membership-required route.
  if (loading && !isPaymentRelatedPage) {
    return (
      <LearnerDashboardLayout>
        <LearnerDashboardSkeleton />
      </LearnerDashboardLayout>
    );
  }

  // Allow admin users to access without membership
  if (!hasLearnerMembership && !isPaymentRelatedPage && !isAdmin) {
    return <LearnerDashboardLayout>{children}</LearnerDashboardLayout>;
  }

  if (isCheckoutPage) {
    return <>{children}</>;
  }

  if (isCoursePlayerPage) {
    return <>{children}</>;
  }

  return <LearnerDashboardLayout>{children}</LearnerDashboardLayout>;
}
