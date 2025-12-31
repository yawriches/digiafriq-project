'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Wallet, ChevronDown } from 'lucide-react';
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
  
  // Ghana users can choose between Paystack and Kora
  if (countryLower === 'ghana' || countryLower.includes('ghana')) {
    return ['paystack', 'kora'];
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

// Country data with codes and flag images from CDN - Same as signup page
const countries = [
  // West Africa
  { name: 'Ghana', code: '+233', flag: 'https://flagcdn.com/w20/gh.png', iso: 'GH' },
  { name: 'Nigeria', code: '+234', flag: 'https://flagcdn.com/w20/ng.png', iso: 'NG' },
  { name: 'Benin', code: '+229', flag: 'https://flagcdn.com/w20/bj.png', iso: 'BJ' },
  { name: 'Burkina Faso', code: '+226', flag: 'https://flagcdn.com/w20/bf.png', iso: 'BF' },
  { name: "Côte d'Ivoire", code: '+225', flag: 'https://flagcdn.com/w20/ci.png', iso: 'CI' },
  { name: 'Guinea-Bissau', code: '+245', flag: 'https://flagcdn.com/w20/gw.png', iso: 'GW' },
  { name: 'Mali', code: '+223', flag: 'https://flagcdn.com/w20/ml.png', iso: 'ML' },
  { name: 'Niger', code: '+227', flag: 'https://flagcdn.com/w20/ne.png', iso: 'NE' },
  { name: 'Senegal', code: '+221', flag: 'https://flagcdn.com/w20/sn.png', iso: 'SN' },
  { name: 'Togo', code: '+228', flag: 'https://flagcdn.com/w20/tg.png', iso: 'TG' },
  
  // Central Africa
  { name: 'Cameroon', code: '+237', flag: 'https://flagcdn.com/w20/cm.png', iso: 'CM' },
  { name: 'Central African Republic', code: '+236', flag: 'https://flagcdn.com/w20/cf.png', iso: 'CF' },
  { name: 'Chad', code: '+235', flag: 'https://flagcdn.com/w20/td.png', iso: 'TD' },
  { name: 'Republic of the Congo', code: '+242', flag: 'https://flagcdn.com/w20/cg.png', iso: 'CG' },
  { name: 'Congo', code: '+242', flag: 'https://flagcdn.com/w20/cd.png', iso: 'CD' },
  { name: 'Equatorial Guinea', code: '+240', flag: 'https://flagcdn.com/w20/gq.png', iso: 'GQ' },
  { name: 'Gabon', code: '+241', flag: 'https://flagcdn.com/w20/ga.png', iso: 'GA' },
  
  // East Africa
  { name: 'Kenya', code: '+254', flag: 'https://flagcdn.com/w20/ke.png', iso: 'KE' },
  { name: 'South Africa', code: '+27', flag: 'https://flagcdn.com/w20/za.png', iso: 'ZA' },
  
  // North America
  { name: 'United States', code: '+1', flag: 'https://flagcdn.com/w20/us.png', iso: 'US' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { user } = useAuth();
  const { hasLearnerMembership } = useMembershipStatus();
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Get membership details from URL params
  const membershipId = params.id as string;
  const isUpgradeFlow = searchParams.get('upgrade') === 'true';
  const hasAddonParam = searchParams.get('addon') === 'digital-cashflow';
  
  // Digital Cashflow addon price - fetched from database
  
  // Addon state - can be toggled by user for learner memberships
  const [hasAddon, setHasAddon] = useState(hasAddonParam);

  // State for membership data
  const [membershipData, setMembershipData] = useState<any>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [allMemberships, setAllMemberships] = useState<any[]>([]);

  // Redirect if no membership data
  useEffect(() => {
    if (!membershipId) {
      router.push('/dashboard/learner/membership');
    }
  }, [membershipId, router]);

  // Don't render anything if redirecting
  if (!membershipId) {
    return null;
  }

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
  const [availableProviders, setAvailableProviders] = useState<PaymentProvider[]>(['kora']);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to Ghana
  
  // Referral tracking state
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralType, setReferralType] = useState<string | null>(null);

  // Load referral info from URL params first, then fall back to localStorage.
  // This fixes cases where users land directly on /checkout/guest/... ?ref=XXXX&type=dcs
  // and localStorage hasn't been set by the sales page.
  useEffect(() => {
    const urlRef = searchParams.get('ref');
    const urlType = searchParams.get('type');
    const normalizedType = urlType === 'dcs' ? 'dcs' : (urlType === 'learner' ? 'learner' : null);

    if (urlRef) {
      setReferralCode(urlRef);
      setReferralType(normalizedType || 'learner');
      localStorage.setItem('referral_code', urlRef);
      localStorage.setItem('referral_type', normalizedType || 'learner');
      console.log('📎 Loaded referral code from URL:', urlRef, 'type:', normalizedType);
      return;
    }

    const storedCode = localStorage.getItem('referral_code');
    const storedType = localStorage.getItem('referral_type');
    if (storedCode) {
      setReferralCode(storedCode);
      setReferralType(storedType || 'learner');
      console.log('📎 Loaded referral code from localStorage:', storedCode, 'type:', storedType);
    }
  }, [searchParams]);

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

  // Initialize default country settings for guest users
  useEffect(() => {
    const defaultCountry = selectedCountry.name;
    const defaultCurrency = getCountryCurrency(defaultCountry);
    const providers = getAvailableProviders(defaultCountry);
    const defaultProvider = getDefaultProvider(defaultCountry);
    
    setFormData(prev => ({ ...prev, country: defaultCountry }));
    setCurrency(defaultCurrency);
    setAvailableProviders(providers);
    setSelectedProvider(defaultProvider);
  }, []);

  // Handle country selection change
  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    
    const countryName = country.name;
    const countryCurrency = getCountryCurrency(countryName);
    const providers = getAvailableProviders(countryName);
    const defaultProvider = getDefaultProvider(countryName);
    
    setFormData(prev => ({ ...prev, country: countryName }));
    setCurrency(countryCurrency);
    setAvailableProviders(providers);
    setSelectedProvider(defaultProvider);
    
    console.log('🌍 Country selected:', { 
      country: countryName, 
      currency: countryCurrency, 
      providers, 
      defaultProvider 
    });
  };

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine if this is a learner membership (can add DCS addon) or learner_dcs (addon included)
  const isLearnerMembership = membershipData?.member_type === 'learner';
  const isLearnerDcsMembership = membershipData?.name?.toLowerCase().includes('dcs') || 
                                  membershipData?.name?.toLowerCase().includes('digital cashflow') ||
                                  membershipData?.has_digital_cashflow === true;
  
  // For learner_dcs membership, addon is always included and cannot be unchecked
  const addonIncluded = isLearnerDcsMembership;
  
  // Get DCS addon price from database
  const dcsAddonPrice = membershipData?.digital_cashflow_price || 0;
  
  // Calculate addon price:
  // - If learner_dcs membership: addon is included in base price, no extra charge
  // - If learner membership + user selects addon: add DCS price from database
  const addonPrice = (hasAddon || addonIncluded) ? dcsAddonPrice : 0;
  
  // Base price is the membership price from database
  const membershipBasePrice = membershipData?.price || 0;
  const basePrice = upgradePricing?.isUpgrade ? upgradePricing.upgradePrice : membershipBasePrice;
  const actualPrice = basePrice + addonPrice; // $10 + $7 = $17 for learner_dcs
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
      console.log('📝 Preparing guest payment request...');
      
      // Use the already calculated actualPrice (includes addon if selected)
      // actualPrice is defined at component level: basePrice + addonPrice
      console.log('💵 Price being sent:', { basePrice, addonPrice, actualPrice, hasAddon, addonIncluded });
      
      // Generate client-side payment hash for fraud prevention
      const paymentHash = generatePaymentHash({
        membership_package_id: membershipId,
        email: formData.email,
        usd_price: actualPrice,
        provider: selectedProvider,
        timestamp: Date.now()
      });
      
      console.log('💰 Guest Payment details:', {
        originalPrice: membershipData?.price || 0,
        actualPrice,
        isUpgrade: upgradePricing?.isUpgrade || false,
        upgradeSavings: upgradePricing?.savings || 0,
        originalCurrency: 'USD',
        selectedProvider,
        userCountry: formData.country,
        paymentHash,
        isGuest: true
      });
      
      // Determine the purchase type based on addon selection
      const purchaseType = (hasAddon || addonIncluded) ? 'learner_dcs' : 'learner';
      
      // Store referral code and purchase type for callback page to use
      if (referralCode) {
        localStorage.setItem('checkout_referral_code', referralCode);
        localStorage.setItem('checkout_referral_type', referralType || 'learner');
        console.log('💾 Stored referral code for callback:', referralCode);
      }
      // Always store purchase type for commission calculation
      localStorage.setItem('checkout_purchase_type', purchaseType);
      console.log('💾 Stored purchase type for callback:', purchaseType);
      
      const paymentData = {
        membership_package_id: membershipId,
        payment_type: 'referral_membership', // Use referral_membership to bypass auth
        payment_provider: selectedProvider,
        metadata: {
          full_name: formData.fullName,
          email: formData.email,
          phone_number: formData.phoneNumber,
          country: formData.country,
          usd_price: actualPrice,
          original_price: membershipData?.price || 0,
          is_upgrade: false,
          upgrade_savings: 0,
          payment_hash: paymentHash,
          user_agent: navigator.userAgent,
          timestamp: Date.now(),
          is_referral_signup: true, // Flag for guest checkout
          is_guest: true,
          // Include referral info in metadata
          referral_code: referralCode,
          referral_type: referralType,
          guest_email: formData.email,
          guest_name: formData.fullName,
          guest_country: formData.country,
          // DCS addon info
          has_digital_cashflow_addon: hasAddon || addonIncluded,
          initial_purchase_type: purchaseType,
          addon_price: addonPrice,
        },
      };
      console.log('Payment data:', paymentData);

      console.log('🌐 Calling initialize-guest-payment Edge Function...');
      // Guest checkout uses a dedicated Edge Function that creates a pending payment
      // without requiring auth, then sets payments.provider_reference from the provider.
      const { data: functionData, error: functionError } = await supabase.functions.invoke('initialize-guest-payment', {
        body: paymentData,
      });

      console.log('📥 Edge Function response:', { functionData, functionError });

      if (functionError) {
        console.error('❌ Edge Function error:', {
          name: (functionError as any)?.name,
          message: (functionError as any)?.message,
          status: (functionError as any)?.status,
          context: (functionError as any)?.context,
          details: (functionError as any)?.details,
          stack: (functionError as any)?.stack,
          functionData
        });
        toast.error(`Payment error: ${functionError.message}`);
        throw new Error(functionError.message);
      }

      const data = functionData;

      // Check for errors in response
      if (data?.error) {
        console.error('❌ Payment Edge Function error:', {
          error: data.error,
          details: data.details,
          fullResponse: data
        });
        const errorMessage = data.error || 'Payment initialization failed';
        const errorDetails = data.details ? `: ${data.details}` : '';
        toast.error(`Payment error: ${errorMessage}${errorDetails}`);
        throw new Error(errorMessage);
      }

      if (data?.success && data?.authorization_url) {
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
        {/* DigiAfriq Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/digiafriqlogo.png" 
            alt="DigiAfriq" 
            className="h-12 object-contain"
          />
        </div>

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

              {/* Country Selection Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country or region
                </label>
                <div className="relative" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400 focus:ring-2 focus:ring-[#ed874a] focus:border-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={selectedCountry.flag} 
                        alt={selectedCountry.name}
                        className="w-5 h-4 object-cover rounded-sm"
                      />
                      <span className="text-gray-700">{selectedCountry.name}</span>
                      <span className="text-gray-400 text-sm">({selectedCountry.code})</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCountryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {countries.map((country) => (
                        <button
                          key={country.iso}
                          type="button"
                          onClick={() => handleCountrySelect(country)}
                          className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-orange-50 ${
                            selectedCountry.iso === country.iso ? 'bg-orange-50 text-[#ed874a]' : 'text-gray-700'
                          }`}
                        >
                          <img 
                            src={country.flag} 
                            alt={country.name}
                            className="w-5 h-4 object-cover rounded-sm"
                          />
                          <span>{country.name}</span>
                          <span className="text-gray-400 text-sm">({country.code})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select your country to determine payment options and currency
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

              {/* Digital Cashflow Addon - Show for learner memberships */}
              {(isLearnerMembership || addonIncluded) && (
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-semibold text-gray-900">Digital Cashflow System</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          {addonIncluded ? 'Included' : `+$${dcsAddonPrice}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Get the Digital Cashflow Program + lifetime promo tools. Earn 80% commission + 20% yearly recurring.
                      </p>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          Unlock Affiliate Features
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          Earn commissions on referrals
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500" />
                          Access promotional materials
                        </li>
                      </ul>
                    </div>
                    <div className="shrink-0">
                      <label className={`relative inline-flex items-center ${addonIncluded ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={hasAddon || addonIncluded}
                          onChange={(e) => !addonIncluded && setHasAddon(e.target.checked)}
                          disabled={addonIncluded}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 ${addonIncluded ? 'bg-[#ed874a] opacity-70' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ed874a] ${addonIncluded ? 'cursor-not-allowed' : ''}`}></div>
                      </label>
                      {addonIncluded && (
                        <p className="text-xs text-gray-500 mt-1 text-center">Included</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                  <span>Membership Price (USD)</span>
                  <span>${basePrice.toLocaleString()}</span>
                </div>
                {(hasAddon && !addonIncluded) && (
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Digital Cashflow Addon</span>
                    <span>+${dcsAddonPrice}</span>
                  </div>
                )}
                {addonIncluded && (
                  <div className="flex justify-between text-green-600 mb-2">
                    <span>Digital Cashflow Addon</span>
                    <span>Included</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700 mb-2 font-semibold">
                  <span>Total (USD)</span>
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
                  <span className="capitalize">
                    {upgradePricing?.isUpgrade 
                      ? 'Affiliate Upgrade' 
                      : (hasAddon || addonIncluded) 
                        ? 'Learner + DCS' 
                        : (membershipData?.member_type || 'learner')}
                  </span>
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
