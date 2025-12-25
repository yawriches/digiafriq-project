"use client"
import React, { useState } from 'react'
import { 
  Award, 
  Download,
  Share2,
  CheckCircle,
  Search,
  ExternalLink,
  Clock,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCertificates } from '@/lib/hooks/useCertificates'

const CertificatesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const { certificates: backendCertificates, loading, error } = useCertificates()

  // Transform backend data to match the expected format
  const certificates = backendCertificates.map((cert: any) => {
    const course = cert.enrollment.courses
    const completionDate = new Date(cert.enrollment.completed_at).toLocaleDateString()
    const issueDate = new Date(cert.issued_at).toLocaleDateString()
    
    return {
      id: cert.id,
      courseTitle: course?.title || 'Untitled Course',
      instructor: course?.instructor_id || 'TBA',
      completionDate: completionDate,
      issueDate: issueDate,
      certificateId: cert.id.toUpperCase(),
      grade: cert.grade || 'A',
      score: cert.score || 100,
      duration: course?.estimated_duration ? `${Math.floor(course.estimated_duration / 60)}h ${course.estimated_duration % 60}m` : 'TBA',
      skills: course?.tags || [],
      status: 'issued', // All completed courses have issued certificates
      credentialUrl: cert.certificate_url,
      verified: true,
      thumbnail: '/api/placeholder/400/300'
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ed874a]" />
        <span className="ml-2 text-gray-600">Loading your certificates...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading certificates: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 hover:bg-red-700"
        >
          Retry
        </Button>
      </div>
    )
  }


  // Only show issued certificates (earned certificates available for download)
  const earnedCertificates = certificates.filter(cert => {
    const matchesSearch = cert.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const isEarned = cert.status === 'issued'
    return matchesSearch && isEarned
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'pending':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'text-green-600 bg-green-100'
      case 'A':
        return 'text-blue-600 bg-blue-100'
      case 'B+':
        return 'text-yellow-600 bg-yellow-100'
      case 'B':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleShare = (certificate: { courseTitle: string; credentialUrl: string | null }) => {
    if (certificate.credentialUrl === null) {
      alert('Certificate URL is not available yet.');
      return;
    }
    
    if (navigator.share) {
      navigator.share({
        title: `${certificate.courseTitle} Certificate`,
        text: `I just completed ${certificate.courseTitle} and earned my certificate!`,
        url: certificate.credentialUrl
      })
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(certificate.credentialUrl)
      alert('Certificate URL copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Certificates</h1>
        </div>

        <div>
          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Grid */}
          <div className="space-y-6">
            {earnedCertificates.map(certificate => (
              <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Certificate Preview */}
                    <div className="w-full md:w-48 h-36 bg-gradient-to-br from-[#ed874a] to-[#d76f32] rounded-lg flex items-center justify-center relative">
                      <div className="text-center text-white">
                        <Award className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm font-medium">Certificate</p>
                        <p className="text-xs opacity-90">of Completion</p>
                      </div>
                      {certificate.verified && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Certificate Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{certificate.courseTitle}</h3>
                          <p className="text-sm text-gray-600">by {certificate.instructor}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(certificate.grade)}`}>
                            {certificate.grade}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                            {certificate.status === 'issued' ? 'Issued' : certificate.status === 'processing' ? 'Processing' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Completed:</span> {certificate.completionDate}
                        </div>
                        <div>
                          <span className="font-medium">Score:</span> {certificate.score}%
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {certificate.duration}
                        </div>
                        <div>
                          <span className="font-medium">Certificate ID:</span> {certificate.certificateId}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Skills Earned:</p>
                        <div className="flex flex-wrap gap-2">
                          {certificate.skills && certificate.skills.map((skill: string, index: number) => (
                            <span key={index} className="text-xs bg-[#ed874a]/10 text-[#ed874a] px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {certificate.status === 'issued' ? (
                          <>
                            <Button size="sm" className="bg-[#ed874a] hover:bg-[#d76f32]">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleShare(certificate)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Verify
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <Clock className="w-4 h-4 mr-2" />
                            {certificate.status === 'processing' ? 'Processing...' : 'Pending'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {certificates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No certificates earned yet</h3>
                <p className="text-gray-600 mb-4">Complete courses to earn certificates for download</p>
                <Button className="bg-[#ed874a] hover:bg-[#d76f32]" onClick={() => window.location.href = '/dashboard/learner/browse'}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : earnedCertificates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
    </div>
  )
}

export default CertificatesPage
