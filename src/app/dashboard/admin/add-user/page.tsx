"use client"
import React, { useState } from 'react'
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Shield, 
  Users, 
  GraduationCap,
  Crown,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface FormData {
  email: string
  password: string
  firstName: string
  lastName: string
  roles: string[]
}

const AddUserPage = () => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roles: ['learner']
  })

  const availableRoles = [
    { id: 'learner', label: 'Learner', icon: GraduationCap, color: 'bg-blue-500', description: 'Can access courses and learning materials' },
    { id: 'affiliate', label: 'Affiliate', icon: Crown, color: 'bg-orange-500', description: 'Can refer users and earn commissions' },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-red-500', description: 'Full administrative access' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.roles.length === 0) {
      toast.error('Please select at least one role')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Create the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          active_role: formData.roles[0], // Set first selected role as active
          available_roles: formData.roles,
          created_at: new Date().toISOString()
        })

      if (profileError) {
        throw profileError
      }

      // If affiliate role is selected, create affiliate profile
      if (formData.roles.includes('affiliate')) {
        const { error: affiliateError } = await supabase
          .from('affiliate_profiles')
          .insert({
            user_id: authData.user.id,
            unique_affiliate_code: `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}${Math.random().toString(36).substr(2, 5)}`,
            status: 'active',
            created_at: new Date().toISOString()
          })

        if (affiliateError) {
          console.error('Failed to create affiliate profile:', affiliateError)
          // Don't throw error here, user is still created successfully
        }
      }

      toast.success(`User ${formData.email} created successfully with roles: ${formData.roles.join(', ')}`)

      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        roles: ['learner']
      })

    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminDashboardLayout title="Add User">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Add New User</h1>
          <p className="text-gray-300">Create a new user account and assign roles directly from the admin dashboard</p>
        </div>

        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-gray-700/50">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* User Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  User Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="John"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 bg-gray-800 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Minimum 6 characters</p>
                  </div>
                </div>
              </div>

              {/* Role Selection Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Role Assignment
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableRoles.map((role) => {
                    const Icon = role.icon
                    const isSelected = formData.roles.includes(role.id)
                    
                    return (
                      <div
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500/50 bg-gradient-to-br from-blue-600/20 to-purple-600/20'
                            : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? role.color : 'bg-gray-700'
                          }`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">{role.label}</h3>
                            <p className="text-xs text-gray-400">{role.description}</p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-600 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <p className="mt-3 text-sm text-gray-400">
                  Select one or more roles for this user. The first selected role will be set as their active role.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-700/50">
                <div className="text-sm text-gray-400">
                  {formData.roles.length > 0 && (
                    <span>Selected roles: <span className="text-white font-medium">{formData.roles.join(', ')}</span></span>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({
                      email: '',
                      password: '',
                      firstName: '',
                      lastName: '',
                      roles: ['learner']
                    })}
                    className="border-gray-600/50 text-gray-300 hover:bg-gray-800"
                  >
                    Clear
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  )
}

export default AddUserPage
