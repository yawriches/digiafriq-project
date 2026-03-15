"use client"
import React, { useState } from 'react'
import { 
  BookOpen, 
  Play,
  Clock,
  Users,
  Star,
  CheckCircle,
  Search,
  Video,
  FileText,
  Headphones,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTutorials } from '@/lib/hooks/useTutorials'

const TutorialsPage = () => {
  const { tutorials: dbTutorials, featuredTutorial: dbFeaturedTutorial, loading, error } = useTutorials()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Calculate category counts from tutorials
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return dbTutorials.length
    return dbTutorials.filter(t => t.category === categoryId).length
  }

  const categories = [
    { id: 'all', name: 'All Tutorials', count: getCategoryCount('all') },
    { id: 'getting-started', name: 'Getting Started', count: getCategoryCount('getting-started') },
    { id: 'marketing', name: 'Marketing Strategies', count: getCategoryCount('marketing') },
    { id: 'social-media', name: 'Social Media', count: getCategoryCount('social-media') },
    { id: 'advanced', name: 'Advanced Tips', count: getCategoryCount('advanced') }
  ]

  const tutorials = dbTutorials

  const featuredTutorial = dbFeaturedTutorial

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'article':
        return <FileText className="w-4 h-4" />
      case 'webinar':
        return <Headphones className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 bg-green-100'
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-100'
      case 'Advanced':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tutorial.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Calculate learning progress
  const completedCount = 0 // TODO: Track user progress
  const inProgressCount = 0
  const notStartedCount = tutorials.length
  const overallProgress = tutorials.length > 0 ? Math.round((completedCount / tutorials.length) * 100) : 0

  return (
    <div className="p-4 lg:p-6 max-w-[1200px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tutorials</h1>
        <p className="text-sm text-gray-500 mt-0.5">Learn strategies to grow your affiliate earnings</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#ed874a]" />
          <span className="ml-2 text-sm text-gray-500">Loading tutorials...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-sm text-red-600">Error loading tutorials: {error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Featured Tutorial */}
          {featuredTutorial && (
            <div className="mb-6 bg-white rounded-xl border border-gray-200/80 overflow-hidden">
              <div className="p-5">
                <div className="flex flex-col lg:flex-row items-start gap-5">
                  <div className="w-full lg:w-72 h-40 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Play className="w-12 h-12 text-[#ed874a]" />
                  </div>
                  <div className="flex-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ed874a] text-white mb-2">Featured</span>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{featuredTutorial.title}</h2>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{featuredTutorial.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{featuredTutorial.duration}</span>
                      <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" />{featuredTutorial.views} views</span>
                      <span className="flex items-center"><Star className="w-3.5 h-3.5 mr-1 text-yellow-500" />{featuredTutorial.rating}</span>
                    </div>
                    <Button className="bg-[#ed874a] hover:bg-[#d76f32] text-xs h-9 rounded-lg">
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Start Learning
                    </Button>
                  </div>
                </div>
              </div>
            </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 rounded-lg text-sm focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20"
            />
          </div>
          <select 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name} ({category.count})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-[#ed874a] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#ed874a]/30 hover:text-[#ed874a]'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTutorials.map(tutorial => (
          <div key={tutorial.id} className="bg-white rounded-xl border border-gray-200/80 overflow-hidden hover:shadow-sm transition-shadow">
            <div className="relative">
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                {getTypeIcon(tutorial.type)}
              </div>
              <div className="absolute bottom-2 left-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getDifficultyColor(tutorial.difficulty)}`}>
                  {tutorial.difficulty}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{tutorial.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tutorial.description}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
                <span className="flex items-center"><Clock className="w-3 h-3 mr-0.5" />{tutorial.duration}</span>
                <span className="flex items-center"><Users className="w-3 h-3 mr-0.5" />{tutorial.views}</span>
                <span className="flex items-center"><Star className="w-3 h-3 mr-0.5 text-yellow-500" />{tutorial.rating}</span>
              </div>
              <Button className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-xs h-8 rounded-lg">
                <Play className="w-3.5 h-3.5 mr-1.5" /> Start Tutorial
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 text-center py-14">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No tutorials found</p>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Learning Progress */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Your Learning Progress</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center py-3">
              <div className="text-xl font-bold text-[#ed874a]">{completedCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">Completed</div>
            </div>
            <div className="text-center py-3">
              <div className="text-xl font-bold text-blue-600">{inProgressCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">In Progress</div>
            </div>
            <div className="text-center py-3">
              <div className="text-xl font-bold text-gray-600">{notStartedCount}</div>
              <div className="text-xs text-gray-500 mt-0.5">Not Started</div>
            </div>
            <div className="text-center py-3">
              <div className="text-xl font-bold text-emerald-600">{overallProgress}%</div>
              <div className="text-xs text-gray-500 mt-0.5">Overall</div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default TutorialsPage
