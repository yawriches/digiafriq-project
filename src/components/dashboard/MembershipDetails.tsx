"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Edit, Users, Crown, DollarSign, Calendar, BookOpen, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
  price: number
  thumbnail_url?: string
}

interface PromotablePackage {
  id: string
  name: string
  price: number
  commission_rate: number
}

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
}

interface MembershipDetailsProps {
  membership: MembershipPackage
  onClose: () => void
  onEdit: () => void
}

export default function MembershipDetails({ membership, onClose, onEdit }: MembershipDetailsProps) {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [promotablePackages, setPromotablePackages] = useState<PromotablePackage[]>([])
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  })

  useEffect(() => {
    fetchMembershipDetails()
  }, [membership.id])

  const fetchMembershipDetails = async () => {
    try {
      setLoading(true)
      
      if (membership.member_type === 'learner') {
        await fetchCourseAccess()
      } else {
        await fetchPromotionRights()
      }
      
      await fetchMembershipStats()
    } catch (error) {
      console.error('Error fetching membership details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_course_access')
        .select(`
          course_id,
          courses (
            id,
            title,
            price,
            thumbnail_url
          )
        `)
        .eq('membership_package_id', membership.id)

      if (error) throw error
      
      const courseList = data?.map(item => item.courses).filter(Boolean) || []
      setCourses(courseList as Course[])
    } catch (error) {
      console.error('Error fetching course access:', error)
    }
  }

  const fetchPromotionRights = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_promotion_rights')
        .select(`
          promotable_membership_id,
          commission_rate,
          membership_packages!promotable_membership_id (
            id,
            name,
            price
          )
        `)
        .eq('membership_package_id', membership.id)

      if (error) throw error
      
      const packageList = data?.map(item => ({
        id: item.membership_packages.id,
        name: item.membership_packages.name,
        price: item.membership_packages.price,
        commission_rate: item.commission_rate
      })) || []
      
      setPromotablePackages(packageList)
    } catch (error) {
      console.error('Error fetching promotion rights:', error)
    }
  }

  const fetchMembershipStats = async () => {
    try {
      // Get total and active members
      const { data: membersData, error: membersError } = await supabase
        .from('user_memberships')
        .select('id, is_active, started_at, expires_at')
        .eq('membership_package_id', membership.id)

      if (membersError) throw membersError

      const totalMembers = membersData?.length || 0
      const activeMembers = membersData?.filter(m => 
        m.is_active && new Date(m.expires_at) > new Date()
      ).length || 0

      // Get revenue data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, paid_at, created_at')
        .eq('status', 'completed')
        .not('paid_at', 'is', null)

      if (paymentsError) throw paymentsError

      // Calculate revenue (this is simplified - you might want to link payments to memberships more directly)
      const totalRevenue = paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      
      const currentMonth = new Date()
      currentMonth.setDate(1)
      const monthlyRevenue = paymentsData?.filter(payment => 
        new Date(payment.paid_at) >= currentMonth
      ).reduce((sum, payment) => sum + payment.amount, 0) || 0

      setStats({
        totalMembers,
        activeMembers,
        totalRevenue,
        monthlyRevenue
      })
    } catch (error) {
      console.error('Error fetching membership stats:', error)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-GH', {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {membership.member_type === 'learner' ? (
                  <Users className="h-6 w-6 text-blue-600" />
                ) : (
                  <Crown className="h-6 w-6 text-purple-600" />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{membership.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={membership.member_type === 'learner' ? "secondary" : "default"}>
                      {membership.member_type === 'learner' ? 'Learner' : 'Affiliate'}
                    </Badge>
                    <Badge variant={membership.is_active ? "default" : "secondary"}>
                      {membership.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Price</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(membership.price, membership.currency)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Duration</p>
                      <p className="text-xl font-bold text-gray-900">
                        {membership.duration_months} month{membership.duration_months !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Members</p>
                      <p className="text-xl font-bold text-gray-900">{stats.totalMembers}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Members</p>
                      <p className="text-xl font-bold text-gray-900">{stats.activeMembers}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {membership.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{membership.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {membership.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features & Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {membership.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#ed874a] rounded-full"></div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Access or Promotion Rights */}
            {membership.member_type === 'learner' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Access ({courses.length} courses)
                  </CardTitle>
                  <CardDescription>
                    Courses that members have access to with this membership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ed874a]"></div>
                    </div>
                  ) : courses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No courses assigned to this membership</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            {course.thumbnail_url ? (
                              <img 
                                src={course.thumbnail_url} 
                                alt={course.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <BookOpen className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{course.title}</h4>
                            <p className="text-sm text-gray-500">
                              {formatPrice(course.price, membership.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Promotion Rights ({promotablePackages.length} packages)
                  </CardTitle>
                  <CardDescription>
                    Membership packages that affiliates can promote with this membership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ed874a]"></div>
                    </div>
                  ) : promotablePackages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No promotion rights assigned to this membership</p>
                  ) : (
                    <div className="space-y-3">
                      {promotablePackages.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                            <p className="text-sm text-gray-500">
                              {formatPrice(pkg.price, membership.currency)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-[#ed874a]">{pkg.commission_rate}%</p>
                            <p className="text-xs text-gray-500">Commission</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Membership Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Created:</span>
                    <span className="ml-2 text-gray-900">{formatDate(membership.created_at)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="ml-2">
                      <Badge variant={membership.is_active ? "default" : "secondary"}>
                        {membership.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Type:</span>
                    <span className="ml-2">
                      <Badge variant="outline">
                        {membership.member_type === 'learner' ? 'Learner Membership' : 'Affiliate Membership'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Currency:</span>
                    <span className="ml-2 text-gray-900">{membership.currency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onEdit} className="bg-[#ed874a] hover:bg-[#d67635]">
              <Edit className="h-4 w-4 mr-2" />
              Edit Membership
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
