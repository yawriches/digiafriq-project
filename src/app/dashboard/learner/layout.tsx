'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const lastCheckedPath = useRef<string | null>(null);

  const checkMembership = useCallback(async (userId: string, currentPath: string) => {
    const { count } = await supabase
      .from('user_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    const hasActive = (count ?? 0) > 0;
    setHasActiveMembership(hasActive);
    setMembershipChecked(true);
    lastCheckedPath.current = currentPath;

    // Immediate redirect if no active membership (don't wait for useEffect)
    const isMembership = currentPath === '/dashboard/learner/membership';
    const isCheckout = currentPath?.startsWith('/dashboard/learner/membership/checkout');
    if (!hasActive && !isMembership && !isCheckout) {
      setIsRedirecting(true);
      window.location.href = '/dashboard/learner/membership';
    }
  }, []);

  // Re-check membership on every pathname change (navigation)
  useEffect(() => {
    if (authLoading || !user) return;
    if (isRedirecting) return;
    
    // Always re-check if path changed
    if (lastCheckedPath.current !== pathname) {
      setHasActiveMembership(false);
      setMembershipChecked(false);
      checkMembership(user.id, pathname);
    }
  }, [user, authLoading, pathname, checkMembership, isRedirecting]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(pathname)}`;
    }
  }, [user, authLoading, pathname]);

  const isMembershipPage = pathname === '/dashboard/learner/membership';
  const isCheckoutPage = pathname?.startsWith('/dashboard/learner/membership/checkout');
  const isPaymentRelatedPage = isMembershipPage || isCheckoutPage;

  // Admin users can access learner dashboard without membership check
  const isAdmin = profile?.role === 'admin';

  // While checking membership or redirecting, show skeleton (never show content)
  if ((isRedirecting || !membershipChecked || authLoading) && !isPaymentRelatedPage) {
    return (
      <LearnerDashboardLayout>
        <LearnerDashboardSkeleton />
      </LearnerDashboardLayout>
    );
  }

  // Block users without active membership from ALL pages (backup for redirect)
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
