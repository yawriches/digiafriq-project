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
  member_type: 'learner' | 'affiliate'
  is_active: boolean
  features: string[]
  has_digital_cashflow?: boolean
  digital_cashflow_price?: number
}

type MembershipInsert = {
  name: string
  description: string
  price: number
  currency: string
  duration_months: number
  member_type: 'learner' | 'affiliate'
  is_active: boolean
  features: string[]
  has_digital_cashflow: boolean
  digital_cashflow_price: number
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
  const [learnerMemberships, setLearnerMemberships] = useState<MembershipPackage[]>([])

  interface MembershipFormData {
    name: string
    description: string
    price: string
    currency: string
    duration_months: string
    member_type: 'learner' | 'affiliate'
    is_active: boolean
    features: string[]
    selectedCourses: string[]
    selectedPromotions: string[]
    has_digital_cashflow: boolean
    digital_cashflow_price: number
  }

  type MembershipInsert = {
    name: string
    description: string
    price: number
    currency: string
    duration_months: number
    member_type: 'learner' | 'affiliate'
    is_active: boolean
    features: string[]
    has_digital_cashflow: boolean
    digital_cashflow_price: number
  }

  const [formData, setFormData] = useState<MembershipFormData>({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    duration_months: '',
    member_type: 'learner' as 'learner' | 'affiliate',
    is_active: true,
    features: [] as string[],
    selectedCourses: [] as string[],
    selectedPromotions: [] as string[],
    has_digital_cashflow: false,
    digital_cashflow_price: 7,
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
    fetchLearnerMemberships()
    if (membership && !isRestoredRef.current) {
      setFormData({
        name: membership.name,
        description: membership.description || '',
        price: membership.price.toString(),
        currency: membership.currency || 'GHS',
        duration_months: membership.duration_months.toString(),
        member_type: membership.member_type,
        is_active: membership.is_active,
        features: membership.features || [],
        selectedCourses: [],
        selectedPromotions: [],
        has_digital_cashflow: membership.has_digital_cashflow ?? false,
        digital_cashflow_price: membership.digital_cashflow_price ?? 7
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

  const fetchLearnerMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('membership_packages')
        .select('id, name, price, currency, member_type')
        .eq('member_type', 'learner')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      setLearnerMemberships(data || [])
    } catch (error) {
      console.error('Error fetching learner memberships:', error)
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

  const handlePromotionToggle = (membershipId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPromotions: prev.selectedPromotions.includes(membershipId)
        ? prev.selectedPromotions.filter((id) => id !== membershipId)
        : [...prev.selectedPromotions, membershipId],
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
    if (!formData.member_type || !['learner', 'affiliate'].includes(formData.member_type)) {
      toast.error('Valid member type is required')
      return false
    }
    // Validate digital cashflow price if enabled
    if (formData.has_digital_cashflow && (!formData.digital_cashflow_price || formData.digital_cashflow_price < 0)) {
      toast.error('Valid digital cashflow price is required')
      return false
    }

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
        member_type: formData.member_type || 'learner', // Ensure member_type is never empty
        is_active: formData.is_active,
        features: formData.features,
        has_digital_cashflow: formData.has_digital_cashflow,
        digital_cashflow_price: formData.digital_cashflow_price
      }

      let membershipId: string
      if (membership) {
        const { error } = await supabase
          .from('membership_packages')
          .update(membershipData)
          .eq('id', membership.id)
        if (error) throw error
        membershipId = membership.id
      } else {
        const { data, error } = await supabase
          .from('membership_packages')
          .insert(membershipData)
          .select('id')
          .single()
        if (error) throw error
        membershipId = data.id
      }

      // courses
      if (formData.member_type === 'learner') {
        await supabase
          .from('membership_course_access')
          .delete()
          .eq('membership_package_id', membershipId)
        if (formData.selectedCourses.length > 0) {
          const courseAccess = formData.selectedCourses.map((courseId) => ({
            membership_package_id: membershipId,
            course_id: courseId,
          }))
          const { error } = await supabase.from('membership_course_access').insert(courseAccess)
          if (error) throw error
        }
      }

      // promotions
      if (formData.member_type === 'affiliate') {
        await supabase
          .from('membership_promotion_rights')
          .delete()
          .eq('membership_package_id', membershipId)
        if (formData.selectedPromotions.length > 0) {
          const promotionRights = formData.selectedPromotions.map((promotableId) => ({
            membership_package_id: membershipId,
            promotable_membership_id: promotableId,
            commission_rate: 100,
          }))
          const { error } = await supabase.from('membership_promotion_rights').insert(promotionRights)
          if (error) throw error
        }
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
                    <p className="text-sm font-medium text-gray-700">Total Price (displayed to users)</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.has_digital_cashflow 
                        ? `Base (${formatPrice(parseFloat(formData.price) || 0, formData.currency)}) + DCS Add-on (${formatPrice(formData.digital_cashflow_price || 0, formData.currency)})`
                        : 'Base price only'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#ed874a]">
                      {formatPrice(
                        (parseFloat(formData.price) || 0) + (formData.has_digital_cashflow ? (formData.digital_cashflow_price || 0) : 0),
                        formData.currency
                      )}
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
            {formData.member_type === 'learner' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_digital_cashflow"
                    checked={formData.has_digital_cashflow}
                    onCheckedChange={(checked) => handleInputChange('has_digital_cashflow', checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="has_digital_cashflow" className="font-medium">Digital Cashflow System Add-on</Label>
                    <p className="text-sm text-gray-500">Unlock affiliate features and earn 80% commission + 20% recurring yearly commission on learner renewals</p>
                  </div>
                </div>
                {formData.has_digital_cashflow && (
                  <div className="ml-6">
                    <Label htmlFor="digital_cashflow_price">Add-on Price</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="digital_cashflow_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.digital_cashflow_price}
                        onChange={(e) => handleInputChange('digital_cashflow_price', parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="w-32"
                      />
                      <span className="text-sm text-gray-500">{formData.currency}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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

        {/* Course Access / Promotion Rights */}
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
                        <p className="text-xs text-gray-500">{formatPrice(course.price, 'GHS')}</p>
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
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-sm">{learnerMembership.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(
                            learnerMembership.price,
                            learnerMembership.currency
                          )}
                        </p>
                      </div>
                      <Checkbox
                        checked={formData.selectedPromotions.includes(learnerMembership.id)}
                        onCheckedChange={() => handlePromotionToggle(learnerMembership.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
