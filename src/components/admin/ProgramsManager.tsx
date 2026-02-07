"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2, 
  X, 
  Save,
  BookOpen,
  FolderOpen,
  MoreVertical
} from 'lucide-react'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  price: number
  is_published: boolean
  created_at: string
}

interface Program {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  is_active: boolean
  display_order: number
  courses: Course[]
  created_at: string
  updated_at: string
}

const ProgramsManager: React.FC = () => {
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    is_active: true
  })

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/programs')
      const data = await response.json()
      
      if (response.ok) {
        setPrograms(data.programs || [])
      } else {
        toast.error(data.error || 'Failed to fetch programs')
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      toast.error('Failed to fetch programs')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Program title is required')
      return
    }

    setSaving(true)
    try {
      const url = editingProgram 
        ? `/api/admin/programs/${editingProgram.id}`
        : '/api/admin/programs'
      
      const response = await fetch(url, {
        method: editingProgram ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(editingProgram ? 'Program updated!' : 'Program created!')
        setShowForm(false)
        setEditingProgram(null)
        setFormData({ title: '', description: '', thumbnail_url: '', is_active: true })
        fetchPrograms()
      } else {
        toast.error(data.error || 'Failed to save program')
      }
    } catch (error) {
      console.error('Error saving program:', error)
      toast.error('Failed to save program')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (program: Program) => {
    setEditingProgram(program)
    setFormData({
      title: program.title,
      description: program.description || '',
      thumbnail_url: program.thumbnail_url || '',
      is_active: program.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (programId: string) => {
    if (!confirm('Are you sure you want to delete this program? Courses will be unlinked but not deleted.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/programs/${programId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Program deleted!')
        fetchPrograms()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete program')
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      toast.error('Failed to delete program')
    }
  }

  const toggleActive = async (program: Program) => {
    try {
      const response = await fetch(`/api/admin/programs/${program.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !program.is_active })
      })

      if (response.ok) {
        toast.success(program.is_active ? 'Program deactivated' : 'Program activated')
        fetchPrograms()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update program')
      }
    } catch (error) {
      console.error('Error toggling program:', error)
      toast.error('Failed to update program')
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingProgram(null)
    setFormData({ title: '', description: '', thumbnail_url: '', is_active: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-3 text-gray-600">Loading programs...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-[#ed874a]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Programs</h1>
            <p className="text-sm text-gray-500">Manage your learning programs</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-[#ed874a] hover:bg-[#d76f32]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-[#ed874a]/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {editingProgram ? 'Edit Program' : 'Create New Program'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed874a] focus:border-transparent"
                  placeholder="e.g., Web Development Bootcamp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed874a] focus:border-transparent"
                  rows={3}
                  placeholder="Describe what this program covers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <input
                  type="text"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ed874a] focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#ed874a] border-gray-300 rounded focus:ring-[#ed874a]"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (visible to learners)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="bg-[#ed874a] hover:bg-[#d76f32]">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingProgram ? 'Update Program' : 'Create Program'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Programs List */}
      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-500 mb-4">Create your first program to organize courses</p>
            <Button onClick={() => setShowForm(true)} className="bg-[#ed874a] hover:bg-[#d76f32]">
              <Plus className="w-4 h-4 mr-2" />
              Create Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {programs.map((program) => (
            <Card key={program.id} className={`${!program.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                      <Badge variant={program.is_active ? 'default' : 'secondary'}>
                        {program.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{program.description || 'No description'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {program.courses?.length || 0} courses
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin/programs/${program.id}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Manage Courses
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(program)}
                      title={program.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {program.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(program)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(program.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProgramsManager
