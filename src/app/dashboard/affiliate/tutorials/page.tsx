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
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          <span className="ml-3 text-gray-600">Loading tutorials...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Error loading tutorials: {error}</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Featured Tutorial */}
          {featuredTutorial && (
            <Card className="mb-8 bg-gradient-to-r from-orange-600/10 to-orange-700/10 border-orange-600/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="w-full lg:w-80 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <Play className="w-16 h-16 text-orange-600" />
            </div>
            <div className="flex-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-600 text-white mb-2">
                Featured
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{featuredTutorial.title}</h2>
              <p className="text-gray-600 mb-4">{featuredTutorial.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {featuredTutorial.duration}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {featuredTutorial.views} views
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  {featuredTutorial.rating}
                </div>
              </div>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Play className="w-4 h-4 mr-2" />
                Start Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Search and Filter */}
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
              className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map(tutorial => (
          <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                {getTypeIcon(tutorial.type)}
              </div>
              <div className="absolute bottom-2 left-2 flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                  {tutorial.difficulty}
                </span>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{tutorial.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tutorial.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {tutorial.duration}
                </div>
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {tutorial.views}
                </div>
                <div className="flex items-center">
                  <Star className="w-3 h-3 mr-1 text-yellow-500" />
                  {tutorial.rating}
                </div>
              </div>
              
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <Play className="w-4 h-4 mr-2" />
                Start Tutorial
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tutorials found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Learning Progress */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{completedCount}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{inProgressCount}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 mb-1">{notStartedCount}</div>
              <div className="text-sm text-gray-600">Not Started</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{overallProgress}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}

export default TutorialsPage
