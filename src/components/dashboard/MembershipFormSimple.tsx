"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Users, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
  price: number
  is_published: boolean
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
}

interface MembershipFormProps {
  membership?: MembershipPackage | null
  onClose: () => void
  onSuccess: () => void
}

export default function MembershipFormSimple({ membership, onClose, onSuccess }: MembershipFormProps) {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [learnerMemberships, setLearnerMemberships] = useState<MembershipPackage[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'GHS',
    duration_months: '',
    member_type: 'learner' as 'learner' | 'affiliate',
    is_active: true,
    features: [] as string[],
    selectedCourses: [] as string[],
    selectedPromotions: [] as string[]
  })
  
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchCourses()
    fetchLearnerMemberships()
    
    if (membership) {
      setFormData({
        name: membership.name,
        description: membership.description || '',
        price: membership.price.toString(),
        currency: membership.currency,
        duration_months: membership.duration_months.toString(),
        member_type: membership.member_type,
        is_active: membership.is_active,
        features: membership.features || [],
        selectedCourses: [],
        selectedPromotions: []
      })
    }
  }, [membership])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, price, is_published')
        .eq('is_published', true)
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchLearnerMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_packages')
        .select('id, name, price, member_type')
        .eq('member_type', 'learner')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setLearnerMemberships(data || [])
    } catch (error) {
      console.error('Error fetching learner memberships:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(courseId)
        ? prev.selectedCourses.filter(id => id !== courseId)
        : [...prev.selectedCourses, courseId]
    }))
  }

  const handlePromotionToggle = (membershipId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPromotions: prev.selectedPromotions.includes(membershipId)
        ? prev.selectedPromotions.filter(id => id !== membershipId)
        : [...prev.selectedPromotions, membershipId]
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Membership name is required')
      return false
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Valid price is required')
      return false
    }
    if (!formData.duration_months || parseInt(formData.duration_months) <= 0) {
      alert('Valid duration is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const membershipData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        currency: formData.currency,
        duration_months: parseInt(formData.duration_months),
        member_type: formData.member_type,
        is_active: formData.is_active,
        features: formData.features
      }

      let membershipId: string

      if (membership) {
        // Update existing membership
        const { error } = await supabase
          .from('membership_packages')
          .update(membershipData)
          .eq('id', membership.id)

        if (error) throw error
        membershipId = membership.id
      } else {
        // Create new membership
        const { data, error } = await supabase
          .from('membership_packages')
          .insert(membershipData)
          .select('id')
          .single()

        if (error) throw error
        membershipId = data.id
      }

      // Handle course access for learner memberships
      if (formData.member_type === 'learner' && formData.selectedCourses.length > 0) {
        // Delete existing course access
        await supabase
          .from('membership_course_access')
          .delete()
          .eq('membership_package_id', membershipId)

        // Insert new course access
        const courseAccess = formData.selectedCourses.map(courseId => ({
          membership_package_id: membershipId,
          course_id: courseId
        }))

        const { error } = await supabase
          .from('membership_course_access')
          .insert(courseAccess)

        if (error) throw error
      }

      // Handle promotion rights for affiliate memberships
      if (formData.member_type === 'affiliate' && formData.selectedPromotions.length > 0) {
        // Delete existing promotion rights
        await supabase
          .from('membership_promotion_rights')
          .delete()
          .eq('membership_package_id', membershipId)

        // Insert new promotion rights
        const promotionRights = formData.selectedPromotions.map(promotableId => ({
          membership_package_id: membershipId,
          promotable_membership_id: promotableId,
          commission_rate: 100 // Default commission rate
        }))

        const { error } = await supabase
          .from('membership_promotion_rights')
          .insert(promotionRights)

        if (error) throw error
      }

      alert(`Membership ${membership ? 'updated' : 'created'} successfully`)
      onSuccess()
    } catch (error) {
      console.error('Error saving membership:', error)
      alert('Failed to save membership')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {membership ? 'Edit Membership' : 'Create New Membership'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formData.member_type === 'learner' 
                  ? 'Create a membership package that gives users access to specific courses'
                  : 'Create a membership package that allows affiliates to promote specific memberships'
                }
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Membership Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Premium Learner, Pro Affiliate"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="member_type">Member Type *</Label>
                    <Select
                      value={formData.member_type}
                      onValueChange={(value) => handleInputChange('member_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learner">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Learner
                          </div>
                        </SelectItem>
                        <SelectItem value="affiliate">
                          <div className="flex items-center">
                            <Crown className="h-4 w-4 mr-2" />
                            Affiliate
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this membership includes..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration (Months) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration_months}
                      onChange={(e) => handleInputChange('duration_months', e.target.value)}
                      placeholder="12"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active (available for purchase)</Label>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Features & Benefits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Access (Learner) or Promotion Rights (Affiliate) */}
            {formData.member_type === 'learner' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Access</CardTitle>
                </CardHeader>
                <CardContent>
                  {courses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No published courses available</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={formData.selectedCourses.includes(course.id)}
                            onCheckedChange={() => handleCourseToggle(course.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{course.title}</p>
                            <p className="text-xs text-gray-500">₦{course.price.toLocaleString()}</p>
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
                  <CardTitle className="text-lg">Promotion Rights</CardTitle>
                </CardHeader>
                <CardContent>
                  {learnerMemberships.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No learner memberships available</p>
                  ) : (
                    <div className="space-y-3">
                      {learnerMemberships.map((learnerMembership) => (
                        <div
                          key={learnerMembership.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={formData.selectedPromotions.includes(learnerMembership.id)}
                            onCheckedChange={() => handlePromotionToggle(learnerMembership.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{learnerMembership.name}</p>
                            <p className="text-xs text-gray-500">₦{learnerMembership.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#ed874a] hover:bg-[#d67635]"
            >
              {loading ? 'Saving...' : membership ? 'Update Membership' : 'Create Membership'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
