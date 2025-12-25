"use client"
import React, { useState } from 'react'
import { 
  Download, 
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Search,
  Eye,
  Trash2,
  FolderOpen,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDownloads } from '@/lib/hooks/useDownloads'

const DownloadsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const { downloads, categories, loading, error } = useDownloads()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-2 text-gray-600">Loading your downloads...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading downloads: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 hover:bg-red-700"
        >
          Retry
        </Button>
      </div>
    )
  }

  const filteredDownloads = downloads.filter(download => {
    const matchesSearch = download.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         download.course.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || download.category === filterType
    return matchesSearch && matchesFilter
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case 'video':
        return <Video className="w-8 h-8 text-blue-500" />
      case 'audio':
        return <Music className="w-8 h-8 text-purple-500" />
      case 'image':
        return <Image className="w-8 h-8 text-green-500" />
      case 'archive':
        return <Archive className="w-8 h-8 text-yellow-500" />
      case 'spreadsheet':
        return <File className="w-8 h-8 text-emerald-500" />
      default:
        return <File className="w-8 h-8 text-gray-500" />
    }
  }


  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Downloads</h1>
        </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search downloads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setFilterType(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === category.id
                      ? 'bg-[#ed874a] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downloads List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDownloads.map(download => (
              <div key={download.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(download.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{download.name}</h4>
                    <p className="text-sm text-gray-600">{download.course}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{download.size}</span>
                      <span>Downloaded: {download.downloadDate}</span>
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded">{download.category}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {download.url !== '#' && (
                    <Button variant="ghost" size="sm" onClick={() => window.open(download.url, '_blank')}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#ed874a] hover:text-[#d76f32]"
                    onClick={() => {
                      if (download.url !== '#') {
                        const link = document.createElement('a')
                        link.href = download.url
                        link.download = download.name
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {download.url !== '#' && (
                    <Button variant="ghost" size="sm" onClick={() => window.open(download.url, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {downloads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No downloads available</h3>
              <p className="text-gray-600 mb-4">Enroll in courses to access downloadable materials</p>
              <Button className="bg-[#ed874a] hover:bg-[#d76f32]" onClick={() => window.location.href = '/dashboard/learner/browse'}>
                Browse Courses
              </Button>
            </div>
          ) : filteredDownloads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No downloads found matching your search</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      </div>
  )
}

export default DownloadsPage
