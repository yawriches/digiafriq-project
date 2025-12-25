'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Users, Crown, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MembershipPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration_months: number;
  member_type: 'learner' | 'affiliate';
  is_active: boolean;
  features: string[];
  created_at: string;
}

export default function LearnerMembershipPage() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('membership_packages')
        .select('*')
        .eq('is_active', true)
        .eq('member_type', 'learner')
        .order('price', { ascending: true });

      if (error) throw error;

      setMemberships(data || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      toast.error('Failed to load membership packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (membership: MembershipPackage) => {
    if (!user) {
      toast.error('Please log in to continue');
      return;
    }

    setLoadingPlan(membership.id);

    try {
      const response = await fetch('/api/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: membership.price * 100, // Convert to kobo/cents
          metadata: {
            user_id: user.id,
            membership_package_id: membership.id,
            payment_type: 'membership_purchase',
          },
        }),
      });

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      toast.error('Failed to initialize payment. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getMembershipIcon = (index: number) => {
    const icons = [Sparkles, Zap, Crown];
    const Icon = icons[index % icons.length];
    return Icon;
  };

  const getMembershipBadge = (index: number) => {
    const badges = [
      { text: 'Popular', color: 'bg-orange-50 text-[#ed874a]' },
      { text: 'Best Value', color: 'bg-purple-50 text-purple-600' },
      { text: 'Premium', color: 'bg-blue-50 text-blue-600' },
    ];
    return badges[index % badges.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Choose Your Membership
            </h1>
            <p className="text-gray-600 text-lg">
              Loading available membership packages...
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ed874a]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Choose Your Membership
            </h1>
            <p className="text-gray-600 text-lg">
              No membership packages are currently available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Choose Your Membership
          </h1>
          <p className="text-gray-600 text-lg">
            Select the perfect plan for your learning journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-6 max-w-5xl mx-auto ${
          memberships.length === 1 ? 'grid-cols-1 max-w-md' :
          memberships.length === 2 ? 'md:grid-cols-2' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {memberships.map((membership, index) => {
            const Icon = getMembershipIcon(index);
            const badge = getMembershipBadge(index);
            const isHighlighted = index === 1 && memberships.length > 1; // Highlight middle card if multiple

            return (
              <div
                key={membership.id}
                className={`rounded-2xl border-2 p-8 transition-all hover:shadow-lg ${
                  isHighlighted
                    ? 'bg-gradient-to-br from-[#ed874a] to-orange-500 border-[#ed874a] text-white hover:shadow-2xl relative overflow-hidden'
                    : 'bg-white border-gray-200 hover:border-[#ed874a]'
                }`}
              >
                {/* Background decoration for highlighted card */}
                {isHighlighted && (
                  <>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
                  </>
                )}

                <div className={isHighlighted ? 'relative z-10' : ''}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                      {membership.name}
                    </h2>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isHighlighted 
                        ? 'bg-white/20 backdrop-blur-sm text-white' 
                        : badge.color
                    }`}>
                      <Icon className="w-4 h-4" />
                      {badge.text}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm ${isHighlighted ? 'text-white/90' : 'text-gray-500'}`}>
                        {membership.currency === 'NGN' ? '₦' : '$'}
                      </span>
                      <span className={`text-5xl font-bold ${isHighlighted ? 'text-white' : 'text-gray-900'}`}>
                        {membership.currency === 'NGN' ? membership.price.toLocaleString() : membership.price}
                      </span>
                      <div className={`${isHighlighted ? 'text-white/90' : 'text-gray-500'}`}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {membership.duration_months} month{membership.duration_months !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm mt-2 ${isHighlighted ? 'text-white/80' : 'text-gray-500'}`}>
                      {formatPrice(membership.price / membership.duration_months, membership.currency)} per month
                    </p>
                  </div>

                  {/* Description */}
                  <p className={`mb-6 ${isHighlighted ? 'text-white/95' : 'text-gray-600'}`}>
                    {membership.description || 'Full access to our learning platform'}
                  </p>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {membership.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          isHighlighted 
                            ? 'bg-white/20 backdrop-blur-sm' 
                            : 'bg-green-100'
                        }`}>
                          <Check className={`w-3 h-3 ${isHighlighted ? 'text-white' : 'text-green-600'}`} />
                        </div>
                        <span className={isHighlighted ? 'text-white' : 'text-gray-700'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <button
                    onClick={() => handleSelectPlan(membership)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isHighlighted
                        ? 'bg-white text-[#ed874a] hover:bg-gray-50 shadow-lg'
                        : 'bg-white border-2 border-[#ed874a] text-[#ed874a] hover:bg-orange-50'
                    }`}
                  >
                    {loadingPlan === membership.id ? 'Processing...' : `Get ${membership.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@digiafriq.com" className="text-[#ed874a] hover:underline font-medium">
              support@digiafriq.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
