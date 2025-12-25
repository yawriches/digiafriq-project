'use client';

import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus';
import { useMembershipDetails } from '@/lib/hooks/useMembershipDetails';
import AffiliateDashboardLayout from '@/components/dashboard/AffiliateDashboardLayout';
import AffiliateRequiresLearnerMembership from '@/components/AffiliateRequiresLearnerMembership';
import { Loader2, Crown, Lock, TrendingUp, DollarSign, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';
import React, { useState, useEffect } from 'react';

interface AffiliateLayoutProps {
  children: React.ReactNode;
}

const AffiliateLayout: React.FC<AffiliateLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { hasLearnerMembership, hasAffiliateMembership, loading: membershipLoading } = useMembershipStatus();
  const { hasDCS, loading: dcsLoading } = useMembershipDetails();
  const [affiliatePackageId, setAffiliatePackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch affiliate packages
  useEffect(() => {
    const fetchAffiliatePackages = async () => {
      try {
        const response = await fetch('/api/memberships?member_type=affiliate')
        if (response.ok) {
          const data = await response.json()
          // Use the first available affiliate package (like learner membership page does)
          const affiliatePackages = data.packages || []
          if (affiliatePackages.length > 0) {
            setAffiliatePackageId(affiliatePackages[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch affiliate packages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliatePackages()
  }, [])

  const handleUpgradeClick = () => {
    if (affiliatePackageId) {
      // Go directly to checkout for the $7 package
      router.push(`/dashboard/learner/membership/checkout?membershipId=${affiliatePackageId}&upgrade=true`);
    } else {
      // Fallback to membership page if package not found
      router.push('/dashboard/learner/membership');
    }
  };

  // Show simple loading state without dashboard layout to avoid double loaders
  if (membershipLoading || loading || dcsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#ed874a] mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // First check: User must have learner membership to access affiliate features
  if (!hasLearnerMembership) {
    return (
      <AffiliateDashboardLayout>
        <AffiliateRequiresLearnerMembership />
      </AffiliateDashboardLayout>
    );
  }

  // Second check: If user has learner membership but no DCS addon, show locked page
  if (hasLearnerMembership && !hasDCS) {
    return (
      <AffiliateDashboardLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Main Locked Card */}
            <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-3xl shadow-2xl border-2 border-gray-200 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-[#ed874a] to-orange-500 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Affiliate Access Locked
                  </h1>
                  <p className="text-white/90 text-lg max-w-2xl mx-auto">
                    Unlock the Digital Cashflow Program to access all affiliate features
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8 md:p-12">
                {/* What You'll Unlock */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    What You'll Unlock
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-[#ed874a] transition-all">
                      <div className="w-12 h-12 bg-[#ed874a]/10 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6 text-[#ed874a]" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">Earn 80% Commission</h3>
                      <p className="text-sm text-gray-600">
                        Get 80% upfront commission + 20% recurring yearly on every sale
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-[#ed874a] transition-all">
                      <div className="w-12 h-12 bg-[#ed874a]/10 rounded-xl flex items-center justify-center mb-4">
                        <DollarSign className="w-6 h-6 text-[#ed874a]" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">Affiliate Dashboard</h3>
                      <p className="text-sm text-gray-600">
                        Track earnings, referrals, and performance in real-time
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-[#ed874a] transition-all">
                      <div className="w-12 h-12 bg-[#ed874a]/10 rounded-xl flex items-center justify-center mb-4">
                        <Award className="w-6 h-6 text-[#ed874a]" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">Promo Tools</h3>
                      <p className="text-sm text-gray-600">
                        Lifetime access to professional marketing materials
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 mb-8 border-2 border-[#ed874a]/20">
                  <div className="text-center">
                    <div className="inline-block bg-[#ed874a] text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                      🎉 Special Upgrade Price
                    </div>
                    <div className="mb-2">
                      <span className="text-5xl font-bold text-gray-900">$7</span>
                    </div>
                    <p className="text-gray-600 mb-6">
                      One-time payment • Lifetime access as long as membership is active
                    </p>
                    <Button
                      onClick={handleUpgradeClick}
                      size="lg"
                      className="bg-gradient-to-r from-[#ed874a] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white px-12 py-6 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Upgrade to Digital Cashflow – $7
                    </Button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    ✓ Instant access after payment • ✓ No recurring fees • ✓ Lifetime promo tools
                  </p>
                  <p className="text-xs text-gray-400">
                    Affiliate access is locked. To unlock the Digital Cashflow Program and all affiliate features, please upgrade to Digital Cashflow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AffiliateDashboardLayout>
    );
  }

  // Otherwise, render the requested page within dashboard layout (user has DCS addon)
  return <AffiliateDashboardLayout>{children}</AffiliateDashboardLayout>;
}

export default AffiliateLayout;
