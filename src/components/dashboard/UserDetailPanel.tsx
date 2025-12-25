"use client"
import React, { useState, useEffect } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  CreditCard, 
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BookOpen,
  Users,
  Crown,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { User as UserType, UserActivity, UserPayment, UserDetailTab, PaginatedResponse } from '@/types/user-management'
import { fetchUserActivity, fetchUserPayments, updateUserStatus, updateUserRole } from '@/lib/api/users'

interface UserDetailPanelProps {
  user: UserType | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { formatAmount, formatAmountWithCurrency } = useCurrency()
  const [activeTab, setActiveTab] = useState<UserDetailTab>('overview')
  const [activity, setActivity] = useState<PaginatedResponse<UserActivity> | null>(null)
  const [payments, setPayments] = useState<PaginatedResponse<UserPayment> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      loadUserData()
    }
  }, [user, isOpen])

  const loadUserData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [activityData, paymentsData] = await Promise.all([
        fetchUserActivity(user.id),
        fetchUserPayments(user.id)
      ])
      setActivity(activityData)
      setPayments(paymentsData)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'active' | 'suspended' | 'pending') => {
    if (!user) return

    try {
      await updateUserStatus(user.id, newStatus)
      onUpdate()
    } catch (error: any) {
      console.error('Error updating user status:', error)
      alert(error.message || 'Failed to update user status. The status field may not be available in the database yet.')
    }
  }

  const handleRoleChange = async (newRole: 'learner' | 'affiliate' | 'admin') => {
    if (!user) return

    try {
      await updateUserRole(user.id, newRole)
      onUpdate()
    } catch (error: any) {
      console.error('Error updating user role:', error)
      alert(error.message || 'Failed to update user role. Please check your permissions.')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'affiliate': return <Crown className="w-4 h-4" />
      case 'learner': return <GraduationCap className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'affiliate': return 'bg-orange-100 text-orange-700'
      case 'learner': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'suspended': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (!user) return null

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col h-full max-h-screen">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.full_name || 'Unknown User'}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs - Scrollable Container */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserDetailTab)} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b border-gray-200 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className={`grid gap-4 ${user.role === 'affiliate' || user.role === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(user.status || 'active')}
                          <Badge className={getStatusBadgeColor(user.status || 'active')}>
                            {user.status || 'active'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleIcon(user.role)}
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Member Since</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          {user.role === 'affiliate' || user.role === 'admin' ? 'Total Commissions' : 'Total Spent'}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {user.role === 'affiliate' || user.role === 'admin' 
                            ? formatAmount(user.total_commissions || 0)
                            : formatAmount(payments?.data.reduce((sum, p) => sum + p.amount, 0) || 0)
                          }
                        </p>
                      </div>
                      <DollarSign className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Additional cards for affiliates and admins */}
                {(user.role === 'affiliate' || user.role === 'admin') && (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Referrals</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {user.referral_count || 0}
                            </p>
                          </div>
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Withdrawals</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatAmount(user.total_withdrawals || 0)}
                            </p>
                          </div>
                          <CreditCard className="w-5 h-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    {user.status !== 'active' && (
                      <Button
                        onClick={() => handleStatusChange('active')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activate User
                      </Button>
                    )}
                    {user.status !== 'suspended' && (
                      <Button
                        onClick={() => handleStatusChange('suspended')}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Suspend User
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{user.full_name || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Address</label>
                      <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="mt-1 text-sm text-gray-900">{user.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Country</label>
                      <p className="mt-1 text-sm text-gray-900">{user.country || 'Not set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">User ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Active Role</label>
                      <p className="mt-1 text-sm text-gray-900">{user.active_role}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Available Roles</label>
                      <p className="mt-1 text-sm text-gray-900">{user.available_roles.join(', ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(user.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : activity && activity.data.length > 0 ? (
                activity.data.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-full ${
                            item.activity_type === 'payment' ? 'bg-blue-100' :
                            item.activity_type === 'commission' ? 'bg-green-100' :
                            item.activity_type === 'withdrawal' ? 'bg-orange-100' :
                            'bg-gray-100'
                          }`}>
                            {item.activity_type === 'payment' && <CreditCard className="w-4 h-4 text-blue-600" />}
                            {item.activity_type === 'commission' && <DollarSign className="w-4 h-4 text-green-600" />}
                            {item.activity_type === 'withdrawal' && <Activity className="w-4 h-4 text-orange-600" />}
                            {item.activity_type === 'other' && <Activity className="w-4 h-4 text-gray-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900">{item.action}</p>
                              {item.amount && (
                                <span className={`text-sm font-semibold ${
                                  item.activity_type === 'commission' ? 'text-green-600' :
                                  item.activity_type === 'withdrawal' ? 'text-orange-600' :
                                  'text-blue-600'
                                }`}>
                                  {formatAmountWithCurrency(item.amount, item.currency || 'USD')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                            {item.referral_user_name && (
                              <p className="text-sm text-gray-600 mt-1">
                                Referral from: <span className="font-medium">{item.referral_user_name}</span>
                              </p>
                            )}
                            {item.details && Object.keys(item.details).length > 0 && (
                              <div className="mt-2 text-xs text-gray-500">
                                {item.details.reference && (
                                  <p>Ref: {item.details.reference}</p>
                                )}
                                {item.details.commission_rate && (
                                  <p>Commission Rate: {(item.details.commission_rate * 100).toFixed(1)}%</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No activity recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : payments && payments.data.length > 0 ? (
                payments.data.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {formatAmountWithCurrency(payment.amount, payment.currency)}
                            </p>
                            <Badge className={
                              payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(payment.created_at).toLocaleString()}
                          </p>
                          {payment.paystack_reference && (
                            <p className="text-xs text-gray-400 mt-1">
                              Ref: {payment.paystack_reference}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center text-gray-500">
                    <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No payments found</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change User Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleRoleChange('learner')}
                      variant={user.role === 'learner' ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Learner
                    </Button>
                    <Button
                      onClick={() => handleRoleChange('affiliate')}
                      variant={user.role === 'affiliate' ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Affiliate
                    </Button>
                    <Button
                      onClick={() => handleRoleChange('admin')}
                      variant={user.role === 'admin' ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleStatusChange('active')}
                      variant={user.status === 'active' ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('pending')}
                      variant={user.status === 'pending' ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Pending
                    </Button>
                    <Button
                      onClick={() => handleStatusChange('suspended')}
                      variant={user.status === 'suspended' ? 'default' : 'outline'}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Suspended
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
