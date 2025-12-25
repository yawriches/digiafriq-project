"use client"
import React, { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import MembershipFormPage from '@/components/dashboard/MembershipFormPage'
import { toast } from 'sonner'

export default function CreateMembershipPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/dashboard/admin/memberships')
  }

  const handleSuccess = () => {
    router.push('/dashboard/admin/memberships')
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-2 border-[#ed874a] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AdminDashboardLayout
      title="Create Membership Package"
      headerAction={
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Memberships
        </Button>
      }
    >
      <MembershipFormPage
        onSuccess={handleSuccess}
        onCancel={handleBack}
      />
    </AdminDashboardLayout>
    </Suspense>
  )
}
