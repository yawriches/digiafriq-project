// Course data functions - fetches real data from Supabase
import { supabase } from './supabase/client';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  lesson_note?: string;
  type: 'video' | 'text' | 'file';
  content_url: string;
  file_url?: string;
  duration: string;
  order_index: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

export interface CourseProgress {
  [lessonId: string]: boolean;
}

export interface CourseProgressData {
  id: string;
  completed: boolean;
  completed_at: string | null;
  last_accessed: string;
}

// Helper to format duration from minutes to "MM:SS" or "HH:MM" format
const formatDuration = (durationMinutes: number | null): string => {
  if (!durationMinutes) return "0:00";
  const hours = Math.floor(durationMinutes / 60);
  const minutes = Math.floor(durationMinutes % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes}:00`;
};

export const fetchModulesAndLessons = async (courseId: string): Promise<Module[]> => {
  console.log('Fetching modules and lessons for course:', courseId);
  
  // Fetch modules with their lessons from Supabase
  const { data: modulesData, error: modulesError } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      description,
      order_index,
      lessons (
        id,
        title,
        description,
        content,
        video_url,
        file_url,
        lesson_type,
        duration,
        order_index,
        instructor_notes
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    throw modulesError;
  }

  if (!modulesData || modulesData.length === 0) {
    console.log('No modules found for course:', courseId);
    return [];
  }

  // Transform the data to match our interface
  const modules: Module[] = modulesData.map((mod: any) => ({
    id: mod.id,
    title: mod.title,
    description: mod.description || '',
    order_index: mod.order_index,
    lessons: (mod.lessons || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description || '',
        lesson_note: lesson.instructor_notes || undefined,
        type: lesson.lesson_type as 'video' | 'text' | 'file',
        content_url: lesson.video_url || lesson.content || '',
        file_url: lesson.file_url || undefined,
        duration: formatDuration(lesson.duration),
        order_index: lesson.order_index
      }))
  }));

  console.log('Fetched modules:', modules);
  return modules;
};

export const fetchLessonProgress = async (userId: string, courseId?: string): Promise<CourseProgress> => {
  console.log('Fetching lesson progress for user:', userId);
  
  // Get current user if userId is a placeholder
  let actualUserId = userId;
  if (userId === 'demo-user-123') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      actualUserId = user.id;
    } else {
      console.log('No authenticated user found');
      return {};
    }
  }

  // First get the enrollment for this course
  let enrollmentId: string | null = null;
  if (courseId) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', actualUserId)
      .eq('course_id', courseId)
      .single();
    
    enrollmentId = enrollment?.id || null;
  }

  // Fetch lesson progress from database
  let query = supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', actualUserId);
  
  if (enrollmentId) {
    query = query.eq('enrollment_id', enrollmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching lesson progress:', error);
    return {};
  }

  // Transform to CourseProgress format
  const progress: CourseProgress = {};
  if (data) {
    data.forEach((item: any) => {
      progress[item.lesson_id] = item.is_completed;
    });
  }

  console.log('Fetched progress:', progress);
  return progress;
};

export const checkAndUpdateCourseCompletion = async (
  userId: string, 
  courseId: string
): Promise<boolean> => {
  console.log('Checking course completion for user:', userId, 'course:', courseId);
  
  // Get current user if userId is a placeholder
  let actualUserId = userId;
  if (userId === 'demo-user-123') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      actualUserId = user.id;
    } else {
      return false;
    }
  }

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, progress_percentage')
    .eq('user_id', actualUserId)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) {
    console.log('No enrollment found');
    return false;
  }

  // Get total lessons in the course
  const { data: modules } = await supabase
    .from('modules')
    .select('lessons(id)')
    .eq('course_id', courseId);

  const totalLessons = modules?.reduce((sum: number, mod: any) => 
    sum + (mod.lessons?.length || 0), 0) || 0;

  if (totalLessons === 0) {
    return false;
  }

  // Get completed lessons count
  const { count: completedCount } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', actualUserId)
    .eq('enrollment_id', enrollment.id)
    .eq('is_completed', true);

  const progressPercentage = Math.round(((completedCount || 0) / totalLessons) * 100);
  const isCompleted = progressPercentage >= 100;

  // Update enrollment progress
  await supabase
    .from('enrollments')
    .update({ 
      progress_percentage: progressPercentage,
      completed_at: isCompleted ? new Date().toISOString() : null
    })
    .eq('id', enrollment.id);

  console.log('Course progress:', progressPercentage, '% - Completed:', isCompleted);
  return isCompleted;
};

export const markLessonComplete = async (
  userId: string,
  lessonId: string
): Promise<boolean> => {
  console.log('Marking lesson complete:', lessonId, 'for user:', userId);
  
  // Get current user if userId is a placeholder
  let actualUserId = userId;
  if (userId === 'demo-user-123') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      actualUserId = user.id;
    } else {
      console.error('No authenticated user found');
      return false;
    }
  }

  // Get the lesson's course via module
  const { data: lesson } = await supabase
    .from('lessons')
    .select('module_id, modules(course_id)')
    .eq('id', lessonId)
    .single();

  if (!lesson) {
    console.error('Lesson not found');
    return false;
  }

  const courseId = (lesson.modules as any)?.course_id;
  if (!courseId) {
    console.error('Course not found for lesson');
    return false;
  }

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', actualUserId)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) {
    console.error('No enrollment found for this course');
    return false;
  }

  // Upsert lesson progress
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: actualUserId,
      lesson_id: lessonId,
      enrollment_id: enrollment.id,
      is_completed: true,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) {
    console.error('Error marking lesson complete:', error);
    return false;
  }

  console.log('Lesson marked as complete successfully');
  return true;
};

export const resetCourseProgress = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  console.log('Resetting course progress for user:', userId, 'course:', courseId);
  
  // Get current user if userId is a placeholder
  let actualUserId = userId;
  if (userId === 'demo-user-123') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      actualUserId = user.id;
    } else {
      console.error('No authenticated user found');
      return false;
    }
  }

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', actualUserId)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) {
    console.error('No enrollment found for this course');
    return false;
  }

  // Delete all lesson progress for this enrollment
  const { error: deleteError } = await supabase
    .from('lesson_progress')
    .delete()
    .eq('user_id', actualUserId)
    .eq('enrollment_id', enrollment.id);

  if (deleteError) {
    console.error('Error deleting lesson progress:', deleteError);
    return false;
  }

  // Reset enrollment progress
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({ 
      progress_percentage: 0,
      completed_at: null
    })
    .eq('id', enrollment.id);

  if (updateError) {
    console.error('Error resetting enrollment:', updateError);
    return false;
  }

  console.log('Course progress reset successfully');
  return true;
};
