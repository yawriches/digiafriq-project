"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import MembershipFormPage from '@/components/dashboard/MembershipFormPage'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MembershipPackage {
  id: string
  name: string
  description: string
  price: number
  currency: string
  duration_months: number
  member_type: 'learner' | 'affiliate'
  is_active: boolean
  features: string[]
}

export default function EditMembershipPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [membership, setMembership] = useState<MembershipPackage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchMembership(id)
    }
  }, [id])

  const fetchMembership = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('membership_packages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setMembership(data)
    } catch (error) {
      console.error('Error fetching membership:', error)
      toast.error('Failed to load membership')
      router.push('/dashboard/admin/memberships')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/admin/memberships')
  }

  const handleSuccess = () => {
    router.push('/dashboard/admin/memberships')
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Edit Membership Package">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ed874a]"></div>
        </div>
      </AdminDashboardLayout>
    )
  }

  if (!membership) {
    return (
      <AdminDashboardLayout title="Membership Not Found">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Membership package not found.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Memberships
          </Button>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout
      title={`Edit ${membership.name}`}
      headerAction={
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Memberships
        </Button>
      }
    >
      <MembershipFormPage
        membership={membership}
        onSuccess={handleSuccess}
        onCancel={handleBack}
      />
    </AdminDashboardLayout>
  )
}
