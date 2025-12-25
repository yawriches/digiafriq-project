'use client';

import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowRight, Sparkles, TrendingUp, Award, Users, Zap, CheckCircle2 } from 'lucide-react';

export default function AffiliateRequiresLearnerMembership() {
  const router = useRouter();

  const handleGoToMembership = () => {
    router.push('/dashboard/learner/membership');
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-xl w-full px-6">
        {/* Notice Card */}
        <div className="text-center">
          {/* Illustration */}
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
              <GraduationCap className="w-24 h-24 text-[#ed874a]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Learner Membership Required
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            To access affiliate features, you need an active learner membership first. This ensures you understand our platform and can authentically promote our courses.
          </p>



          {/* CTA Button */}
          <button
            onClick={handleGoToMembership}
            className="w-full max-w-md mx-auto px-8 py-4 bg-gradient-to-r from-[#ed874a] to-orange-500 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-600 transition-all duration-200"
          >
            Subscribe to Learner Membership
          </button>
        </div>
      </div>
    </div>
  );
}
