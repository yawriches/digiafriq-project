"use client"
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { 
  User, 
  CreditCard,
  Save,
  Edit,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProfile } from '@/lib/hooks/useProfile'
import { useAuth } from '@/lib/supabase/auth'
import { useMembershipDetails } from '@/lib/hooks/useMembershipDetails'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

const UnifiedProfilePage = () => {
  const router = useRouter()
  const { profile: authProfile } = useAuth()
  const { hasDCS, loading: dcsLoading } = useMembershipDetails()
  
  // Generate a random avatar for the user
  const [userAvatar, setUserAvatar] = useState('')
  
  useEffect(() => {
    // Generate a random avatar based on user ID or email
    const avatarSeed = authProfile?.id || authProfile?.email || Math.random().toString()
    const avatarUrl = `https://picsum.photos/seed/${avatarSeed}/200/200.jpg`
    setUserAvatar(avatarUrl)
  }, [authProfile?.id, authProfile?.email])
  
  const { 
    profile, 
    profileForm, 
    paymentMethods,
    loading, 
    error, 
    isEditing, 
    setIsEditing, 
    updateProfileForm, 
    saveProfile, 
    changePassword,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod
  } = useProfile()

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Payment methods form state (for affiliates)
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    network: '',
    mobileNumber: ''
  })
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [editingPayment, setEditingPayment] = useState<any>(null)

  // Check if user has affiliate access
  const hasAffiliateAccess = hasDCS || authProfile?.available_roles?.includes('affiliate')

  if (loading || dcsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-2 text-gray-600">Loading your profile...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading profile: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 hover:bg-red-700"
        >
          Retry
        </Button>
      </div>
    )
  }

  const handleProfileUpdate = async () => {
    try {
      await saveProfile()
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(`Failed to update profile: ${err.message}`)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match!')
      return
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long!')
      return
    }
    
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      toast.success('Password changed successfully!')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err: any) {
      toast.error(`Failed to change password: ${err.message}`)
    }
  }

  // Payment method handlers (for affiliates) - uses hook functions that persist to database
  const handleAddPaymentMethod = async () => {
    if (newPaymentMethod.type === 'bank' && (!newPaymentMethod.bankName || !newPaymentMethod.accountNumber || !newPaymentMethod.accountName)) {
      toast.error('Please fill in all bank details')
      return
    }
    if (newPaymentMethod.type === 'mobile' && (!newPaymentMethod.network || !newPaymentMethod.mobileNumber)) {
      toast.error('Please fill in all mobile money details')
      return
    }

    const existingMethod = paymentMethods.find(method => method.type === newPaymentMethod.type)
    if (existingMethod) {
      toast.error(`You can only have one ${newPaymentMethod.type === 'bank' ? 'bank account' : 'mobile money'} method. Please delete the existing one first.`)
      return
    }

    try {
      if (newPaymentMethod.type === 'bank') {
        await addPaymentMethod({
          type: 'bank',
          bankName: newPaymentMethod.bankName,
          accountNumber: newPaymentMethod.accountNumber,
          accountName: newPaymentMethod.accountName,
          isDefault: paymentMethods.length === 0
        })
      } else if (newPaymentMethod.type === 'mobile') {
        await addPaymentMethod({
          type: 'mobile',
          network: newPaymentMethod.network,
          mobileNumber: newPaymentMethod.mobileNumber,
          isDefault: paymentMethods.length === 0
        })
      }

      setNewPaymentMethod({
        type: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        network: '',
        mobileNumber: ''
      })
      setShowAddPayment(false)
      toast.success('Payment method added successfully!')
    } catch (err: any) {
      toast.error(`Failed to add payment method: ${err.message}`)
    }
  }

  const handleDeletePaymentMethod = async (id: number) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      try {
        await deletePaymentMethod(id)
        toast.success('Payment method deleted')
      } catch (err: any) {
        toast.error(`Failed to delete payment method: ${err.message}`)
      }
    }
  }

  const handleSetDefaultPayment = async (id: number) => {
    try {
      await setDefaultPaymentMethod(id)
      toast.success('Default payment method updated')
    } catch (err: any) {
      toast.error(`Failed to set default payment method: ${err.message}`)
    }
  }

  const handleEditPaymentMethod = (method: any) => {
    setEditingPayment(method)
    setNewPaymentMethod({
      type: method.type,
      bankName: method.type === 'bank' ? method.bankName : '',
      accountNumber: method.type === 'bank' ? method.accountNumber : '',
      accountName: method.type === 'bank' ? method.accountName : '',
      network: method.type === 'mobile' ? method.network : '',
      mobileNumber: method.type === 'mobile' ? method.mobileNumber : ''
    })
    setShowAddPayment(true)
  }

  const handleUpdatePaymentMethod = async () => {
    if (newPaymentMethod.type === 'bank' && (!newPaymentMethod.bankName || !newPaymentMethod.accountNumber || !newPaymentMethod.accountName)) {
      toast.error('Please fill in all bank details')
      return
    }
    if (newPaymentMethod.type === 'mobile' && (!newPaymentMethod.network || !newPaymentMethod.mobileNumber)) {
      toast.error('Please fill in all mobile money details')
      return
    }

    if (!editingPayment) return

    try {
      if (newPaymentMethod.type === 'bank') {
        await updatePaymentMethod(editingPayment.id, {
          type: 'bank',
          bankName: newPaymentMethod.bankName,
          accountNumber: newPaymentMethod.accountNumber,
          accountName: newPaymentMethod.accountName
        })
      } else if (newPaymentMethod.type === 'mobile') {
        await updatePaymentMethod(editingPayment.id, {
          type: 'mobile',
          network: newPaymentMethod.network,
          mobileNumber: newPaymentMethod.mobileNumber
        })
      }
      
      setNewPaymentMethod({
        type: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        network: '',
        mobileNumber: ''
      })
      setShowAddPayment(false)
      setEditingPayment(null)
      toast.success('Payment method updated successfully!')
    } catch (err: any) {
      toast.error(`Failed to update payment method: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture - Random Avatar */}
              <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="Profile Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#ed874a] to-[#d76f32] flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {profileForm.firstName.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Profile avatar is automatically generated</p>
                  <p className="text-xs text-gray-500">Cannot be changed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => updateProfileForm('firstName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => updateProfileForm('lastName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => updateProfileForm('email', e.target.value)}
                  disabled={true}
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => updateProfileForm('phone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sex
                  </label>
                  <select 
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                    value={profileForm.sex}
                    onChange={(e) => updateProfileForm('sex', e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => updateProfileForm('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={profileForm.country}
                    onChange={(e) => updateProfileForm('country', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    value={profileForm.city}
                    onChange={(e) => updateProfileForm('city', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <Button onClick={handleProfileUpdate} className="bg-[#ed874a] hover:bg-[#d76f32]">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment Details - Only show for affiliates */}
          {hasAffiliateAccess && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Details
                  </CardTitle>
                  {paymentMethods.length < 2 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAddPayment(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Method
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method: any) => (
                  <div key={method.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">
                            {method.type === 'bank' ? 'Bank Transfer' : 'Mobile Money'}
                          </span>
                          {method.isDefault && (
                            <span className="bg-[#ed874a] text-white text-xs px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        
                        {method.type === 'bank' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Bank: {method.bankName}</div>
                            <div>Account: {method.accountNumber}</div>
                            <div>Name: {method.accountName}</div>
                          </div>
                        )}
                        
                        {method.type === 'mobile' && (
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Network: {method.network?.toUpperCase()}</div>
                            <div>Number: {method.mobileNumber}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPaymentMethod(method)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultPayment(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {paymentMethods.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No payment methods added yet</p>
                    <p className="text-sm">Add a payment method to receive withdrawals</p>
                  </div>
                )}

                {/* Add/Edit Payment Method Form */}
                {showAddPayment && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-4">
                      {editingPayment ? 'Edit Payment Method' : 'Add New Payment Method'}
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Type
                        </label>
                        <select 
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                          value={newPaymentMethod.type}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, type: e.target.value})}
                        >
                          <option value="">Select Type</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="mobile">Mobile Money</option>
                        </select>
                      </div>

                      {newPaymentMethod.type === 'bank' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bank Name
                            </label>
                            <Input
                              placeholder="Enter bank name"
                              value={newPaymentMethod.bankName}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, bankName: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Number
                            </label>
                            <Input
                              placeholder="Enter account number"
                              value={newPaymentMethod.accountNumber}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountNumber: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Name
                            </label>
                            <Input
                              placeholder="Enter account holder name"
                              value={newPaymentMethod.accountName}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, accountName: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      {newPaymentMethod.type === 'mobile' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mobile Network
                            </label>
                            <select 
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                              value={newPaymentMethod.network}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, network: e.target.value})}
                            >
                              <option value="">Select network</option>
                              <option value="mtn">MTN Mobile Money</option>
                              <option value="vodafone">Vodafone Cash</option>
                              <option value="airteltigo">AirtelTigo Money</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mobile Number
                            </label>
                            <Input
                              placeholder="Enter mobile number"
                              value={newPaymentMethod.mobileNumber}
                              onChange={(e) => setNewPaymentMethod({...newPaymentMethod, mobileNumber: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      <div className="flex space-x-4">
                        <Button
                          onClick={() => {
                            setShowAddPayment(false)
                            setEditingPayment(null)
                            setNewPaymentMethod({
                              type: '',
                              bankName: '',
                              accountNumber: '',
                              accountName: '',
                              network: '',
                              mobileNumber: ''
                            })
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={editingPayment ? handleUpdatePaymentMethod : handleAddPaymentMethod}
                          className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
                          disabled={!newPaymentMethod.type}
                        >
                          {editingPayment ? 'Update Payment Method' : 'Add Payment Method'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Account Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 mx-auto mb-4">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="Profile Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#ed874a] to-[#d76f32] flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">
                        {profileForm.firstName.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg">
                  {profileForm.firstName} {profileForm.lastName}
                </h3>
                <p className="text-sm text-gray-500">{profileForm.email}</p>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Account Type</span>
                  <span className="font-medium">
                    {hasAffiliateAccess ? 'Learner + Affiliate' : 'Learner'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Country</span>
                  <span className="font-medium">{profileForm.country || 'Not set'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{profileForm.phone || 'Not set'}</span>
                </div>
              </div>

              {hasAffiliateAccess && (
                <div className="border-t pt-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 font-medium">✓ Affiliate Access Enabled</p>
                    <p className="text-xs text-green-600 mt-1">You can receive commission payments</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UnifiedProfilePage
