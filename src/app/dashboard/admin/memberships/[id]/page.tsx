"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Users, Crown, DollarSign, Calendar, CheckCircle, XCircle, BookOpen, TrendingUp } from 'lucide-react'
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
  created_at: string
  updated_at: string
}

interface CourseAccess {
  id: string
  course_id: string
  courses: {
    id: string
    title: string
    description: string
    price: number
    is_published: boolean
  }
}

interface PromotionRight {
  id: string
  promotable_membership_id: string
  commission_rate: number
  membership_packages: {
    id: string
    name: string
    price: number
    member_type: string
  }
}

interface UserMembership {
  id: string
  user_id: string
  is_active: boolean
  started_at: string
  expires_at: string
  created_at: string
  profiles: {
    full_name: string
    email: string
  }
}

export default function MembershipDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [membership, setMembership] = useState<MembershipPackage | null>(null)
  const [courseAccess, setCourseAccess] = useState<CourseAccess[]>([])
  const [promotionRights, setPromotionRights] = useState<PromotionRight[]>([])
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchMembershipDetails(id)
    }
  }, [id])

  const fetchMembershipDetails = async (id: string) => {
    try {
      setLoading(true)

      // Fetch membership package
      console.log('Fetching membership with ID:', id)
      const { data: membershipData, error: membershipError } = await supabase
        .from('membership_packages')
        .select('*')
        .eq('id', id)
        .single()

      console.log('Membership query result:', { membershipData, membershipError })
      if (membershipError) throw membershipError
      setMembership(membershipData)

      // Fetch course access if learner membership
      if (membershipData.member_type === 'learner') {
        try {
          const { data: courseData, error: courseError } = await supabase
            .from('membership_course_access')
            .select(`
              id,
              course_id,
              courses (
                id,
                title,
                description,
                price,
                is_published
              )
            `)
            .eq('membership_package_id', id)

          if (courseError) {
            console.warn('Failed to fetch course access:', courseError)
          } else {
            setCourseAccess(courseData || [])
          }
        } catch (courseError) {
          console.warn('Failed to fetch course access:', courseError)
          setCourseAccess([])
        }
      }

      // Fetch promotion rights if affiliate membership
      if (membershipData.member_type === 'affiliate') {
        try {
          const { data: promotionData, error: promotionError } = await supabase
            .from('membership_promotion_rights')
            .select(`
              id,
              promotable_membership_id,
              commission_rate,
              membership_packages!promotable_membership_id (
                id,
                name,
                price,
                member_type
              )
            `)
            .eq('membership_package_id', id)

          if (promotionError) {
            console.warn('Failed to fetch promotion rights:', promotionError)
          } else {
            setPromotionRights(promotionData || [])
          }
        } catch (promotionError) {
          console.warn('Failed to fetch promotion rights:', promotionError)
          setPromotionRights([])
        }
      }

      // Fetch user memberships (make this optional to not break the page if it fails)
      try {
        const { data: userData, error: userError } = await supabase
          .from('user_memberships')
          .select(`
            id,
            user_id,
            is_active,
            started_at,
            expires_at,
            created_at,
            profiles (
              full_name,
              email
            )
          `)
          .eq('membership_package_id', id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (userError) {
          console.warn('Failed to fetch user memberships:', userError)
        } else {
          setUserMemberships(userData || [])
        }
      } catch (userError) {
        console.warn('Failed to fetch user memberships:', userError)
        setUserMemberships([])
      }

    } catch (error) {
      console.error('Error fetching membership details:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error(`Failed to load membership details: ${error instanceof Error ? error.message : 'Unknown error'}`)
      router.push('/dashboard/admin/memberships')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/admin/memberships')
  }

  const handleEdit = () => {
    router.push(`/dashboard/admin/memberships/${params.id}/edit`)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMemberTypeIcon = (type: string) => {
    return type === 'learner' ? <Users className="h-5 w-5" /> : <Crown className="h-5 w-5" />
  }

  const getMemberTypeBadge = (type: string) => {
    return type === 'learner' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Users className="h-4 w-4 mr-1" />
        Learner
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
        <Crown className="h-4 w-4 mr-1" />
        Affiliate
      </Badge>
    )
  }

  const getStatusBadge = (userMembership: UserMembership) => {
    const isExpired = new Date(userMembership.expires_at) <= new Date()
    const isActive = userMembership.is_active && !isExpired
    
    if (isActive) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    } else if (isExpired) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Loading...">
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
      title={membership.name}
      headerAction={
        <div className="flex gap-2">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Memberships
          </Button>
          <Button onClick={handleEdit} className="bg-[#ed874a] hover:bg-[#d67635]">
            <Edit className="h-4 w-4 mr-2" />
            Edit Membership
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{membership.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    {getMemberTypeBadge(membership.member_type)}
                    <Badge variant={membership.is_active ? "default" : "secondary"}>
                      {membership.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#ed874a]">
                    {formatPrice(membership.price, membership.currency)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {membership.duration_months} month{membership.duration_months !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">
                    {membership.description || 'No description provided.'}
                  </p>
                </div>

                {membership.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {membership.features.map((feature, index) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{formatDate(membership.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">{formatDate(membership.updated_at || membership.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userMemberships.filter(um => um.is_active && new Date(um.expires_at) > new Date()).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(userMemberships.length * membership.price, membership.currency)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-[#ed874a]/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-[#ed874a]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {membership.member_type === 'learner' && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Course Access</p>
                      <p className="text-2xl font-bold text-gray-900">{courseAccess.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {membership.member_type === 'affiliate' && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Promotion Rights</p>
                      <p className="text-2xl font-bold text-gray-900">{promotionRights.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Course Access Section (Learner) */}
        {membership.member_type === 'learner' && courseAccess.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Course Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courseAccess.map((access) => (
                  <div key={access.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{access.courses.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {access.courses.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant={access.courses.is_published ? "default" : "secondary"}>
                        {access.courses.is_published ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatPrice(access.courses.price, membership.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Promotion Rights Section (Affiliate) */}
        {membership.member_type === 'affiliate' && promotionRights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Promotion Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotionRights.map((right) => (
                  <div key={right.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{right.membership_packages.name}</h4>
                        <p className="text-sm text-gray-600">
                          {formatPrice(right.membership_packages.price, membership.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#ed874a]">{right.commission_rate}%</p>
                        <p className="text-xs text-gray-600">Commission</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Members */}
        {userMemberships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userMemberships.map((userMembership) => (
                  <div key={userMembership.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {userMembership.profiles.full_name || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-gray-600">{userMembership.profiles.email}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(userMembership)}
                      <p className="text-xs text-gray-600 mt-1">
                        Joined {formatDate(userMembership.started_at)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Expires {formatDate(userMembership.expires_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminDashboardLayout>
  )
}
