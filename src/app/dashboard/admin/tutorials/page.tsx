"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { 
  BookOpen, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Star,
  Layers
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { toast } from 'sonner'

interface Tutorial {
  id: string
  title: string
  description: string
  instructor: string
  thumbnail_url: string | null
  duration: string
  category: string
  level: string
  views: number
  rating: number
  is_featured: boolean
  is_published: boolean
  created_at: string
}

const TutorialsManagement = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [filteredTutorials, setFilteredTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleteTutorialId, setDeleteTutorialId] = useState<string | null>(null)

  useEffect(() => {
    fetchTutorials()
  }, [])

  useEffect(() => {
    filterTutorials()
  }, [searchTerm, statusFilter, categoryFilter, tutorials])

  const fetchTutorials = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTutorials(data || [])
    } catch (error: any) {
      console.error('Error fetching tutorials:', error)
      toast.error('Failed to load tutorials')
    } finally {
      setLoading(false)
    }
  }

  const filterTutorials = () => {
    let filtered = tutorials

    if (searchTerm) {
      filtered = filtered.filter(tutorial => 
        tutorial.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      const isPublished = statusFilter === 'published'
      filtered = filtered.filter(tutorial => tutorial.is_published === isPublished)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tutorial => tutorial.category === categoryFilter)
    }

    setFilteredTutorials(filtered)
  }

  const handleDeleteTutorial = async (tutorialId: string) => {
    try {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', tutorialId)

      if (error) throw error
      
      setTutorials(tutorials.filter(t => t.id !== tutorialId))
      toast.success('Tutorial deleted successfully')
    } catch (error: any) {
      console.error('Error deleting tutorial:', error)
      toast.error('Failed to delete tutorial')
    }
  }

  const handleToggleStatus = async (tutorialId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tutorials')
        .update({ is_published: !currentStatus })
        .eq('id', tutorialId)

      if (error) throw error
      
      setTutorials(tutorials.map(t => t.id === tutorialId ? { ...t, is_published: !currentStatus } : t))
      toast.success(`Tutorial ${!currentStatus ? 'published' : 'unpublished'} successfully`)
    } catch (error: any) {
      console.error('Error updating tutorial:', error)
      toast.error('Failed to update tutorial')
    }
  }

  const handleToggleFeatured = async (tutorialId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tutorials')
        .update({ is_featured: !currentStatus })
        .eq('id', tutorialId)

      if (error) throw error
      
      setTutorials(tutorials.map(t => t.id === tutorialId ? { ...t, is_featured: !currentStatus } : t))
      toast.success(`Tutorial ${!currentStatus ? 'featured' : 'unfeatured'} successfully`)
    } catch (error: any) {
      console.error('Error updating tutorial:', error)
      toast.error('Failed to update tutorial')
    }
  }

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-700'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'Advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    }>
      <AdminDashboardLayout title="Tutorials Management">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tutorials</p>
                  <p className="text-2xl font-bold text-gray-900">{tutorials.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tutorials.filter(t => t.is_published).length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Featured</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tutorials.filter(t => t.is_featured).length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tutorials.reduce((sum, t) => sum + (t.views || 0), 0).toLocaleString()}
                  </p>
                </div>
                <Layers className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search tutorials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="getting-started">Getting Started</option>
                <option value="marketing">Marketing</option>
                <option value="social-media">Social Media</option>
                <option value="advanced">Advanced</option>
                <option value="sales">Sales</option>
                <option value="tools">Tools</option>
              </select>
              <Link href="/dashboard/admin/tutorials/create">
                <Button className="bg-[#ed874a] hover:bg-[#d76f32]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tutorial
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tutorials Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
            <span className="ml-3 text-gray-600">Loading tutorials...</span>
          </div>
        ) : filteredTutorials.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-lg mb-2 text-gray-900">No tutorials found</p>
              <p className="text-sm text-gray-600 mb-4">Try adjusting your search or filters</p>
              <Link href="/dashboard/admin/tutorials/create">
                <Button className="bg-[#ed874a] hover:bg-[#d76f32]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Tutorial
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                <div className="relative h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  {tutorial.thumbnail_url ? (
                    <img src={tutorial.thumbnail_url} alt={tutorial.title} className="w-full h-full object-cover rounded-t-lg" />
                  ) : (
                    <BookOpen className="w-16 h-16 text-gray-400" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tutorial.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {tutorial.is_published ? 'Published' : 'Draft'}
                    </span>
                    {tutorial.is_featured && (
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                        Featured
                      </span>
                    )}
                  </div>
                  {tutorial.level && (
                    <div className="absolute bottom-2 left-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getLevelBadgeColor(tutorial.level)}`}>
                        {tutorial.level}
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-1">{tutorial.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tutorial.description}</p>
                  <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                    <span>{tutorial.category}</span>
                    <span>{tutorial.duration || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{tutorial.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-500">{tutorial.rating || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Link href={`/dashboard/admin/tutorials/${tutorial.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(tutorial.id, tutorial.is_published)}
                      className={tutorial.is_published ? 'text-yellow-600' : 'text-green-600'}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFeatured(tutorial.id, tutorial.is_featured)}
                      className={tutorial.is_featured ? 'text-orange-600' : 'text-gray-400'}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTutorialId(tutorial.id)}
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

        {/* Delete Confirmation Dialog */}
        {deleteTutorialId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Tutorial</h2>
              <p className="mb-6 text-gray-600">Are you sure you want to delete this tutorial? This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTutorialId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleDeleteTutorial(deleteTutorialId)
                    setDeleteTutorialId(null)
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminDashboardLayout>
    </Suspense>
  )
}

export default TutorialsManagement
