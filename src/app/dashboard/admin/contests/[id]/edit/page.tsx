"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function EditContestPage() {
  const router = useRouter()
  const params = useParams()
  const contestId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign: '',
    start_date: '',
    end_date: '',
    status: 'running' as 'running' | 'ended' | 'upcoming',
    prize_amount: 0,
    prize_description: '',
    target_referrals: 0,
    winner_criteria: 'All target satisfied',
    max_participants: 0,
    rules: [''] as string[]
  })

  useEffect(() => {
    fetchContest()
  }, [contestId])

  const fetchContest = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/contests')
      const result = await response.json()

      if (result.error) throw new Error(result.error)

      const data = result.data?.find((c: any) => c.id === contestId)
      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          campaign: data.campaign || '',
          start_date: data.start_date ? data.start_date.split('T')[0] : '',
          end_date: data.end_date ? data.end_date.split('T')[0] : '',
          status: data.status || 'running',
          prize_amount: data.prize_amount || 0,
          prize_description: data.prize_description || '',
          target_referrals: data.target_referrals || 0,
          winner_criteria: data.winner_criteria || 'All target satisfied',
          max_participants: data.max_participants || 0,
          rules: Array.isArray(data.rules) && data.rules.length > 0 ? data.rules : ['']
        })
      }
    } catch (error: any) {
      console.error('Error fetching contest:', error)
      toast.error('Failed to load contest')
      router.push('/dashboard/admin/contests')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'prize_amount' || name === 'target_referrals' || name === 'max_participants' 
        ? Number(value) 
        : value
    }))
  }

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...formData.rules]
    newRules[index] = value
    setFormData(prev => ({ ...prev, rules: newRules }))
  }

  const addRule = () => {
    setFormData(prev => ({ ...prev, rules: [...prev.rules, ''] }))
  }

  const removeRule = (index: number) => {
    if (formData.rules.length > 1) {
      const newRules = formData.rules.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, rules: newRules }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      const contestData = {
        id: contestId,
        name: formData.name,
        description: formData.description,
        campaign: formData.campaign || 'DigiAfriq Campaign',
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        prize_amount: formData.prize_amount,
        prize_description: formData.prize_description,
        target_referrals: formData.target_referrals,
        winner_criteria: formData.winner_criteria,
        max_participants: formData.max_participants || null,
        rules: formData.rules.filter(r => r.trim() !== ''),
        updated_at: new Date().toISOString()
      }

      const response = await fetch('/api/admin/contests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contestData)
      })
      const result = await response.json()

      if (result.error) throw new Error(result.error)

      toast.success('Contest updated successfully')
      router.push('/dashboard/admin/contests')
    } catch (error: any) {
      console.error('Error updating contest:', error)
      toast.error(error.message || 'Failed to update contest')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminDashboardLayout title="Edit Contest">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#3eb489]" />
          <span className="ml-2 text-gray-600">Loading contest...</span>
        </div>
      </AdminDashboardLayout>
    )
  }

  return (
    <AdminDashboardLayout title="Edit Contest">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Contest</h1>
            <p className="text-gray-600">Update contest details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Contest Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., The UMM Boss Sales Challenge"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campaign">Campaign Name</Label>
                    <Input
                      id="campaign"
                      name="campaign"
                      value={formData.campaign}
                      onChange={handleInputChange}
                      placeholder="e.g., The Ultimate Money Machine (U.M.M)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Include prize information here)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the contest, prizes, and objectives. E.g., Win 700 Cedis cash prize by referring 25 new affiliates..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="winner_criteria">Winner Criteria</Label>
                  <Input
                    id="winner_criteria"
                    name="winner_criteria"
                    value={formData.winner_criteria}
                    onChange={handleInputChange}
                    placeholder="e.g., All target satisfied"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contest Period & Status */}
            <Card>
              <CardHeader>
                <CardTitle>Contest Period & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date *</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3eb489]"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="running">Running (Active)</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target */}
            <Card>
              <CardHeader>
                <CardTitle>Target</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_referrals">Target Referrals</Label>
                    <Input
                      id="target_referrals"
                      name="target_referrals"
                      type="number"
                      value={formData.target_referrals}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Max Participants (optional)</Label>
                    <Input
                      id="max_participants"
                      name="max_participants"
                      type="number"
                      value={formData.max_participants || ''}
                      onChange={handleInputChange}
                      placeholder="Leave empty for unlimited"
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contest Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Contest Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      placeholder={`Rule ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRule(index)}
                      disabled={formData.rules.length === 1}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRule}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#3eb489] hover:bg-[#35a07a] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  )
}
