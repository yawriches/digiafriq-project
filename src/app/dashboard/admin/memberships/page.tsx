"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Users, Crown, DollarSign, Calendar, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
// import MembershipDetails from '@/components/dashboard/MembershipDetails'

interface MembershipPackage {
  id: string
  name: string
  description: string
  price: number
  currency: string
  duration_months: number
  member_type: 'member'
  is_active: boolean
  features: string[]
  created_at: string
  course_count?: number
  active_members?: number
  membership_course_access?: any[]
  user_memberships?: any[]
}

export default function MembershipsPage() {
  const router = useRouter()
  const [memberships, setMemberships] = useState<MembershipPackage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      setLoading(true)
      
      // Fetch membership packages with additional counts
      const { data: packages, error } = await supabase
        .from('membership_packages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process the data to include counts
      const processedPackages = packages?.map((pkg: any) => ({
        ...pkg,
        course_count: 0, // Will be fetched separately if needed
        promotion_count: 0, // Will be fetched separately if needed
        active_members: 0, // Will be fetched separately if needed
        features: Array.isArray(pkg.features) ? pkg.features : []
      })) || []

      setMemberships(processedPackages)
    } catch (error) {
      console.error('Error fetching memberships:', error)
      toast.error('Failed to load memberships')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMembership = () => {
    router.push('/dashboard/admin/memberships/create')
  }

  const handleEditMembership = (membership: MembershipPackage) => {
    router.push(`/dashboard/admin/memberships/${membership.id}/edit`)
  }

  const handleViewMembership = (membership: MembershipPackage) => {
    router.push(`/dashboard/admin/memberships/${membership.id}`)
  }

  const handleDeleteMembership = async (membershipId: string) => {
    if (!confirm('Are you sure you want to delete this membership package? This action cannot be undone.')) {
      return
    }

    try {
      console.log('Attempting to delete membership:', membershipId)
      setLoading(true)
      
      const { error } = await supabase
        .from('membership_packages')
        .delete()
        .eq('id', membershipId)

      if (error) throw error

      console.log('Delete successful, showing toast')
      toast.success('Membership package deleted successfully')
      
      // Refetch memberships
      await fetchMemberships()
    } catch (error) {
      console.error('Error deleting membership:', error)
      console.log('Delete failed, showing error toast')
      toast.error('Failed to delete membership package')
      setLoading(false)
    }
  }

  const toggleMembershipStatus = async (membershipId: string, currentStatus: boolean) => {
    try {
      console.log('Toggling membership status:', membershipId, 'from', currentStatus, 'to', !currentStatus)
      setLoading(true)
      
      const { error } = await supabase
        .from('membership_packages')
        .update({ is_active: !currentStatus })
        .eq('id', membershipId)

      if (error) throw error

      console.log('Status toggle successful, showing toast')
      toast.success(`Membership ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      
      // Refetch memberships
      await fetchMemberships()
    } catch (error) {
      console.error('Error updating membership status:', error)
      console.log('Status toggle failed, showing error toast')
      toast.error('Failed to update membership status')
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    // Default to GHS if currency is empty or invalid
    const validCurrency = currency && currency.trim().length === 3 ? currency.toUpperCase() : 'GHS'
    try {
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: validCurrency,
      }).format(price)
    } catch (error) {
      // Fallback if currency is still invalid
      return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
      }).format(price)
    }
  }

  const getMemberTypeIcon = (type: string) => {
    return type === 'learner' ? <Users className="h-4 w-4" /> : <Crown className="h-4 w-4" />
  }

  const getMemberTypeBadge = (type: string) => {
    return type === 'learner' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Users className="h-3 w-3 mr-1" />
        Learner
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
        <Crown className="h-3 w-3 mr-1" />
        Affiliate
      </Badge>
    )
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
      title="Membership Packages"
      headerAction={
        <Button onClick={handleCreateMembership} className="bg-[#ed874a] hover:bg-[#d67635]">
          <Plus className="h-4 w-4 mr-2" />
          Create Membership
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ed874a]"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Packages</p>
                    <p className="text-2xl font-bold text-gray-900">{memberships.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Packages</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {memberships.filter(m => m.is_active).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Learner Packages</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {memberships.filter(m => m.member_type === 'learner').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Affiliate Packages</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {memberships.filter(m => m.member_type === 'affiliate').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Memberships Grid */}
          {memberships.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No membership packages yet</h3>
                <p className="text-gray-600 mb-6">Create your first membership package to get started.</p>
                <Button onClick={handleCreateMembership} className="bg-[#ed874a] hover:bg-[#d67635]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Membership
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberships.map((membership) => (
                <Card key={membership.id} className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
                  {/* Status Indicator */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${membership.is_active ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`} />
                  
                  {/* Member Type Corner Badge */}
                  <div className="absolute top-4 right-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      membership.member_type === 'learner' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                      {getMemberTypeIcon(membership.member_type)}
                      <span className="ml-1">{membership.member_type === 'learner' ? 'Learner' : 'Affiliate'}</span>
                    </div>
                  </div>

                  <CardHeader className="pb-4 pt-6">
                    <div className="pr-20">
                      <CardTitle className="text-xl font-bold mb-2 text-gray-900 group-hover:text-[#ed874a] transition-colors">
                        {membership.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={membership.is_active ? "default" : "secondary"} className={`${
                          membership.is_active 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {membership.is_active ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-gray-600 line-clamp-2 leading-relaxed">
                      {membership.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-5">
                    {/* Price Section */}
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(membership.price, membership.currency)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {membership.duration_months} month{membership.duration_months !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Renews at</div>
                          <div className="text-lg font-semibold text-[#ed874a]">
                            {formatPrice(membership.price, membership.currency)}
                          </div>
                          <div className="text-xs text-gray-500">per year</div>
                        </div>
                      </div>
                                          </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-[#ed874a]/30 transition-colors">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {membership.course_count}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          Courses
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-[#ed874a]/30 transition-colors">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {membership.active_members}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Active Members</div>
                      </div>
                    </div>

                    {/* Features Preview */}
                    {membership.features.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Key Features</p>
                        <div className="flex flex-wrap gap-1.5">
                          {membership.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-white border-gray-200 text-gray-700 hover:border-[#ed874a]/50">
                              {feature}
                            </Badge>
                          ))}
                          {membership.features.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-[#ed874a]/5 border-[#ed874a]/20 text-[#ed874a]">
                              +{membership.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Actions Footer */}
                  <div className="px-6 pb-6">
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMembership(membership)}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMembership(membership)}
                          className="hover:bg-[#ed874a]/10 hover:text-[#ed874a] transition-colors"
                          title="Edit Membership"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMembership(membership.id)}
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete Membership"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant={membership.is_active ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleMembershipStatus(membership.id, membership.is_active)}
                        className={`font-medium transition-all ${
                          membership.is_active 
                            ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" 
                            : "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        }`}
                      >
                        {membership.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

    </AdminDashboardLayout>
    </Suspense>
  )
}
