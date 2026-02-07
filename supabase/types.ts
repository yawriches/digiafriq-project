export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone_number: string | null
          country: string | null
          affiliate_unlocked: boolean
          active_role: 'learner' | 'affiliate'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          country?: string | null
          affiliate_unlocked?: boolean
          active_role?: 'learner' | 'affiliate'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          country?: string | null
          affiliate_unlocked?: boolean
          active_role?: 'learner' | 'affiliate'
          created_at?: string
          updated_at?: string | null
        }
      }
      user_memberships: {
        Row: {
          id: string
          user_id: string
          membership_id: string
          started_at: string
          expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          membership_id: string
          started_at: string
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          membership_id?: string
          started_at?: string
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      membership_packages: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          currency: string
          duration_months: number
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          price: number
          currency: string
          duration_months: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          currency?: string
          duration_months?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          instructor_id: string
          estimated_duration: number | null
          category: string | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          instructor_id: string
          estimated_duration?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          instructor_id?: string
          estimated_duration?: number | null
          category?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      course_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
          completed_at: string | null
          progress_percentage: number | null
          last_accessed_lesson_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
          completed_at?: string | null
          progress_percentage?: number | null
          last_accessed_lesson_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string
          completed_at?: string | null
          progress_percentage?: number | null
          last_accessed_lesson_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          membership_id: string | null
          course_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed'
          payment_type: 'membership' | 'course' | null
          provider: 'paystack' | 'kora' | null
          provider_reference: string | null
          base_amount: number | null
          base_currency: string | null
          base_currency_amount: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          membership_id?: string | null
          course_id?: string | null
          amount: number
          currency: string
          status?: 'pending' | 'completed' | 'failed'
          payment_type?: 'membership' | 'course' | null
          provider?: 'paystack' | 'kora' | null
          provider_reference?: string | null
          base_amount?: number | null
          base_currency?: string | null
          base_currency_amount?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          membership_id?: string | null
          course_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          payment_type?: 'membership' | 'course' | null
          provider?: 'paystack' | 'kora' | null
          provider_reference?: string | null
          base_amount?: number | null
          base_currency?: string | null
          base_currency_amount?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      affiliate_users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone_number: string | null
          country: string | null
          affiliate_unlocked: boolean
          active_role: 'learner' | 'affiliate'
          created_at: string
          membership_id: string
          membership_started_at: string
        }
      }
    }
    Functions: {
      check_affiliate_eligibility: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
  }
}
