// Type declarations for Supabase RPC functions and extensions
declare global {
  interface Database {
    public: {
      Functions: {
        create_user_referral_code: {
          Args: {
            p_user_id: string
          }
          Returns: string
        }
        process_referral: {
          Args: {
            p_referred_id: string
            p_referral_code: string
            p_referral_type: 'learner' | 'affiliate'
          }
          Returns: string
        }
        create_commission: {
          Args: {
            p_affiliate_id: string
            p_referral_id: string
            p_payment_id: string
            p_commission_type: 'learner_referral' | 'affiliate_referral' | 'learner_renewal'
            p_notes?: string
          }
          Returns: string
        }
      }
    }
  }
}

export {}
