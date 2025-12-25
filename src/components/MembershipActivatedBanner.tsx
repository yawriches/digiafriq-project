'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, X, Crown, Users } from 'lucide-react';
import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus';

interface MembershipActivatedBannerProps {
  onClose?: () => void;
}

export default function MembershipActivatedBanner({ onClose }: MembershipActivatedBannerProps) {
  const { activeMemberships, hasLearnerMembership, hasAffiliateMembership } = useMembershipStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [hasShownBanner, setHasShownBanner] = useState(false);

  useEffect(() => {
    // Check if we should show the banner (new membership activated)
    const checkForNewMembership = () => {
      const lastShown = localStorage.getItem('membership_banner_shown');
      const currentMemberships = activeMemberships.map(m => m.id).sort().join(',');
      
      if (currentMemberships && currentMemberships !== lastShown && !hasShownBanner) {
        setShowBanner(true);
        setHasShownBanner(true);
        localStorage.setItem('membership_banner_shown', currentMemberships);
      }
    };

    if (activeMemberships.length > 0) {
      // Small delay to ensure the page has loaded
      setTimeout(checkForNewMembership, 1000);
    }
  }, [activeMemberships, hasShownBanner]);

  const handleClose = () => {
    setShowBanner(false);
    onClose?.();
  };

  if (!showBanner || activeMemberships.length === 0) {
    return null;
  }

  const latestMembership = activeMemberships[activeMemberships.length - 1];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg p-6 relative animate-slide-in-right">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              🎉 Membership Activated!
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {latestMembership.membershipType === 'affiliate' ? (
                  <Crown className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {latestMembership.membershipName}
                </span>
              </div>
              
              <p className="text-sm text-white/90">
                {latestMembership.membershipType === 'affiliate' 
                  ? 'Welcome to the affiliate program! All affiliate features are now unlocked.'
                  : 'Welcome to the learner community! All courses and features are now available.'
                }
              </p>

              {/* Show available features */}
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-xs text-white/80 mb-2">Now available:</p>
                <div className="flex flex-wrap gap-1">
                  {latestMembership.membershipType === 'affiliate' ? (
                    <>
                      <span className="text-xs bg-white/20 rounded px-2 py-1">Affiliate Dashboard</span>
                      <span className="text-xs bg-white/20 rounded px-2 py-1">Commission Tracking</span>
                      <span className="text-xs bg-white/20 rounded px-2 py-1">Referral Links</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs bg-white/20 rounded px-2 py-1">All Courses</span>
                      <span className="text-xs bg-white/20 rounded px-2 py-1">Certificates</span>
                      <span className="text-xs bg-white/20 rounded px-2 py-1">Premium Support</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
