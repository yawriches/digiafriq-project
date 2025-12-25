import { supabase } from './client';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  usage_count: number;
  max_uses: number;
  expires_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  referral_type: 'learner' | 'affiliate';
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  completed_at: string | null;
  expires_at: string;
}

export interface Commission {
  id: string;
  affiliate_id: string;
  referral_id: string | null;
  payment_id: string | null;
  // Commission types:
  // - learner_initial: First-time learner membership purchase
  // - dcs_addon: Digital Cashflow System addon purchase
  // - learner_renewal: Learner membership renewal
  // - learner_referral: Commission for referring a learner (requires migration)
  // - affiliate_referral: Commission for referring an affiliate (requires migration)
  commission_type: 'learner_initial' | 'dcs_addon' | 'learner_renewal' | 'learner_referral' | 'affiliate_referral';
  commission_amount: number;
  commission_currency: string;
  commission_rate: number;
  base_amount: number;
  base_currency: string;
  status: 'pending' | 'available' | 'paid' | 'cancelled';
  created_at: string;
  paid_at: string | null;
  notes: string | null;
}

export interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_commissions: number;
  available_commissions: number;
  paid_commissions: number;
  learner_referrals: number;
  affiliate_referrals: number;
}

// Get user's referral code
export async function getUserReferralCode(userId: string): Promise<ReferralCode | null> {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching referral code:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return null;
  }

  // Return the first (most recent) code or null if no codes exist
  return data && data.length > 0 ? data[0] : null;
}

// Create referral code for user
export async function createUserReferralCode(userId: string): Promise<ReferralCode | null> {
  try {
    // First try the RPC function
    const { data, error } = await supabase.rpc('create_user_referral_code', {
      p_user_id: userId
    } as any);

    if (error) {
      console.error('RPC function failed, trying direct insert:', error);
      
      // Fallback: Create referral code directly
      const code = generateReferralCodeString();
      
      const { data: newCode, error: insertError } = await (supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: code,
          is_active: true,
          created_at: new Date().toISOString(),
          usage_count: 0,
          max_uses: 1000,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single()) as any;

      if (insertError) {
        console.error('Error creating referral code (fallback):', insertError);
        console.error('Insert error details:', JSON.stringify(insertError, null, 2));
        return null;
      }

      console.log('Successfully created referral code via fallback:', newCode);
      return newCode;
    }

    // Fetch the created code
    return getUserReferralCode(userId);
  } catch (err) {
    console.error('Error creating referral code:', err);
    return null;
  }
}

// Generate referral URL
export function generateReferralUrl(code: string, type: 'learner' | 'affiliate' = 'learner'): string {
  // Use localhost for development, production URL for production
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://digiafriq.com');
  
  // Point to dedicated sales pages for each referral type
  if (type === 'affiliate') {
    return `${baseUrl}/join/dcs?ref=${code}`;
  }
  return `${baseUrl}/join/learner?ref=${code}`;
}

// Validate referral code
export async function validateReferralCode(code: string): Promise<ReferralCode | null> {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error validating referral code:', error);
    return null;
  }

  return data;
}

// Process referral signup
export async function processReferral(
  referredId: string, 
  referralCode: string, 
  referralType: 'learner' | 'affiliate'
): Promise<Referral | null> {
  try {
    const { data, error } = await supabase.rpc('process_referral', {
      p_referred_id: referredId,
      p_referral_code: referralCode,
      p_referral_type: referralType
    } as any);

    if (error) {
      console.error('Error processing referral:', error);
      return null;
    }

    // Fetch the created referral
    const { data: referral, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching referral:', fetchError);
      return null;
    }

    return referral;
  } catch (err) {
    console.error('Error processing referral:', err);
    return null;
  }
}

// Get user's referrals
export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }

  return data || [];
}

// Get user's commissions
export async function getUserCommissions(userId: string): Promise<Commission[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('affiliate_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching commissions:', error);
    return [];
  }

  return data || [];
}

// Get referral statistics
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const [referrals, commissions] = await Promise.all([
    getUserReferrals(userId),
    getUserCommissions(userId)
  ]);

  const stats: ReferralStats = {
    total_referrals: referrals.length,
    completed_referrals: referrals.filter(r => r.status === 'completed').length,
    pending_referrals: referrals.filter(r => r.status === 'pending').length,
    total_commissions: commissions.length,
    available_commissions: commissions.filter(c => c.status === 'available').length,
    paid_commissions: commissions.filter(c => c.status === 'paid').length,
    learner_referrals: referrals.filter(r => r.referral_type === 'learner').length,
    affiliate_referrals: referrals.filter(r => r.referral_type === 'affiliate').length,
  };

  return stats;
}

// Create commission from payment
export async function createCommission(
  affiliateId: string,
  referralId: string,
  paymentId: string,
  commissionType: 'learner_referral' | 'affiliate_referral' | 'learner_renewal',
  notes?: string
): Promise<Commission | null> {
  try {
    const { data, error } = await supabase.rpc('create_commission', {
      p_affiliate_id: affiliateId,
      p_referral_id: referralId,
      p_payment_id: paymentId,
      p_commission_type: commissionType,
      p_notes: notes
    } as any);

    if (error) {
      console.error('Error creating commission:', error);
      return null;
    }

    // Fetch the created commission
    const { data: commission, error: fetchError } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) {
      console.error('Error fetching commission:', fetchError);
      return null;
    }

    return commission;
  } catch (err) {
    console.error('Error creating commission:', err);
    return null;
  }
}

// Helper function to generate referral code string
function generateReferralCodeString(): string {
  // Generate 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper function to bypass TypeScript strict typing for updates
const safeUpdate = async (table: string, updateData: any, eqColumn: string, eqValue: string) => {
  const { error } = await (supabase.from(table) as any)
    .update(updateData)
    .eq(eqColumn, eqValue);
  return error;
};

// Update commission status
export async function updateCommissionStatus(
  commissionId: string,
  status: 'pending' | 'available' | 'paid' | 'cancelled'
): Promise<boolean> {
  try {
    const updateData: any = { status };
    
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const error = await safeUpdate('commissions', updateData, 'id', commissionId);

    if (error) {
      console.error('Error updating commission status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error updating commission status:', err);
    return false;
  }
}

// Get referral by code
export async function getReferralByCode(code: string): Promise<Referral | null> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', code)
    .single();

  if (error) {
    console.error('Error fetching referral by code:', error);
    return null;
  }

  return data;
}

// Complete referral (mark as completed)
export async function completeReferral(referralId: string): Promise<boolean> {
  try {
    const updateData = { 
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    const error = await safeUpdate('referrals', updateData, 'id', referralId);

    if (error) {
      console.error('Error completing referral:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error completing referral:', err);
    return false;
  }
}

// Check if user has valid referral
export async function hasValidReferral(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', userId)
    .in('status', ['pending', 'completed'])
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error checking referral:', error);
    return false;
  }

  return !!data;
}
