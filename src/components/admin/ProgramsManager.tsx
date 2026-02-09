"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  MoreVertical,
  Search,
  BarChart3,
  CheckCircle,
  Clock,
  Image
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
  const [searchTerm, setSearchTerm] = useState('')

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

  const totalCourses = programs.reduce((sum, p) => sum + (p.courses?.length || 0), 0)
  const activePrograms = programs.filter(p => p.is_active).length

  const filteredPrograms = programs.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-2xl flex items-center justify-center shadow-lg">
            <FolderOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programs Management</h1>
            <p className="text-sm text-gray-500">Organize and manage your learning programs</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-[#ed874a] hover:bg-[#d76f32] shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Programs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{programs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Programs</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{activePrograms}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-3xl font-bold text-[#ed874a] mt-1">{totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#ed874a]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-2 border-[#ed874a]/20 shadow-lg">
          <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              {editingProgram ? <Edit className="w-5 h-5 text-[#ed874a]" /> : <Plus className="w-5 h-5 text-[#ed874a]" />}
              {editingProgram ? 'Edit Program' : 'Create New Program'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ed874a] focus:border-transparent text-sm"
                  rows={3}
                  placeholder="Describe what this program covers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  {formData.thumbnail_url && (
                    <div className="w-10 h-10 rounded-lg border overflow-hidden flex-shrink-0">
                      <img src={formData.thumbnail_url} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
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

              <div className="flex gap-3 pt-2 border-t">
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
      {filteredPrograms.length === 0 && programs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create your first program to organize courses into structured learning paths</p>
            <Button onClick={() => setShowForm(true)} className="bg-[#ed874a] hover:bg-[#d76f32]">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Program
            </Button>
          </CardContent>
        </Card>
      ) : filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No programs match your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPrograms.map((program) => (
            <Card 
              key={program.id} 
              className={`group hover:shadow-lg transition-all duration-200 border-0 shadow-sm overflow-hidden ${!program.is_active ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-0">
                {/* Thumbnail / Color Bar */}
                {program.thumbnail_url ? (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img 
                      src={program.thumbnail_url} 
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                ) : (
                  <div className="h-3 bg-gradient-to-r from-[#ed874a] to-[#d76f32]" />
                )}
                
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{program.title}</h3>
                        <Badge 
                          variant="secondary"
                          className={program.is_active 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {program.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2">{program.description || 'No description provided'}</p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <BookOpen className="w-4 h-4 text-[#ed874a]" />
                      <span className="font-medium">{program.courses?.length || 0}</span>
                      <span className="text-gray-400">courses</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{new Date(program.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin/programs/${program.id}`)}
                      className="flex-1 text-[#ed874a] border-[#ed874a]/30 hover:bg-[#ed874a]/5"
                    >
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      Manage Courses
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(program)}
                      title={program.is_active ? 'Deactivate' : 'Activate'}
                      className="hover:bg-gray-100"
                    >
                      {program.is_active ? (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(program)}
                      className="hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(program.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
