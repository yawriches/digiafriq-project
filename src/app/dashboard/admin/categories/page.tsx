"use client"
import React, { useState, useEffect } from 'react'
import { 
  FolderOpen, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Loader2,
  BookOpen,
  Video,
  Save,
  X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  type: 'course' | 'tutorial' | 'both'
  courses_count?: number
  tutorials_count?: number
  created_at: string
}

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'both' as 'course' | 'tutorial' | 'both'
  })

  // Default categories (used if no database table exists)
  const defaultCategories: Category[] = [
    { id: '1', name: 'Marketing', slug: 'marketing', description: 'Digital marketing strategies and techniques', type: 'both', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '2', name: 'Design', slug: 'design', description: 'Graphic design and UI/UX', type: 'course', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '3', name: 'Development', slug: 'development', description: 'Web and software development', type: 'course', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '4', name: 'Business', slug: 'business', description: 'Business strategies and entrepreneurship', type: 'both', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '5', name: 'Getting Started', slug: 'getting-started', description: 'Beginner tutorials for new affiliates', type: 'tutorial', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '6', name: 'Social Media', slug: 'social-media', description: 'Social media marketing and growth', type: 'tutorial', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '7', name: 'Advanced Tips', slug: 'advanced', description: 'Advanced strategies for experienced affiliates', type: 'tutorial', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '8', name: 'Sales Techniques', slug: 'sales', description: 'Sales and conversion optimization', type: 'tutorial', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
    { id: '9', name: 'Tools & Resources', slug: 'tools', description: 'Useful tools and resources', type: 'tutorial', courses_count: 0, tutorials_count: 0, created_at: new Date().toISOString() },
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [searchTerm, typeFilter, categories])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      // Try to fetch from categories table
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        // If table doesn't exist, use default categories
        console.warn('Categories table not found, using defaults:', error.message)
        setCategories(defaultCategories)
      } else {
        setCategories(data || defaultCategories)
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error)
      setCategories(defaultCategories)
    } finally {
      setLoading(false)
    }
  }

  const filterCategories = () => {
    let filtered = categories

    if (searchTerm) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(cat => cat.type === typeFilter || cat.type === 'both')
    }

    setFilteredCategories(filtered)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '', type: 'both' })
    setShowModal(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      type: category.type
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            type: formData.type
          })
          .eq('id', editingCategory.id)

        if (error) throw error

        setCategories(categories.map(c => 
          c.id === editingCategory.id 
            ? { ...c, ...formData }
            : c
        ))
        toast.success('Category updated successfully')
      } else {
        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            type: formData.type
          })
          .select()
          .single()

        if (error) throw error

        setCategories([...categories, data])
        toast.success('Category created successfully')
      }

      setShowModal(false)
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error(error.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      setCategories(categories.filter(c => c.id !== categoryId))
      toast.success('Category deleted successfully')
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4 text-blue-600" />
      case 'tutorial': return <Video className="w-4 h-4 text-purple-600" />
      default: return <FolderOpen className="w-4 h-4 text-green-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-700'
      case 'tutorial': return 'bg-purple-100 text-purple-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  return (
    <AdminDashboardLayout title="Categories Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Course Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.type === 'course' || c.type === 'both').length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tutorial Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.type === 'tutorial' || c.type === 'both').length}
                </p>
              </div>
              <Video className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="course">Courses Only</option>
              <option value="tutorial">Tutorials Only</option>
              <option value="both">Both</option>
            </select>
            <Button 
              className="bg-[#ed874a] hover:bg-[#d76f32]"
              onClick={openAddModal}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
          <span className="ml-3 text-gray-600">Loading categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
            <p className="text-lg mb-2 text-gray-900">No categories found</p>
            <p className="text-sm text-gray-600 mb-4">Try adjusting your search or filters</p>
            <Button 
              className="bg-[#ed874a] hover:bg-[#d76f32]"
              onClick={openAddModal}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(category.type)}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(category.type)}`}>
                    {category.type === 'both' ? 'Both' : category.type === 'course' ? 'Course' : 'Tutorial'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {category.description || 'No description'}
                </p>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditModal(category)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Digital Marketing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., digital-marketing"
                />
                <p className="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ed874a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ed874a]"
                >
                  <option value="both">Both (Courses & Tutorials)</option>
                  <option value="course">Courses Only</option>
                  <option value="tutorial">Tutorials Only</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-[#ed874a] hover:bg-[#d76f32]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingCategory ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  )
}

export default CategoriesManagement
