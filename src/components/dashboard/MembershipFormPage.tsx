"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  currency?: string
  duration_months: number
  member_type: 'learner'
  is_active: boolean
  features: string[]
}

type MembershipInsert = {
  name: string
  description: string
  price: number
  currency: string
  duration_months: number
  member_type: 'learner'
  is_active: boolean
  features: string[]
}

interface MembershipFormPageProps {
  membership?: MembershipPackage | null
  onSuccess: () => void
  onCancel: () => void
}

const DRAFT_KEY = 'membership_form_draft_v1'
const VALID_CURRENCIES = ['GHS', 'NGN', 'USD', 'EUR', 'GBP']

const formatPrice = (price: number, currency?: string) => {
  const safeCurrency =
    currency && VALID_CURRENCIES.includes(currency.toUpperCase())
      ? currency.toUpperCase()
      : 'GHS'
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: safeCurrency,
    }).format(price)
  } catch {
    return price.toFixed(2)
  }
}

export default function MembershipFormPage({
  membership,
  onSuccess,
  onCancel,
}: MembershipFormPageProps) {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  interface MembershipFormData {
    name: string
    description: string
    price: string
    currency: string
    duration_months: string
    member_type?: 'learner' // Optional since it's always set to 'learner'
    is_active: boolean
    features: string[]
    selectedCourses: string[]
  }

  type MembershipInsert = {
    name: string
    description: string
    price: number
    currency: string
    duration_months: number
    member_type: 'member'
    is_active: boolean
    features: string[]
  }

  const [formData, setFormData] = useState<MembershipFormData>({
    name: 'Digiafriq AI Cashflow Access',
    description: 'Complete access to Digiafriq AI learning platform and affiliate program. Learn AI skills and monetize them through our comprehensive ecosystem.',
    price: '18',
    currency: 'USD',
    duration_months: '12',
    member_type: 'learner',
    is_active: true,
    features: [
      'Access to all AI courses and training materials',
      'Learner dashboard with progress tracking',
      'Community access and support',
      'Affiliate program access (after completing affiliate course)',
      'AI tools and resources',
      'Certificate of completion',
      'Priority support',
    ],
    selectedCourses: [] as string[],
  })

  const [newFeature, setNewFeature] = useState('')
  const isRestoredRef = useRef(false)
  const mountedRef = useRef(false)
  const saveTimeoutRef = useRef<number | null>(null)

  // -----------------------
  // Mount / Restore logic
  // -----------------------
  useEffect(() => {
    mountedRef.current = true
    tryRestoreDraft()
    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchCourses()
    if (membership && !isRestoredRef.current) {
      setFormData({
        name: membership.name,
        description: membership.description || '',
        price: membership.price.toString(),
        currency: membership.currency || 'USD',
        duration_months: membership.duration_months.toString(),
        member_type: (membership as any).member_type || 'learner',
        is_active: membership.is_active,
        features: membership.features || [],
        selectedCourses: [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membership])

  // -----------------------
  // Autosave draft to localStorage
  // -----------------------
  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      } catch (err) {
        console.warn('Could not save draft', err)
      }
    }, 600)

    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current)
    }
  }, [formData])

  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      } catch {}
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formData])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
        } catch {}
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [formData])

  const tryRestoreDraft = () => {
    if (isRestoredRef.current) return
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({ ...prev, ...parsed }))
          isRestoredRef.current = true
        }
      }
    } catch (err) {
      console.warn('Failed to restore draft', err)
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
  }

  // -----------------------
  // Fetch helpers
  // -----------------------
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

  
  // -----------------------
  // Form helpers
  // -----------------------
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const handleCourseToggle = (courseId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(courseId)
        ? prev.selectedCourses.filter((id) => id !== courseId)
        : [...prev.selectedCourses, courseId],
    }))
  }

  
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Membership name is required')
      return false
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required')
      return false
    }
    if (!formData.duration_months || parseInt(formData.duration_months) <= 0) {
      toast.error('Valid duration is required')
      return false
    }
    // Member type validation removed - using single 'learner' type for all memberships

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const membershipData: MembershipInsert = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        currency: formData.currency,
        duration_months: parseInt(formData.duration_months),
        member_type: 'learner', // Always use 'learner' for simplified membership
        is_active: formData.is_active,
        features: formData.features,
      }

      let membershipId: string
      if (membership) {
        const { error } = await (supabase
          .from('membership_packages')
          .update(membershipData as any)
          .eq('id', membership.id) as any)
        if (error) throw error
        membershipId = membership.id
      } else {
        const { data, error } = await (supabase
          .from('membership_packages')
          .insert(membershipData as any)
          .select('id')
          .single() as any)
        if (error) throw error
        membershipId = (data as any).id
      }

      // courses - all members get access to all courses
      await (supabase
        .from('membership_course_access')
        .delete()
        .eq('membership_package_id', membershipId) as any)
      if (formData.selectedCourses.length > 0) {
        const courseAccess = formData.selectedCourses.map((courseId) => ({
          membership_package_id: membershipId,
          course_id: courseId,
        }))
        const { error } = await (supabase.from('membership_course_access').insert(courseAccess as any) as any)
        if (error) throw error
      }

      toast.success(`Membership ${membership ? 'updated' : 'created'} successfully`)
      clearDraft()
      onSuccess()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Error saving membership:', errorMessage, error)
      
      // Provide more specific error messages
      if (error instanceof Error && error.message.includes('duplicate')) {
        toast.error('A membership with this name already exists')
      } else if (error instanceof Error && error.message.includes('permission')) {
        toast.error('You do not have permission to save memberships')
      } else {
        toast.error(`Failed to save membership: ${errorMessage || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Membership Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digiafriq AI Cashflow Access"
                required
              />
              <p className="text-xs text-gray-500 mt-1">This is the single membership package for all users</p>
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
                <div className="flex items-center h-10 px-3 rounded-md border border-gray-200 bg-gray-100 text-gray-700">
                  <span className="font-medium">USD ($)</span>
                  <span className="ml-2 text-xs text-gray-500">Fixed currency</span>
                </div>
                <input type="hidden" name="currency" value="USD" />
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

            {/* Total Price Display */}
            {formData.price && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Annual Price (displayed to users)</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Complete access to all features and courses
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#ed874a]">
                      {formatPrice(parseFloat(formData.price) || 0, formData.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.duration_months ? `for ${formData.duration_months} month${parseInt(formData.duration_months) !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
            <p className="text-sm text-gray-500">Define what's included in the Digiafriq AI Cashflow Access membership</p>
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
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Course Access</CardTitle>
            <p className="text-sm text-gray-500">Select which courses are included in this membership</p>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No published courses available</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border-2 border-dashed rounded-lg bg-gray-50">
                  <Checkbox
                    checked={courses.length > 0 && formData.selectedCourses.length === courses.length}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        selectedCourses: checked ? courses.map((c) => c.id) : [],
                      }))
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Select All Courses</p>
                    <p className="text-xs text-gray-500">{formData.selectedCourses.length} of {courses.length} selected</p>
                  </div>
                </div>
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
                      <p className="text-xs text-gray-500">{formatPrice(course.price, 'USD')}</p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : membership ? 'Update Membership' : 'Create Membership'}
          </Button>
        </div>
      </form>
    </div>
  )
}
