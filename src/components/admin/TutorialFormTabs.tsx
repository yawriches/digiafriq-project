"use client"
import React, { useState } from 'react'
import { 
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  BookOpen,
  Video,
  Settings,
  Layers
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Lesson {
  id?: string
  title: string
  description: string
  type: string
  content_url: string
  video_url: string
  instructor_notes: string
  duration: string
  order_index: number
}

interface Module {
  id?: string
  title: string
  description: string
  order_index: number
  lessons: Lesson[]
  isExpanded?: boolean
}

interface TutorialForm {
  id?: string
  title: string
  description: string
  instructor: string
  thumbnail_url: string | null
  is_published: boolean
  is_featured: boolean
  category: string
  level: string
  duration: string
  modules: Module[]
}

interface TutorialFormTabsProps {
  form: TutorialForm
  setForm: (form: any) => void
  error: string | null
}

export default function TutorialFormTabs({ form, setForm, error }: TutorialFormTabsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'curriculum'>('details')
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModules(newExpanded)
  }

  const expandAll = () => {
    setExpandedModules(new Set(form.modules.map((_, i) => i)))
  }

  const collapseAll = () => {
    setExpandedModules(new Set())
  }

  const addModule = () => {
    const newModules = [...form.modules, {
      title: `Module ${form.modules.length + 1}`,
      description: '',
      order_index: form.modules.length,
      lessons: []
    }]
    setForm({ ...form, modules: newModules })
    setExpandedModules(new Set([...expandedModules, form.modules.length]))
  }

  const removeModule = (index: number) => {
    const newModules = form.modules.filter((_, i) => i !== index)
    setForm({ ...form, modules: newModules })
    const newExpanded = new Set(expandedModules)
    newExpanded.delete(index)
    setExpandedModules(newExpanded)
  }

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const newModules = [...form.modules]
    newModules[index] = { ...newModules[index], [field]: value }
    setForm({ ...form, modules: newModules })
  }

  const addLesson = (moduleIndex: number) => {
    const newModules = [...form.modules]
    newModules[moduleIndex].lessons.push({
      title: `Lesson ${newModules[moduleIndex].lessons.length + 1}`,
      description: '',
      type: 'video',
      content_url: '',
      video_url: '',
      instructor_notes: '',
      duration: '',
      order_index: newModules[moduleIndex].lessons.length
    })
    setForm({ ...form, modules: newModules })
  }

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...form.modules]
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex)
    setForm({ ...form, modules: newModules })
  }

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    const newModules = [...form.modules]
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      [field]: value
    }
    setForm({ ...form, modules: newModules })
  }

  const totalLessons = form.modules.reduce((sum, m) => sum + m.lessons.length, 0)

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-[#ed874a] text-[#ed874a]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4 mr-2" />
          Tutorial Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'curriculum'
              ? 'border-[#ed874a] text-[#ed874a]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4 mr-2" />
          Curriculum
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
            {form.modules.length} modules · {totalLessons} lessons
          </span>
        </button>
      </div>

      {/* Tutorial Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tutorial Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Getting Started with Affiliate Marketing"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the tutorial..."
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ed874a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructor
            </label>
            <Input
              type="text"
              value={form.instructor}
              onChange={(e) => setForm({ ...form, instructor: e.target.value })}
              placeholder="Instructor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <Input
              type="text"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="e.g., 2 hours, 30 min"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ed874a]"
            >
              <option value="getting-started">Getting Started</option>
              <option value="marketing">Marketing Strategies</option>
              <option value="social-media">Social Media</option>
              <option value="advanced">Advanced Tips</option>
              <option value="sales">Sales Techniques</option>
              <option value="tools">Tools & Resources</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ed874a]"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail URL
            </label>
            <Input
              type="url"
              value={form.thumbnail_url || ''}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="w-4 h-4 text-[#ed874a] rounded focus:ring-[#ed874a]"
              />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="w-4 h-4 text-[#ed874a] rounded focus:ring-[#ed874a]"
              />
              <span className="text-sm text-gray-700">Feature this tutorial</span>
            </label>
          </div>
        </div>
      )}

      {/* Curriculum Tab */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          {/* Curriculum Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Tutorial Curriculum</h3>
              <p className="text-sm text-gray-500">
                {form.modules.length} modules · {totalLessons} lessons
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={expandAll}
                disabled={form.modules.length === 0}
              >
                Expand All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                disabled={form.modules.length === 0}
              >
                Collapse All
              </Button>
              <Button
                type="button"
                onClick={addModule}
                className="bg-[#ed874a] hover:bg-[#d76f32]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </div>
          </div>

          {/* Modules List */}
          {form.modules.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-4">No modules yet. Start building your curriculum!</p>
                <Button
                  type="button"
                  onClick={addModule}
                  className="bg-[#ed874a] hover:bg-[#d76f32]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Module
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {form.modules.map((module, mi) => (
                <Card key={mi} className="overflow-hidden">
                  {/* Module Header */}
                  <div
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      expandedModules.has(mi) ? 'border-b bg-gray-50' : ''
                    }`}
                    onClick={() => toggleModule(mi)}
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    
                    <button type="button" className="p-1">
                      {expandedModules.has(mi) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#ed874a]" />
                        <span className="font-medium text-gray-900 truncate">
                          {module.title || `Module ${mi + 1}`}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {module.lessons.length} lessons
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeModule(mi)
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Module Content - Collapsible */}
                  {expandedModules.has(mi) && (
                    <CardContent className="p-4 space-y-4">
                      {/* Module Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Module Title
                          </label>
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(mi, 'title', e.target.value)}
                            placeholder="Module title"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <Input
                            value={module.description}
                            onChange={(e) => updateModule(mi, 'description', e.target.value)}
                            placeholder="Brief module description"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* Lessons */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Lessons</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addLesson(mi)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Lesson
                          </Button>
                        </div>

                        {module.lessons.length === 0 ? (
                          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
                            <Video className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-500">No lessons yet</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addLesson(mi)}
                              className="mt-2"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add First Lesson
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {module.lessons.map((lesson, li) => (
                              <div
                                key={li}
                                className="flex items-start gap-3 p-3 bg-white border rounded-lg hover:border-gray-300 transition-colors"
                              >
                                <GripVertical className="w-4 h-4 text-gray-400 mt-2 cursor-grab" />
                                <Video className="w-4 h-4 text-blue-500 mt-2" />
                                
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={lesson.title}
                                    onChange={(e) => updateLesson(mi, li, 'title', e.target.value)}
                                    placeholder="Lesson title"
                                    className="font-medium"
                                  />
                                  <Input
                                    value={lesson.video_url}
                                    onChange={(e) => updateLesson(mi, li, 'video_url', e.target.value)}
                                    placeholder="🎬 Video URL (YouTube, Vimeo, etc.)"
                                    className="text-sm"
                                  />
                                  <textarea
                                    value={lesson.instructor_notes}
                                    onChange={(e) => updateLesson(mi, li, 'instructor_notes', e.target.value)}
                                    placeholder="📝 Instructor notes (optional)"
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ed874a]"
                                  />
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLesson(mi, li)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="text-red-600 font-semibold">{error}</div>}
    </div>
  )
}
