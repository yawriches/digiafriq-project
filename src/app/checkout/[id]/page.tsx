'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Image from 'next/image';

// Currency conversion rates (Dec 2024) - rate = 1 USD in local currency
const CURRENCY_RATES = {
  USD: { rate: 1, symbol: '$', name: 'US Dollar' },
  GHS: { rate: 10.0, symbol: '₵', name: 'Ghanaian Cedi' },
  NGN: { rate: 888.89, symbol: '₦', name: 'Nigerian Naira' },
  KES: { rate: 129.44, symbol: 'KSh', name: 'Kenyan Shilling' },
  ZAR: { rate: 17.22, symbol: 'R', name: 'South African Rand' },
  XOF: { rate: 561.11, symbol: 'CFA', name: 'West African CFA Franc' },
  XAF: { rate: 561.11, symbol: 'XAF', name: 'Central African CFA Franc' },
} as const;

type Currency = keyof typeof CURRENCY_RATES;
type PaymentProvider = 'paystack' | 'kora';

// Profile data type
interface UserProfile {
  full_name?: string;
  country?: string;
  phone?: string;
}

// Comprehensive country-to-currency mapping
const getCountryCurrency = (country: string): Currency => {
  const countryLower = country.toLowerCase().trim();
  
  const countryCurrencyMap: Record<string, Currency> = {
    'ghana': 'GHS',
    'kenya': 'KES',
    'nigeria': 'NGN',
    'south africa': 'ZAR',
    'united states': 'USD',
    'usa': 'USD',
    'america': 'USD',
    'benin': 'XOF',
    'burkina faso': 'XOF',
    'côte d\'ivoire': 'XOF',
    'ivory coast': 'XOF',
    'guinea-bissau': 'XOF',
    'mali': 'XOF',
    'niger': 'XOF',
    'senegal': 'XOF',
    'togo': 'XOF',
    'cameroon': 'XAF',
    'central african republic': 'XAF',
    'chad': 'XAF',
    'republic of the congo': 'XAF',
    'congo': 'XAF',
    'equatorial guinea': 'XAF',
    'gabon': 'XAF',
  };
  
  return countryCurrencyMap[countryLower] || 'USD';
};

// Payment provider availability by country
const getAvailableProviders = (country: string): PaymentProvider[] => {
  const countryLower = country.toLowerCase().trim();
  if (countryLower === 'ghana' || countryLower.includes('ghana')) {
    return ['paystack', 'kora'];
  }
  return ['kora'];
};

const getDefaultProvider = (country: string): PaymentProvider => {
  const providers = getAvailableProviders(country);
  return providers[0];
};

// Generate client-side payment hash for fraud prevention
const generatePaymentHash = (data: any): string => {
  const stringData = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < stringData.length; i++) {
    const char = stringData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

function CheckoutContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();
  const { hasLearnerMembership } = useMembershipStatus();

  const membershipId = params.id as string;
  const isUpgradeFlow = searchParams.get('upgrade') === 'true';

  // State
  const [membershipData, setMembershipData] = useState<any>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [allMemberships, setAllMemberships] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phoneNumber: '',
    country: '',
  });
  const [currency, setCurrency] = useState<Currency>('GHS');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('kora');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableProviders, setAvailableProviders] = useState<PaymentProvider[]>(['kora']);


  // Fetch membership data
  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!membershipId) return;
      
      try {
        const { data: allMembershipsData } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        setAllMemberships(allMembershipsData || []);
        
        const { data, error } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('id', membershipId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching membership:', error);
          toast.error('Membership package not found');
          router.push('/dashboard/learner/membership');
          return;
        }

        setMembershipData(data);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error('Failed to load membership data');
      } finally {
        setLoadingMembership(false);
      }
    };

    fetchMembershipData();
  }, [membershipId, router]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, country, phone')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            const profileData = data as { full_name?: string; country?: string; phone?: string };
            const userCountry = profileData.country || 'Ghana';
            const userCurrency = getCountryCurrency(userCountry);
            const providers = getAvailableProviders(userCountry);
            
            setFormData(prev => ({
              ...prev,
              fullName: profileData.full_name || '',
              email: user.email || '',
              phoneNumber: profileData.phone || '',
              country: userCountry
            }));
            setCurrency(userCurrency);
            setAvailableProviders(providers);
            setSelectedProvider(getDefaultProvider(userCountry));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.id, user?.email]);

  // Calculate upgrade pricing
  const upgradePricing = useMemo(() => {
    if (!membershipData || (!hasLearnerMembership && !isUpgradeFlow) || membershipData.member_type !== 'affiliate') {
      return null;
    }

    const learnerMembership = allMemberships.find(m => m.member_type === 'learner');
    if (!learnerMembership) return null;

    const upgradePrice = membershipData.price - learnerMembership.price;
    const isUpgrade = (isUpgradeFlow || hasLearnerMembership) && upgradePrice < membershipData.price && upgradePrice > 0;

    return {
      originalPrice: membershipData.price,
      learnerPrice: learnerMembership.price,
      upgradePrice,
      isUpgrade,
      savings: membershipData.price - upgradePrice
    };
  }, [membershipData, hasLearnerMembership, allMemberships, isUpgradeFlow]);

  // AI Cashflow is the single program - no add-ons needed
  const basePrice = upgradePricing?.isUpgrade ? upgradePricing.upgradePrice : membershipData?.price || 0;
  const actualPrice = basePrice;
  const convertedPrice = actualPrice * CURRENCY_RATES[currency].rate;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubscribe = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (!session) {
        toast.error('Session error. Please refresh the page.');
        setLoading(false);
        return;
      }

      const paymentHash = generatePaymentHash({
        membership_package_id: membershipId,
        user_id: user?.id || '',
        usd_price: actualPrice,
        provider: selectedProvider,
        timestamp: Date.now()
      });

      // All purchases are for AI Cashflow program
      const paymentData = {
        membership_package_id: membershipId,
        payment_type: 'membership',
        payment_provider: selectedProvider,
        metadata: {
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          country: formData.country,
          usd_price: actualPrice,
          original_price: membershipData?.price || 0,
          is_upgrade: upgradePricing?.isUpgrade || false,
          has_digital_cashflow_addon: true,
          payment_hash: paymentHash,
          timestamp: Date.now(),
        },
      };

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/initialize-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        toast.error(data.error || 'Payment initialization failed');
        throw new Error(data.error);
      }

      if (data.success && data.authorization_url) {
        toast.success('Redirecting to payment gateway...');
        window.location.href = data.authorization_url;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading states
  if (authLoading || loadingMembership) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ed874a] mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (!membershipData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Membership not found</p>
          <button 
            onClick={() => router.push('/dashboard/learner/membership')}
            className="mt-4 text-[#ed874a] hover:underline"
          >
            Go to memberships
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#ed874a] hover:text-orange-600"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <Image src="/digiafriqlogo.png" alt="DigiAfriq" width={130} height={30} className="h-auto" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Purchase</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Form */}
          <div className="space-y-6">
            {/* Provider Selection */}
            {availableProviders.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableProviders.includes('paystack') && (
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('paystack')}
                      className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                        selectedProvider === 'paystack'
                          ? 'border-[#ed874a] bg-orange-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {selectedProvider === 'paystack' && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-[#ed874a]" />
                        </div>
                      )}
                      <Image
                        src="/Paystack_idIi-h8rZ0_1.png"
                        alt="Paystack"
                        width={100}
                        height={32}
                        className="h-8 w-auto object-contain"
                      />
                      <span className="mt-2 font-semibold text-gray-900">Paystack</span>
                      <span className="text-xs text-gray-500">Cards, Bank, Mobile Money</span>
                    </button>
                  )}
                  {availableProviders.includes('kora') && (
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('kora')}
                      className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                        selectedProvider === 'kora'
                          ? 'border-[#ed874a] bg-orange-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {selectedProvider === 'kora' && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-[#ed874a]" />
                        </div>
                      )}
                      <Image
                        src="/kora.jpeg"
                        alt="Kora"
                        width={100}
                        height={32}
                        className="h-8 w-auto object-contain"
                      />
                      <span className="mt-2 font-semibold text-gray-900">Kora</span>
                      <span className="text-xs text-gray-500">Cards, Bank Transfer</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Billing Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                    {formData.country || 'Loading...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Summary */}
          <div>
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {upgradePricing?.isUpgrade ? 'Upgrade to Affiliate' : membershipData.name}
              </h2>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Features</h3>
                <ul className="space-y-2">
                  {(membershipData.features || []).map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[#ed874a] flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              
              {/* Pricing */}
              <div className="border-t pt-6 mb-6 space-y-2">
                {/* Show upgrade pricing if applicable */}
                {upgradePricing?.isUpgrade && !isUpgradeFlow && (
                  <>
                    <div className="flex justify-between text-gray-500">
                      <span>Original Price</span>
                      <span className="line-through">${upgradePricing.originalPrice}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Upgrade Discount</span>
                      <span>-${upgradePricing.savings}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>AI Cashflow Program</span>
                  <span>${actualPrice}</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {CURRENCY_RATES[currency].symbol}{convertedPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">≈ ${actualPrice} USD</div>
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#ed874a] to-orange-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#ed874a]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
