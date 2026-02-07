'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
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
  const { user, profile, loading: authLoading } = useAuth();

  // Direct membership check — no SWR, no caching, fresh on every navigation
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);

  const checkMembership = useCallback(async (userId: string) => {
    const { count } = await supabase
      .from('user_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    setHasActiveMembership((count ?? 0) > 0);
    setMembershipChecked(true);
  }, []);

  // Re-check membership on every pathname change (navigation)
  useEffect(() => {
    if (authLoading || !user) return;
    setMembershipChecked(false);
    checkMembership(user.id);
  }, [user, authLoading, pathname, checkMembership]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, pathname]);

  const isMembershipPage = pathname === '/dashboard/learner/membership';
  const isCheckoutPage = pathname?.startsWith('/dashboard/learner/membership/checkout');
  const isPaymentRelatedPage = isMembershipPage || isCheckoutPage;

  // Admin users can access learner dashboard without membership check
  const isAdmin = profile?.role === 'admin';

  // Redirect users without active membership to membership page
  useEffect(() => {
    if (membershipChecked && !isAdmin && !hasActiveMembership && !isPaymentRelatedPage) {
      router.replace('/dashboard/learner/membership');
    }
  }, [membershipChecked, hasActiveMembership, isPaymentRelatedPage, isAdmin, router]);

  // While checking membership, show skeleton (never show content)
  if ((!membershipChecked || authLoading) && !isPaymentRelatedPage) {
    return (
      <LearnerDashboardLayout>
        <LearnerDashboardSkeleton />
      </LearnerDashboardLayout>
    );
  }

  // Block users without active membership from ALL pages
  if (!hasActiveMembership && !isPaymentRelatedPage && !isAdmin) {
    return (
      <LearnerDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#ed874a] mx-auto mb-3" />
            <p className="text-gray-500">Redirecting to membership page...</p>
          </div>
        </div>
      </LearnerDashboardLayout>
    );
  }

  if (isCheckoutPage) {
    return <>{children}</>;
  }

  return <LearnerDashboardLayout>{children}</LearnerDashboardLayout>;
}
