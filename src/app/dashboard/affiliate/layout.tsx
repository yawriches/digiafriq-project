'use client';

import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus';
import AffiliateDashboardLayout from '@/components/dashboard/AffiliateDashboardLayout';
import AffiliateRequiresLearnerMembership from '@/components/AffiliateRequiresLearnerMembership';
import AffiliateOnboarding from '@/components/dashboard/AffiliateOnboarding';
import AffiliateTooltips from '@/components/dashboard/AffiliateTooltips';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import { AffiliateDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

interface AffiliateLayoutProps {
  children: React.ReactNode;
}

const AffiliateLayout: React.FC<AffiliateLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { hasLearnerMembership, loading: membershipLoading } = useMembershipStatus();
  const [isReadyToGate, setIsReadyToGate] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      const redirectUrl = `/login?redirectTo=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, pathname]);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await (supabase
          .from('profiles') as any)
          .select('affiliate_onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setOnboardingChecked(true);
          return;
        }

        // Show onboarding if not completed
        if (!data?.affiliate_onboarding_completed) {
          setShowOnboarding(true);
        } else {
          // Show tooltips for users who just completed onboarding
          setShowTooltips(true);
        }
        setOnboardingChecked(true);
      } catch (err) {
        console.error('Error checking onboarding:', err);
        setOnboardingChecked(true);
      }
    };

    if (user && hasLearnerMembership) {
      checkOnboarding();
    }
  }, [user, hasLearnerMembership]);

  useEffect(() => {
    // If membership check is loading, disable gating to avoid flashing the gate UI
    if (membershipLoading) {
      setIsReadyToGate(false)
      return
    }

    // Only enable gating once membership check is settled.
    setIsReadyToGate(true)
  }, [membershipLoading])

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setShowTooltips(true);
  }, []);

  // During route transitions / refetches, avoid flashing the gate UI.
  // Show a skeleton while membership is being confirmed.
  if (!isReadyToGate || (hasLearnerMembership && !onboardingChecked)) {
    return (
      <AffiliateDashboardLayout>
        <AffiliateDashboardSkeleton />
      </AffiliateDashboardLayout>
    );
  }

  // Check: User must have active membership (AI Cashflow) to access affiliate features
  // Since AI Cashflow is the single entry point, all paying users have affiliate access
  if (!hasLearnerMembership) {
    return (
      <AffiliateDashboardLayout>
        <AffiliateRequiresLearnerMembership />
      </AffiliateDashboardLayout>
    );
  }

  // Show onboarding overlay if not completed
  if (showOnboarding) {
    return <AffiliateOnboarding onComplete={handleOnboardingComplete} />;
  }

  // User has active membership and completed onboarding - render the affiliate dashboard
  return (
    <AffiliateDashboardLayout>
      {children}
      {showTooltips && <AffiliateTooltips />}
    </AffiliateDashboardLayout>
  );
}

export default AffiliateLayout;
