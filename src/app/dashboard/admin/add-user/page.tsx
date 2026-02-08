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
import { useAuth } from '@/lib/supabase/auth'
import { toast } from 'sonner'

interface FormData {
  email: string
  password: string
  firstName: string
  lastName: string
  roles: string[]
}

const AddUserPage = () => {
  const { session } = useAuth()
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
      if (!session?.access_token) {
        toast.error('Session expired. Please refresh the page.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roles: formData.roles
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New User</h1>
          <p className="text-gray-500">Create a new user account and assign roles directly from the admin dashboard</p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* User Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  User Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="John"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="john.doe@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                  </div>
                </div>
              </div>

              {/* Role Selection Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
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
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? role.color : 'bg-gray-300'
                          }`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{role.label}</h3>
                            <p className="text-xs text-gray-500">{role.description}</p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <p className="mt-3 text-sm text-gray-500">
                  Select one or more roles for this user. The first selected role will be set as their active role.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {formData.roles.length > 0 && (
                    <span>Selected roles: <span className="text-gray-900 font-medium">{formData.roles.join(', ')}</span></span>
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#ed874a] hover:bg-[#d6783f] text-white px-8"
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
