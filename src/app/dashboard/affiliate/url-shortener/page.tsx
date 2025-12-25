"use client"
import React, { useState } from 'react'
import { 
  Link as LinkIcon, 
  Copy,
  Eye,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  MousePointer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const URLShortenerPage = () => {
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const shortenedLinks = [
    {
      id: 1,
      originalUrl: "https://digiafriq.com/courses/digital-marketing-fundamentals?ref=affiliate123",
      shortUrl: "https://digi.ly/dm-fund",
      alias: "dm-fund",
      title: "Digital Marketing Fundamentals",
      clicks: 45,
      conversions: 3,
      conversionRate: "6.7%",
      createdDate: "2024-09-15",
      lastClicked: "2024-09-28"
    },
    {
      id: 2,
      originalUrl: "https://digiafriq.com/courses/social-media-strategy?ref=affiliate123",
      shortUrl: "https://digi.ly/sm-strategy",
      alias: "sm-strategy",
      title: "Social Media Strategy",
      clicks: 32,
      conversions: 2,
      conversionRate: "6.3%",
      createdDate: "2024-09-10",
      lastClicked: "2024-09-27"
    },
    {
      id: 3,
      originalUrl: "https://digiafriq.com/courses/content-creation-mastery?ref=affiliate123",
      shortUrl: "https://digi.ly/content-master",
      alias: "content-master",
      title: "Content Creation Mastery",
      clicks: 28,
      conversions: 1,
      conversionRate: "3.6%",
      createdDate: "2024-09-05",
      lastClicked: "2024-09-26"
    }
  ]

  const summaryStats = [
    {
      title: "Total Links",
      value: "3",
      icon: LinkIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Total Clicks",
      value: "105",
      icon: MousePointer,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Conversions",
      value: "6",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Avg. Conversion Rate",
      value: "5.7%",
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ]

  const handleCreateLink = async () => {
    if (!originalUrl) return
    
    setIsCreating(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reset form
    setOriginalUrl('')
    setCustomAlias('')
    setIsCreating(false)
    
    alert('Short link created successfully!')
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Link */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create Short Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original URL *
              </label>
              <Input
                type="url"
                placeholder="https://digiafriq.com/courses/your-course?ref=affiliate123"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Make sure to include your affiliate reference parameter
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Alias (Optional)
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">digi.ly/</span>
                <Input
                  type="text"
                  placeholder="my-custom-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for auto-generated alias
              </p>
            </div>
            
            <Button 
              onClick={handleCreateLink}
              disabled={!originalUrl || isCreating}
              className="bg-[#ed874a] hover:bg-[#d76f32]"
            >
              {isCreating ? 'Creating...' : 'Create Short Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Links Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Short Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shortenedLinks.map((link) => (
              <div key={link.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{link.title}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Short:</span>
                        <a 
                          href={link.shortUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#ed874a] hover:underline font-medium"
                        >
                          {link.shortUrl}
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(link.shortUrl)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Original:</span>
                        <span className="text-sm text-gray-600 truncate max-w-md">
                          {link.originalUrl}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Clicks:</span>
                    <span className="font-medium text-gray-900 ml-1">{link.clicks}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Conversions:</span>
                    <span className="font-medium text-green-600 ml-1">{link.conversions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate:</span>
                    <span className="font-medium text-purple-600 ml-1">{link.conversionRate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium text-gray-900 ml-1">{link.createdDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Click:</span>
                    <span className="font-medium text-gray-900 ml-1">{link.lastClicked}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {shortenedLinks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No short links created yet</p>
              <p className="text-sm">Create your first short link above</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Best Practices</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use descriptive custom aliases</li>
                <li>• Always include your affiliate reference</li>
                <li>• Track performance regularly</li>
                <li>• Test different link placements</li>
                <li>• Use short links in social media</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Link Sharing Ideas</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Social media posts and stories</li>
                <li>• Email newsletters</li>
                <li>• Blog articles and reviews</li>
                <li>• YouTube video descriptions</li>
                <li>• WhatsApp and messaging apps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default URLShortenerPage
