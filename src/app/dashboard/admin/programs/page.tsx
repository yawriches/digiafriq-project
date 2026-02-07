"use client"
import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import ProgramsManager from '@/components/admin/ProgramsManager'

export default function ProgramsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    }>
      <AdminDashboardLayout title="Programs">
        <ProgramsManager />
      </AdminDashboardLayout>
    </Suspense>
  )
}
