'use client';

import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

export default function AffiliatePendingPayment() {
  const router = useRouter();

  const handleAccessMarketplace = () => {
    router.push('/dashboard/affiliate');
  };

  const handleAddBankDetails = () => {
    router.push('/dashboard/affiliate/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-orange-100 p-8 text-center">
        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Phone illustration with money symbols */}
            <div className="w-48 h-48 bg-gradient-to-br from-orange-100 via-orange-50 to-orange-100 rounded-full flex items-center justify-center relative">
              <div className="w-32 h-40 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-[#ed874a] relative">
                <div className="text-4xl">📱</div>
                {/* Money symbols floating around */}
                <div className="absolute -top-4 -right-4 text-2xl animate-bounce">💰</div>
                <div className="absolute -bottom-2 -left-4 text-xl animate-pulse">💵</div>
                <div className="absolute top-0 -left-6 text-lg animate-bounce delay-100">❤️</div>
                <div className="absolute -top-2 right-8 text-xl animate-pulse delay-200">💸</div>
              </div>
              {/* Decorative elements */}
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#ed874a] rounded-full opacity-20"></div>
              <div className="absolute bottom-4 right-0 w-20 h-20 bg-orange-400 rounded-full opacity-30"></div>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          You don&apos;t have an affiliate link yet
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Discover the world of affiliate marketing and find a variety of digital products to promote and earn money or give a creator your email to become their affiliate.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4 max-w-md mx-auto">
          {/* Add Bank Details Button */}
          <button
            onClick={handleAddBankDetails}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#ed874a] text-[#ed874a] rounded-lg hover:bg-orange-50 hover:border-orange-600 transition-all duration-200 font-medium"
          >
            <Building2 className="w-5 h-5" />
            Add bank details
          </button>

          {/* Access Marketplace Button */}
          <button
            onClick={handleAccessMarketplace}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#ed874a] to-orange-500 text-white rounded-lg hover:from-orange-600 hover:to-orange-600 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Access Affiliate marketplace
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-orange-100">
          <p className="text-sm text-gray-500">
            Complete your payment to unlock your affiliate dashboard and start earning commissions.
          </p>
        </div>
      </div>
    </div>
  );
}
