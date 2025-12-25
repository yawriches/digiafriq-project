"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, 
  CheckCircle, 
  PlayCircle, 
  FileText, 
  Video, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Clock,
  Star,
  Share2,
  Bookmark,
  MessageSquare,
  Menu,
  X,
  ArrowLeft,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  fetchModulesAndLessons, 
  fetchLessonProgress, 
  checkAndUpdateCourseCompletion,
  markLessonComplete,
  resetCourseProgress,
  type Lesson,
  type Module,
  type CourseProgress,
  type CourseProgressData
} from "@/lib/courseData";
// import { useAuth } from "@/lib/auth"; // Commented out to avoid provider requirement
import VideoPlayer from "@/components/VideoPlayer";
import { useToast } from "@/components/ui/use-toast";
import { ToastContainer } from "@/components/ui/toast";

const CoursePlayerPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  // Mock user for demo purposes - replace with real auth when ready
  const userId = "demo-user-123";
  
  // State management
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<CourseProgress>({});
  const [courseProgress, setCourseProgress] = useState<CourseProgressData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  // const [isRealtime, setIsRealtime] = useState(false);
  const [courseStats, setCourseStats] = useState({
    totalLessons: 0,
    completedLessons: 0,
    totalDuration: "0h 0m"
  });

  const { toast, toasts, dismiss } = useToast();

  // Load course data
  const loadData = useCallback(async () => {
    if (!courseId) return;
    
    console.log('Loading course data for courseId:', courseId, 'userId:', userId);
    setLoading(true);
    try {
      const mods = await fetchModulesAndLessons(courseId);
      const prog = await fetchLessonProgress(userId, courseId);
      
      console.log('Fetched modules:', mods);
      console.log('Fetched progress:', prog);
      
      setModules(mods);
      setProgress(prog);
      
      // Calculate course stats
      const totalLessons = mods.reduce((sum, mod) => sum + mod.lessons.length, 0);
      const completedLessons = Object.values(prog).filter(Boolean).length;
      
      setCourseStats({
        totalLessons,
        completedLessons,
        totalDuration: calculateTotalDuration(mods)
      });
      
      // Check course completion status
      const courseCompleted = await checkAndUpdateCourseCompletion(userId, courseId);
      if (courseCompleted) {
        setCourseProgress(prev => prev ? { ...prev, completed: true } : { 
          id: '', 
          completed: true, 
          completed_at: new Date().toISOString(), 
          last_accessed: new Date().toISOString() 
        });
      }
      
      // Select first lesson by default
      if (mods.length && mods[0].lessons.length) {
        setSelectedLesson(mods[0].lessons[0]);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, userId, toast]);

  // Mark lesson as complete
  const handleMarkComplete = useCallback(async () => {
    if (!selectedLesson || !courseId) {
      console.log('Missing required data:', { userId, selectedLesson, courseId });
      return;
    }
    
    console.log('Marking lesson as complete:', {
      userId,
      lessonId: selectedLesson.id,
      courseId
    });
    
    try {
      const success = await markLessonComplete(userId, selectedLesson.id);
      
      if (!success) {
        toast({
          title: "Error",
          description: "Failed to mark lesson as complete. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Lesson progress updated successfully');
      
      // Update local state
      setProgress(prev => ({ ...prev, [selectedLesson.id]: true }));
      // setIsRealtime(true);
      // setTimeout(() => setIsRealtime(false), 2000);
      
      // Update course stats
      setCourseStats(prev => ({
        ...prev,
        completedLessons: prev.completedLessons + 1
      }));
      
      // Show success message
      toast({
        title: "Lesson Completed!",
        description: "Great job! This lesson has been marked as complete.",
      });
      
      // Check if course is now completed
      console.log('Checking course completion...');
      const courseCompleted = await checkAndUpdateCourseCompletion(userId, courseId);
      console.log('Course completion result:', courseCompleted);
      
      if (courseCompleted) {
        setCourseProgress(prev => prev ? { ...prev, completed: true } : { 
          id: '', 
          completed: true, 
          completed_at: new Date().toISOString(), 
          last_accessed: new Date().toISOString() 
        });
        toast({
          title: "🎉 Course Completed!",
          description: "Congratulations! You've completed this course.",
        });
      }
    } catch (error) {
      console.error('Error in handleMarkComplete:', error);
      toast({
        title: "Error",
        description: "Failed to mark lesson as complete. Please try again.",
        variant: "destructive",
      });
    }
  }, [userId, selectedLesson, courseId, toast]);

  // Handle lesson selection
  const handleLessonSelect = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSidebarOpen(false); // Close sidebar on mobile
    // Auto-enable theater mode when selecting a video lesson on desktop
    if (lesson.type === 'video' && window.innerWidth >= 1024) {
      setTheaterMode(true);
    }
  }, []);

  // Toggle theater mode
  const toggleTheaterMode = useCallback(() => {
    setTheaterMode(prev => !prev);
  }, []);

  // Handle course restart (Start Over)
  const handleStartOver = useCallback(async () => {
    if (!courseId) return;
    
    try {
      const success = await resetCourseProgress(userId, courseId);
      
      if (success) {
        // Reset local state
        setProgress({});
        setCourseProgress(null);
        setCourseStats(prev => ({
          ...prev,
          completedLessons: 0
        }));
        
        // Select first lesson
        if (modules.length && modules[0].lessons.length) {
          setSelectedLesson(modules[0].lessons[0]);
        }
        
        toast({
          title: "Course Reset",
          description: "Your progress has been reset. You can start the course from the beginning.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reset course progress. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resetting course:', error);
      toast({
        title: "Error",
        description: "Failed to reset course progress. Please try again.",
        variant: "destructive",
      });
    }
  }, [courseId, userId, modules, toast]);

  // Calculate total duration
  const calculateTotalDuration = (modules: Module[]): string => {
    const totalMinutes = modules.reduce((sum, mod) => {
      return sum + mod.lessons.reduce((lessonSum, lesson) => {
        const duration = lesson.duration || "0:00";
        const [minutes, seconds] = duration.split(':').map(Number);
        return lessonSum + (minutes || 0) + (seconds || 0) / 60;
      }, 0);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  // Navigation helpers
  const allLessons = modules.flatMap(m => m.lessons);
  const currentIdx = selectedLesson ? allLessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  // Progress percentage
  const progressPercentage = courseStats.totalLessons > 0 
    ? Math.round((courseStats.completedLessons / courseStats.totalLessons) * 100) 
    : 0;

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-100 dark:from-slate-900 dark:via-slate-900 dark:to-orange-900/20 ${theaterMode ? 'theater-mode' : ''}`}>
      {/* Theater Mode Header - Compact header when in theater mode */}
      {theaterMode && (
        <div className="hidden lg:flex bg-slate-900 text-white h-12 items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheaterMode}
              className="text-white hover:bg-slate-800"
            >
              <PanelLeft className="w-5 h-5 mr-2" />
              Show Sidebar
            </Button>
            <span className="text-sm text-gray-300 truncate max-w-md">
              {selectedLesson?.title || 'Course Player'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {courseStats.completedLessons}/{courseStats.totalLessons} lessons • {progressPercentage}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheaterMode}
              className="text-white hover:bg-slate-800"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Header - Optimized for mobile first */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-md flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-base font-semibold text-[#ed874a] truncate mx-2">Course Player</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-md flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className={`flex ${theaterMode ? 'lg:pt-12' : ''}`}>
        {/* Sidebar - Mobile first responsive, hidden in theater mode on desktop */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${theaterMode ? 'lg:-translate-x-full lg:w-0 lg:opacity-0' : 'lg:translate-x-0 lg:w-80 lg:opacity-100'}
          fixed lg:static inset-y-0 left-0 z-40
          w-80 bg-white dark:bg-slate-800 border-r border-orange-100 dark:border-slate-700 
          transition-all duration-300 ease-in-out
          lg:sticky lg:top-0 lg:h-screen
          shadow-lg lg:shadow-none
        `}>
          <div className="p-4 lg:p-6 h-full overflow-y-auto">
          {/* Sidebar Header with Close Button (Mobile) */}
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Courses
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheaterMode}
                className="text-gray-600 hover:text-gray-900"
                title="Enter Theater Mode"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Course Progress Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-[#ed874a]" />
              <h2 className="text-xl font-bold text-[#ed874a]">Course Progress</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-[#ed874a]">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{courseStats.completedLessons} of {courseStats.totalLessons} lessons</span>
                <span>{courseStats.totalDuration}</span>
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Course Content */}
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#ed874a] rounded-full"></div>
                  <h3 className="font-semibold text-[#ed874a] text-sm">{module.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {module.lessons.length} lessons
                  </Badge>
                </div>
                
                <ul className="space-y-1 ml-4">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCompleted = progress[lesson.id];
                    const isSelected = selectedLesson?.id === lesson.id;
                    
                    return (
                      <li key={lesson.id}>
                        <button
                          className={`
                            flex items-center w-full text-left px-3 py-2 rounded-lg transition-all duration-200
                            ${isSelected 
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-[#ed874a] font-semibold shadow-sm' 
                              : 'hover:bg-orange-50 dark:hover:bg-slate-700/40 text-gray-700 dark:text-gray-300'
                            }
                            ${isCompleted ? 'border-l-2 border-green-500' : ''}
                          `}
                          onClick={() => handleLessonSelect(lesson)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-[#ed874a] flex-shrink-0" />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {lesson.type === 'video' && <Video className="w-3 h-3 text-gray-400" />}
                            {lesson.type === 'text' && <FileText className="w-3 h-3 text-gray-400" />}
                            {lesson.type === 'file' && <Download className="w-3 h-3 text-gray-400" />}
                            <span className="text-xs text-gray-400">{lesson.duration}</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          </div>
        </aside>

        {/* Main Content - Mobile optimized */}
        <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          {selectedLesson ? (
            <div className="flex-1 p-4 lg:p-8 min-h-0">
              <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                {/* Lesson Header */}
                <Card className="shadow-sm">
                  <CardHeader className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                          {selectedLesson.type === 'video' && <Video className="w-6 h-6 text-[#ed874a]" />}
                          {selectedLesson.type === 'text' && <FileText className="w-6 h-6 text-[#ed874a]" />}
                          {selectedLesson.type === 'file' && <Download className="w-6 h-6 text-[#ed874a]" />}
                          <Badge variant="outline" className="capitalize">
                            {selectedLesson.type}
                          </Badge>
                          {progress[selectedLesson.id] && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 break-words">
                          {selectedLesson.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 lg:gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {selectedLesson.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            Lesson {currentIdx + 1} of {allLessons.length}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Bookmark className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        {/* Mobile: Show only icons */}
                        <Button variant="outline" size="sm" className="sm:hidden p-2">
                          <Bookmark className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="sm:hidden p-2">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Lesson Content - Mobile first responsive grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  {/* Main Content Area */}
                  <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                    {/* Video/Content Player */}
                    {selectedLesson.type === 'video' && (
                      <Card className="shadow-sm">
                        <CardContent className="p-0">
                          <VideoPlayer 
                            videoUrl={selectedLesson.content_url}
                            className="aspect-video"
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Text Content */}
                    {selectedLesson.type === 'text' && (
                      <Card className="shadow-sm">
                        <CardContent className="p-6">
                          <div 
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedLesson.content_url }} 
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* File Download */}
                    {selectedLesson.type === 'file' && (
                      <Card className="shadow-sm">
                        <CardContent className="p-6">
                          <div className="text-center space-y-4">
                            <Download className="w-16 h-16 text-[#ed874a] mx-auto" />
                            <h3 className="text-lg font-semibold">Download Resource</h3>
                            <p className="text-gray-600">{selectedLesson.description}</p>
                            <Button asChild className="w-full">
                              <a href={selectedLesson.file_url} download>
                                <Download className="w-4 h-4 mr-2" />
                                Download File
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Lesson Description */}
                    {selectedLesson.description && (
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">About This Lesson</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {selectedLesson.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Sidebar - Instructor&apos;s Note and Navigation */}
                  <div className="space-y-4 lg:space-y-6">
                    {/* Course Progress */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Course Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span className="font-semibold">{progressPercentage}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                          <div className="text-xs text-gray-500 text-center">
                            {courseStats.completedLessons} of {courseStats.totalLessons} lessons completed
                          </div>
                          {courseProgress?.completed && (
                            <div className="mt-3 space-y-3">
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">Course Completed!</span>
                                </div>
                                {courseProgress.completed_at && (
                                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Completed on {new Date(courseProgress.completed_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <Button 
                                onClick={handleStartOver}
                                variant="outline"
                                className="w-full border-[#ed874a] text-[#ed874a] hover:bg-[#ed874a] hover:text-white"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Start Over
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Instructor&apos;s Note */}
                    {selectedLesson.lesson_note && (
                      <Card className="shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Instructor&apos;s Note
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {selectedLesson.lesson_note}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Navigation */}
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Navigation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            onClick={() => prevLesson && handleLessonSelect(prevLesson)} 
                            disabled={!prevLesson} 
                            variant="outline" 
                            className="flex-1 text-sm"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                          </Button>
                          <Button 
                            onClick={() => nextLesson && handleLessonSelect(nextLesson)} 
                            disabled={!nextLesson} 
                            variant="outline" 
                            className="flex-1 text-sm"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <span className="sm:hidden">Next</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                        
                        <Button 
                          onClick={handleMarkComplete} 
                          disabled={progress[selectedLesson.id]} 
                          className="w-full bg-[#ed874a] hover:bg-[#d76f32] text-white font-semibold"
                        >
                          {progress[selectedLesson.id] ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Complete
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-600">Select a lesson to begin</h2>
                <p className="text-gray-500">Choose a lesson from the sidebar to start learning</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay - Matches learner dashboard */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={dismiss} />
    </div>
  );
};

export default CoursePlayerPage;
