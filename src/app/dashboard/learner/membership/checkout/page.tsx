'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { useMembershipStatus } from '@/lib/hooks/useMembershipStatus';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
  
  // Direct country name mapping
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
  
  return countryCurrencyMap[countryLower] || 'USD'; // Default to USD
};

// Payment provider availability by country
const getAvailableProviders = (country: string): PaymentProvider[] => {
  const countryLower = country.toLowerCase().trim();
  
  // Ghana uses Paystack only
  if (countryLower === 'ghana' || countryLower.includes('ghana')) {
    return ['paystack'];
  }
  
  // All other countries use Kora only
  return ['kora'];
};

// Get default provider for a country
const getDefaultProvider = (country: string): PaymentProvider => {
  const providers = getAvailableProviders(country);
  return providers[0]; // First provider is default
};

// Fraud prevention: Validate amount range
const validateAmount = (usdAmount: number): boolean => {
  const minAmount = 1; // $1 minimum
  const maxAmount = 10000; // $10,000 maximum
  return usdAmount >= minAmount && usdAmount <= maxAmount;
};

// Generate client-side payment hash for fraud prevention
const generatePaymentHash = (data: any): string => {
  const stringData = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < stringData.length; i++) {
    const char = stringData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const { hasLearnerMembership } = useMembershipStatus();

  // Get membership details from URL params
  const membershipId = searchParams.get('membershipId');
  const isUpgradeFlow = searchParams.get('upgrade') === 'true';

  // Redirect if no membership data
  if (!membershipId) {
    router.push('/dashboard/learner/membership');
    return null;
  }

  // State for membership data
  const [membershipData, setMembershipData] = useState<any>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [allMemberships, setAllMemberships] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phoneNumber: '',
    country: '',
  });

  const [currency, setCurrency] = useState<Currency>('GHS'); // Will be set based on user's country
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('kora'); // Default provider
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [availableProviders, setAvailableProviders] = useState<PaymentProvider[]>(['kora']);

  // Fetch membership data from database
  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!membershipId) return;
      
      console.log('🔍 Fetching membership with ID:', membershipId);
      
      try {
        // First test: can we read any membership packages?
        console.log('🧪 Testing database connection...');
        const { data: testData, error: testError } = await supabase
          .from('membership_packages')
          .select('id, name')
          .limit(3);
        
        console.log('🧪 Database test result:', { testData, testError });
        
        // Fetch all active memberships for upgrade pricing calculation
        const { data: allMembershipsData, error: allMembershipsError } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (allMembershipsError) {
          console.error('❌ Error fetching all memberships:', allMembershipsError);
        } else {
          setAllMemberships(allMembershipsData || []);
          console.log('📊 All memberships fetched:', allMembershipsData);
        }
        
        // Now fetch the specific membership
        const { data, error } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('id', membershipId)
          .eq('is_active', true)
          .single();

        console.log('📊 Database response:', { data, error });

        if (error) {
          console.error('❌ Error fetching membership:', error);
          toast.error(`Membership package not found: ${error.message}`);
          router.push('/dashboard/learner/membership');
          return;
        }

        setMembershipData(data);
        console.log('✅ Membership data fetched successfully:', data);
      } catch (error) {
        console.error('❌ Unexpected error fetching membership:', error);
        toast.error('Failed to load membership data');
      } finally {
        setLoadingMembership(false);
      }
    };

    fetchMembershipData();
  }, [membershipId, router]);

  // Calculate upgrade pricing
  const upgradePricing = useMemo(() => {
    if (!membershipData || (!hasLearnerMembership && !isUpgradeFlow) || membershipData.member_type !== 'affiliate') {
      return null;
    }

    const learnerMembership = allMemberships.find(m => m.member_type === 'learner');
    if (!learnerMembership) {
      console.warn('⚠️ Learner membership not found for upgrade calculation');
      return null;
    }

    const upgradePrice = membershipData.price - learnerMembership.price;
    const isUpgrade = (isUpgradeFlow || hasLearnerMembership) && upgradePrice < membershipData.price && upgradePrice > 0;

    console.log('💰 Upgrade pricing calculation:', {
      membershipName: membershipData.name,
      originalPrice: membershipData.price,
      learnerPrice: learnerMembership.price,
      upgradePrice,
      isUpgrade,
      isUpgradeFlow,
      hasLearnerMembership
    });

    return {
      originalPrice: membershipData.price,
      learnerPrice: learnerMembership.price,
      upgradePrice,
      isUpgrade,
      savings: membershipData.price - upgradePrice
    };
  }, [membershipData, hasLearnerMembership, allMemberships, isUpgradeFlow]);

  // Fetch user profile and set country
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          console.log('🔍 Fetching user profile for user:', user.id);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, country, phone')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            const profileData = data as { full_name?: string; country?: string; phone?: string };
            setUserProfile(profileData as UserProfile);
            const userCountry = profileData.country || 'Ghana';
            const userCurrency = getCountryCurrency(userCountry);
            const providers = getAvailableProviders(userCountry);
            const defaultProvider = getDefaultProvider(userCountry);
            
            setFormData(prev => ({
              ...prev,
              fullName: profileData.full_name || '',
              phoneNumber: profileData.phone || '',
              country: userCountry
            }));
            setCurrency(userCurrency);
            setAvailableProviders(providers);
            setSelectedProvider(defaultProvider);
            console.log('✅ User profile loaded:', { 
              country: userCountry, 
              currency: userCurrency, 
              providers, 
              defaultProvider 
            });
          } else {
            console.log('⚠️ No profile found, using defaults');
            // Fallback to default country and currency
            const defaultCountry = 'Ghana';
            const defaultCurrency = getCountryCurrency(defaultCountry);
            const providers = getAvailableProviders(defaultCountry);
            const defaultProvider = getDefaultProvider(defaultCountry);
            
            setFormData(prev => ({ ...prev, country: defaultCountry }));
            setCurrency(defaultCurrency);
            setAvailableProviders(providers);
            setSelectedProvider(defaultProvider);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to default country and currency
          const defaultCountry = 'Ghana';
          const defaultCurrency = getCountryCurrency(defaultCountry);
          const providers = getAvailableProviders(defaultCountry);
          const defaultProvider = getDefaultProvider(defaultCountry);
          
          setFormData(prev => ({ ...prev, country: defaultCountry }));
          setCurrency(defaultCurrency);
          setAvailableProviders(providers);
          setSelectedProvider(defaultProvider);
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Always show actual price (upgrade price or full price)
  const actualPrice = upgradePricing?.isUpgrade ? upgradePricing.upgradePrice : membershipData?.price || 0;
  const displayPrice = actualPrice;
  const displayCurrency = 'USD';

  // Current membership details
  const currentPlan = {
    name: upgradePricing?.isUpgrade ? 'Upgrade to Affiliate' : (membershipData?.name || 'Membership'),
    features: upgradePricing?.isUpgrade ? [
      'Earn commissions on course sales',
      'Access affiliate dashboard',
      'Track earnings and analytics',
      'Promotional materials provided',
      'Dedicated affiliate support'
    ] : (membershipData?.features || [
      'Access to platform features',
      'Customer support',
      'Regular updates'
    ]),
  };

  // Calculate converted price for display
  const usdPrice = actualPrice;
  const convertedPrice = usdPrice * CURRENCY_RATES[currency].rate;

  // Provider selection handler
  const handleProviderChange = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    console.log('🔄 Payment provider changed:', provider);
  };

  // Show loading while fetching membership data
  if (loadingMembership || !membershipData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading membership details...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    // Country is automatically set from profile, no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubscribe = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log('🚀 Starting payment initialization...');

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('❌ Payment initialization timeout - 30 seconds exceeded');
      toast.error('Payment initialization is taking too long. Please try again.');
      setLoading(false);
    }, 30000); // 30 seconds timeout

    try {
      // Get session from auth context (middleware ensures user is authenticated)
      console.log('🔐 Getting user session...');
      
      if (!session) {
        console.error('❌ No session found');
        toast.error('Session error. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      console.log('✅ Session found successfully');

      // Client-side guard: prevent duplicate payment if user already has active membership
      if (user?.id) {
        const { count } = await supabase
          .from('user_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        if ((count ?? 0) > 0) {
          clearTimeout(timeoutId);
          toast.error('You already have an active membership.');
          setLoading(false);
          router.push('/dashboard/learner/membership');
          return;
        }
      }

      console.log('📝 Preparing payment request...');
      
      // Calculate the actual price to charge (upgrade price or full price)
      const actualPrice = upgradePricing?.isUpgrade ? upgradePricing.upgradePrice : membershipData?.price || 0;
      
      // Generate client-side payment hash for fraud prevention
      const paymentHash = generatePaymentHash({
        membership_package_id: membershipId,
        user_id: user?.id || '',
        usd_price: actualPrice,
        provider: selectedProvider,
        timestamp: Date.now()
      });
      
      console.log('💰 Payment details:', {
        originalPrice: membershipData?.price || 0,
        actualPrice,
        isUpgrade: upgradePricing?.isUpgrade || false,
        upgradeSavings: upgradePricing?.savings || 0,
        originalCurrency: 'USD',
        selectedProvider,
        userCountry: formData.country,
        paymentHash
      });
      
      const paymentData = {
        membership_package_id: membershipId,
        payment_type: 'membership',
        payment_provider: selectedProvider, // Send selected provider
        metadata: {
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          country: formData.country,
          usd_price: actualPrice, // Send actual price (upgrade or full price)
          original_price: membershipData?.price || 0, // Send original price for reference
          is_upgrade: upgradePricing?.isUpgrade || false, // Flag for upgrade processing
          upgrade_savings: upgradePricing?.savings || 0, // Savings amount
          payment_hash: paymentHash, // Fraud prevention hash
          user_agent: navigator.userAgent, // Additional fraud prevention
          timestamp: Date.now(),
        },
      };
      console.log('Payment data:', paymentData);

      console.log('🌐 Calling initialize-payment Edge Function...');
      // Call Supabase Edge Function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/initialize-payment`;
      
      console.log('🔗 Edge Function URL:', edgeFunctionUrl);
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify(paymentData),
      });

      console.log('📥 API response received:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📥 Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📊 Parsed payment API response:', { data, status: response.status });
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.log('❌ Response that failed to parse:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok || data.error) {
        console.error('❌ Payment Edge Function error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          fullResponse: data
        });
        const errorMessage = data.error || 'Payment initialization failed';
        const errorDetails = data.details ? `: ${data.details}` : '';
        toast.error(`Payment error: ${errorMessage}${errorDetails}`);
        throw new Error(errorMessage);
      }

      if (data.success && data.authorization_url) {
        console.log('✅ Authorization URL received:', data.authorization_url);
        console.log('📊 Payment details:', {
          paymentId: data.payment_id,
          reference: data.reference,
          provider: data.provider,
          amount: data.amount,
          currency: data.currency
        });
        toast.success('Redirecting to payment gateway...');
        window.location.href = data.authorization_url;
      } else {
        console.error('❌ Invalid response format:', data);
        toast.error('Failed to initialize payment - invalid response');
        throw new Error('Failed to initialize payment - invalid response');
      }
    } catch (err) {
      console.error('❌ Payment initialization error:', err);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      clearTimeout(timeoutId); // Clear timeout
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Configure your plan</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Payment Provider Selection - Only for Ghana users */}
            {availableProviders.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Provider
                </label>
                <div className="space-y-2">
                  {availableProviders.map((provider) => (
                    <label
                      key={provider}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedProvider === provider
                          ? 'border-[#ed874a] bg-[#fef8f3]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentProvider"
                        value={provider}
                        checked={selectedProvider === provider}
                        onChange={() => handleProviderChange(provider)}
                        className="mr-3"
                      />
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 rounded-full bg-gray-100 flex items-center justify-center">
                          {provider === 'paystack' ? (
                            <img 
                              src="/Paystack_idIi-h8rZ0_1.png" 
                              alt="Paystack" 
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <img 
                              src="/kora.jpeg" 
                              alt="Kora" 
                              className="w-6 h-6 object-contain"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{provider}</div>
                          <div className="text-xs text-gray-500">
                            {provider === 'paystack' ? 'Secure payment via Paystack' : 'Fast payment via Kora'}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose your preferred payment provider
                </p>
              </div>
            )}

            {/* Single Provider Display - For non-Ghana users */}
            {availableProviders.length === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Provider
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-2 rounded-full bg-gray-200 flex items-center justify-center">
                      {selectedProvider === 'paystack' ? (
                        <img 
                          src="/Paystack_idIi-h8rZ0_1.png" 
                          alt="Paystack" 
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        <img 
                          src="/kora.jpeg" 
                          alt="Kora" 
                          className="w-4 h-4 object-contain"
                        />
                      )}
                    </div>
                    <span className="capitalize">{selectedProvider}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Payment provider automatically selected for your country
                </p>
              </div>
            )}


            {/* Billing Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing details</h2>
              
              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ed874a] focus:border-transparent ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ed874a] focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#ed874a] focus:border-transparent ${
                    errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Country */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country or region
                </label>
                <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  {formData.country || 'Loading...'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Country is automatically set from your profile
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Plan Summary */}
          <div>
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentPlan.name}</h2>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top features</h3>
                <ul className="space-y-3">
                  {currentPlan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#ed874a] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                {upgradePricing?.isUpgrade && (
                  <>
                    <div className="flex justify-between text-gray-700 mb-2">
                      <span>Original Price (USD)</span>
                      <span className="line-through">${upgradePricing.originalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-green-600 mb-2">
                      <span>Learner Discount</span>
                      <span>-${upgradePricing.savings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-700 mb-2">
                      <span>Upgrade Price (USD)</span>
                      <span className="font-semibold">${actualPrice.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>{upgradePricing?.isUpgrade ? 'Final Price (USD)' : 'Base Price (USD)'}</span>
                  <span>${actualPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Exchange Rate</span>
                  <span>1 USD = {CURRENCY_RATES[currency].rate} {currency}</span>
                </div>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Local Currency</span>
                  <span>{currency}</span>
                </div>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Duration</span>
                  <span>{membershipData?.duration_months || 12} month{(membershipData?.duration_months || 12) !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>Type</span>
                  <span className="capitalize">{upgradePricing?.isUpgrade ? 'Affiliate Upgrade' : (membershipData?.member_type || 'learner')}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm mb-2">
                  <span>Tax (0%)</span>
                  <span>{CURRENCY_RATES[currency].symbol}0.00</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-300 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Due today</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {CURRENCY_RATES[currency].symbol}{convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">
                      ≈ ${usdPrice.toLocaleString()} USD
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-right">
                  {membershipData?.description && `${membershipData.description}`}
                </p>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#ed874a] to-orange-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Processing...' : (upgradePricing?.isUpgrade ? 'Upgrade Now' : 'Subscribe')}
              </button>

              {/* Info */}
              <p className="text-xs text-gray-500 text-center mt-2">
                {upgradePricing?.isUpgrade 
                  ? 'Add affiliate access to your existing learner membership'
                  : ((membershipData?.duration_months || 12) >= 12 
                    ? 'Annual subscription. Renews automatically.'
                    : `${membershipData?.duration_months || 12} month subscription. Renews automatically.`)
                }
              </p>
              
              {upgradePricing?.isUpgrade && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 text-center">
                    <strong>Upgrade Savings:</strong> You're saving ${upgradePricing.savings.toLocaleString()} by upgrading instead of buying the full bundle!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </Suspense>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageInner />
    </Suspense>
  )
}
