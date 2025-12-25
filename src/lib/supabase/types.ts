export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Enums: {
      user_role: 'learner' | 'affiliate' | 'admin'
      lesson_type: 'video' | 'text' | 'file' | 'quiz'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
      payout_status: 'pending' | 'processing' | 'completed' | 'failed'
    },
    Tables: {
      affiliate_profiles: {
        Row: {
          id: string
          affiliate_code: string
          commission_rate: number
          total_earnings: number
          total_referrals: number
          bank_name: string | null
          account_number: string | null
          member_type: Database['public']['Enums']['user_role']
          is_active: boolean
          features: string[]
          created_at: string
          has_digital_cashflow: boolean
          digital_cashflow_price: number
          is_verified: boolean
          updated_at: string
        }
        Insert: {
          id: string
          affiliate_code: string
          commission_rate?: number
          total_earnings?: number
          total_referrals?: number
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          affiliate_code?: string
          commission_rate?: number
          total_earnings?: number
          total_referrals?: number
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      commissions: {
        Row: {
          id: string
          affiliate_id: string
          payment_id: string
          course_id: string
          amount: number
          commission_rate: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          affiliate_id: string
          payment_id: string
          course_id: string
          amount: number
          commission_rate: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          affiliate_id?: string
          payment_id?: string
          course_id?: string
          amount?: number
          commission_rate?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          price: number
          instructor_id: string | null
          is_published: boolean
          total_lessons: number
          estimated_duration: number | null
          category: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          price: number
          instructor_id?: string | null
          is_published?: boolean
          total_lessons?: number
          estimated_duration?: number | null
          category?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          price?: number
          instructor_id?: string | null
          is_published?: boolean
          total_lessons?: number
          estimated_duration?: number | null
          category?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
          completed_at: string | null
          progress_percentage: number
          last_accessed_lesson_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrolled_at?: string
          completed_at?: string | null
          progress_percentage?: number
          last_accessed_lesson_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string
          completed_at?: string | null
          progress_percentage?: number
          last_accessed_lesson_id?: string | null
        }
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          enrollment_id: string
          is_completed: boolean
          watch_time: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          enrollment_id: string
          is_completed?: boolean
          watch_time?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          enrollment_id?: string
          is_completed?: boolean
          watch_time?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          description: string | null
          content: string | null
          video_url: string | null
          file_url: string | null
          lesson_type: 'video' | 'text' | 'file' | 'quiz'
          duration: number | null
          order_index: number
          is_preview: boolean
          instructor_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          description?: string | null
          content?: string | null
          video_url?: string | null
          file_url?: string | null
          lesson_type?: 'video' | 'text' | 'file' | 'quiz'
          duration?: number | null
          order_index: number
          is_preview?: boolean
          instructor_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          description?: string | null
          content?: string | null
          video_url?: string | null
          file_url?: string | null
          lesson_type?: 'video' | 'text' | 'file' | 'quiz'
          duration?: number | null
          order_index?: number
          is_preview?: boolean
          instructor_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      membership_course_access: {
        Row: {
          id: string
          membership_package_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          id?: string
          membership_package_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          id?: string
          membership_package_id?: string
          course_id?: string
          created_at?: string
        }
      }
      membership_promotion_rights: {
        Row: {
          id: string
          membership_package_id: string
          promotable_membership_id: string
          commission_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          membership_package_id: string
          promotable_membership_id: string
          commission_rate: number
          created_at?: string
        }
        Update: {
          id?: string
          membership_package_id?: string
          promotable_membership_id?: string
          commission_rate?: number
          created_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          currency: string
          duration_months: number
          member_type: 'learner' | 'affiliate'
          is_active: boolean
          features: string[]
          created_at: string
          has_digital_cashflow: boolean
          digital_cashflow_price: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          is_read?: boolean
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          action_url?: string | null
          created_at?: string
        }
      }
      payout_commissions: {
        Row: {
          id: string
          payout_id: string
          commission_id: string
        }
        Insert: {
          id?: string
          payout_id: string
          commission_id: string
        }
        Update: {
          id?: string
          payout_id?: string
          commission_id?: string
        }
      }
      payouts: {
        Row: {
          id: string
          affiliate_id: string
          amount: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          bank_name: string | null
          account_number: string | null
          account_name: string | null
          reference: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          affiliate_id: string
          amount: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          reference?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          affiliate_id?: string
          amount?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          reference?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          affiliate_id: string | null
          amount: number
          currency: string
          paystack_reference: string | null
          paystack_transaction_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          affiliate_id?: string | null
          amount: number
          currency?: string
          paystack_reference?: string | null
          paystack_transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          affiliate_id?: string | null
          amount?: number
          currency?: string
          paystack_reference?: string | null
          paystack_transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          payment_method?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'learner' | 'affiliate' | 'admin'
          active_role: 'learner' | 'affiliate' | 'admin'
          available_roles: ('learner' | 'affiliate' | 'admin')[]
          phone: string | null
          country: string | null
          learner_has_paid: boolean | null
          learner_payment_date: string | null
          learner_payment_amount: number | null
          learner_payment_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'learner' | 'affiliate' | 'admin'
          active_role?: 'learner' | 'affiliate' | 'admin'
          available_roles?: ('learner' | 'affiliate' | 'admin')[]
          phone?: string | null
          country?: string | null
          learner_has_paid?: boolean | null
          learner_payment_date?: string | null
          learner_payment_amount?: number | null
          learner_payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'learner' | 'affiliate' | 'admin'
          active_role?: 'learner' | 'affiliate' | 'admin'
          available_roles?: ('learner' | 'affiliate' | 'admin')[]
          phone?: string | null
          country?: string | null
          learner_has_paid?: boolean | null
          learner_payment_date?: string | null
          learner_payment_amount?: number | null
          learner_payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_course_progress: {
        Args: {
          user_id_param: string
          course_id_param: string
        }
        Returns: number
      }
      create_notification: {
        Args: {
          user_id_param: string
          title_param: string
          message_param: string
          type_param?: string
          action_url_param?: string
        }
        Returns: string
      }
      generate_affiliate_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_affiliate_stats: {
        Args: {
          affiliate_id_param: string
        }
        Returns: Json
      }
      get_course_stats: {
        Args: {
          course_id_param: string
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_affiliate: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: {
          user_id_param: string
        }
        Returns: number
      }
    }
    Enums: {
      lesson_type: 'video' | 'text' | 'file' | 'quiz'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
      payout_status: 'pending' | 'processing' | 'completed' | 'failed'
      user_role: 'learner' | 'affiliate' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
