import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { 
  getUserReferralCode, 
  createUserReferralCode, 
  generateReferralUrl,
  getUserReferrals,
  getUserCommissions,
  getReferralStats,
  ReferralCode,
  Referral,
  Commission,
  ReferralStats
} from '../lib/supabase/referrals';

export function useReferralCode() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReferralCode(null);
      setLoading(false);
      return;
    }

    loadReferralCode();
  }, [user]);

  const loadReferralCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get from affiliate_profiles table
      const { data: affiliateProfile, error: profileError } = await (supabase as any)
        .from('affiliate_profiles')
        .select('referral_code, created_at')
        .eq('id', user!.id)
        .single();

      if (affiliateProfile && !profileError) {
        // Convert to ReferralCode format
        setReferralCode({
          id: user!.id,
          user_id: user!.id,
          code: affiliateProfile.referral_code,
          is_active: true,
          created_at: affiliateProfile.created_at,
          last_used_at: null,
          usage_count: 0,
          max_uses: 999999,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else {
        // No affiliate profile found - check if user has DCS addon
        console.log('No affiliate profile found. Checking if user has DCS addon...');
        console.log('User ID:', user!.id);
        
        // Check if user has DCS addon in user_memberships
        const { data: membership, error: membershipError } = await (supabase as any)
          .from('user_memberships')
          .select('has_digital_cashflow_addon, is_active, user_id')
          .eq('user_id', user!.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('Membership query result:', { membership, membershipError });
        console.log('has_digital_cashflow_addon value:', membership?.has_digital_cashflow_addon);
        console.log('Type of has_digital_cashflow_addon:', typeof membership?.has_digital_cashflow_addon);

        if (membership?.has_digital_cashflow_addon) {
          console.log('User has DCS addon but no affiliate profile. Creating profile...');
          
          // Generate unique referral code
          const generateCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 8; i++) {
              code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
          };

          const referralCode = generateCode();
          const baseUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3000' 
            : (process.env.NEXT_PUBLIC_SITE_URL || 'https://digiafriq.com');

          // Try to create affiliate profile via RPC function first
          try {
            const { error: rpcError } = await (supabase as any)
              .rpc('create_affiliate_profile_on_dcs', {
                p_user_id: user!.id
              });

            if (rpcError && rpcError.code === 'PGRST202') {
              // RPC function doesn't exist (migration not run), create profile directly
              console.log('RPC function not found. Creating profile directly...');
              
              const { error: insertError } = await (supabase as any)
                .from('affiliate_profiles')
                .insert({
                  id: user!.id,
                  referral_code: referralCode,
                  learner_link: `${baseUrl}/join/learner?ref=${referralCode}`,
                  dcs_link: `${baseUrl}/join/dcs?ref=${referralCode}`,
                  total_earnings: 0,
                  available_balance: 0,
                  lifetime_referrals: 0,
                  active_referrals: 0
                });

              if (insertError) {
                console.error('Failed to create affiliate profile directly:', insertError);
                setError('Failed to create affiliate profile. Please run the migration or contact support.');
              } else {
                console.log('Affiliate profile created successfully via direct insert. Retrying fetch...');
                // Retry fetching the profile
                setTimeout(() => loadReferralCode(), 500);
                return;
              }
            } else if (rpcError) {
              console.error('Failed to create affiliate profile via RPC:', rpcError);
              setError('Failed to create affiliate profile. Please contact support.');
            } else {
              console.log('Affiliate profile created successfully via RPC. Retrying fetch...');
              // Retry fetching the profile
              setTimeout(() => loadReferralCode(), 500);
              return;
            }
          } catch (createErr) {
            console.error('Error creating affiliate profile:', createErr);
            setError('Failed to create affiliate profile. Please contact support.');
          }
        } else {
          console.log('User does not have DCS addon.');
          setReferralCode(null);
        }
      }
    } catch (err) {
      console.error('Error loading referral code:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referral code');
    } finally {
      setLoading(false);
    }
  };

  const generateUrls = () => {
    if (!referralCode) return { learnerUrl: '', affiliateUrl: '' };
    
    return {
      learnerUrl: generateReferralUrl(referralCode.code, 'learner'),
      affiliateUrl: generateReferralUrl(referralCode.code, 'affiliate')
    };
  };

  const refresh = () => loadReferralCode();

  return {
    referralCode,
    loading,
    error,
    refresh,
    generateUrls
  };
}

export function useReferrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setReferrals([]);
      setLoading(false);
      return;
    }

    loadReferrals();
  }, [user]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userReferrals = await getUserReferrals(user!.id);
      setReferrals(userReferrals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadReferrals();

  return {
    referrals,
    loading,
    error,
    refresh
  };
}

export function useCommissions() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCommissions([]);
      setAvailableBalance(0);
      setLoading(false);
      return;
    }

    loadCommissions();
  }, [user]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load commissions
      const userCommissions = await getUserCommissions(user!.id);
      setCommissions(userCommissions);

      // Load available balance from affiliate_profiles
      const { data: profile, error: profileError } = await (supabase as any)
        .from('affiliate_profiles')
        .select('available_balance')
        .eq('id', user!.id)
        .single();

      if (profile && !profileError) {
        setAvailableBalance(profile.available_balance || 0);
      } else {
        // Fallback: calculate from commissions if no profile
        const calculated = userCommissions
          .filter((c: Commission) => c.status === 'available')
          .reduce((total: number, c: Commission) => total + c.commission_amount, 0);
        setAvailableBalance(calculated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadCommissions();

  const getTotalEarnings = () => {
    return commissions
      .filter(c => c.status === 'available' || c.status === 'paid')
      .reduce((total, commission) => total + commission.commission_amount, 0);
  };

  const getAvailableEarnings = () => {
    // Return the actual available balance from affiliate_profiles
    return availableBalance;
  };

  const getPaidEarnings = () => {
    return commissions
      .filter(c => c.status === 'paid')
      .reduce((total, commission) => total + commission.commission_amount, 0);
  };

  return {
    commissions,
    loading,
    error,
    refresh,
    getTotalEarnings,
    getAvailableEarnings,
    getPaidEarnings
  };
}

export function useReferralStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    completed_referrals: 0,
    pending_referrals: 0,
    total_commissions: 0,
    available_commissions: 0,
    paid_commissions: 0,
    learner_referrals: 0,
    affiliate_referrals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setStats({
        total_referrals: 0,
        completed_referrals: 0,
        pending_referrals: 0,
        total_commissions: 0,
        available_commissions: 0,
        paid_commissions: 0,
        learner_referrals: 0,
        affiliate_referrals: 0,
      });
      setLoading(false);
      return;
    }

    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userStats = await getReferralStats(user!.id);
      setStats(userStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadStats();

  return {
    stats,
    loading,
    error,
    refresh
  };
}
