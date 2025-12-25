# Course Player Documentation

## Overview

A comprehensive course player component built for the DigiaFriq platform. This course player provides a modern, responsive interface for learners to consume video, text, and file-based lessons with progress tracking.

## Features

### 🎥 **Multi-Media Support**
- **Video Lessons**: Custom video player with controls (play/pause, seek, volume, fullscreen)
- **Text Lessons**: Rich HTML content display with proper typography
- **File Downloads**: Downloadable resources and materials

### 📱 **Responsive Design**
- Mobile-first approach with collapsible sidebar
- Touch-friendly controls and navigation
- Optimized for tablets and desktop

### 📊 **Progress Tracking**
- Real-time lesson completion tracking
- Course progress visualization
- Automatic course completion detection

### 🎨 **Modern UI/UX**
- Clean, professional interface
- Smooth animations and transitions
- Dark mode support
- Accessible design patterns

## File Structure

```
src/
├── app/dashboard/learner/courses/
│   ├── page.tsx                    # Course listing page
│   └── [courseId]/
│       └── page.tsx               # Course player page
├── components/
│   ├── VideoPlayer.tsx            # Custom video player component
│   └── ui/
│       ├── badge.tsx              # Badge component
│       ├── progress.tsx           # Progress bar component
│       ├── separator.tsx          # Separator component
│       ├── tabs.tsx               # Tabs component
│       ├── toast.tsx              # Toast notification component
│       └── use-toast.ts           # Toast hook
└── lib/
    ├── auth.tsx                   # Authentication context (mock)
    └── courseData.ts              # Course data functions (mock)
```

## Components

### CoursePlayer (`/dashboard/learner/courses/[courseId]`)

The main course player component that handles:
- Course content display
- Lesson navigation
- Progress tracking
- Mobile responsiveness

**Props**: Automatically receives `courseId` from URL parameters

### VideoPlayer (`/components/VideoPlayer.tsx`)

Custom video player with advanced controls:
- Play/pause functionality
- Seek bar with progress indication
- Volume control with mute toggle
- Skip forward/backward (10 seconds)
- Fullscreen support
- Custom styling and responsive design

**Props**:
```typescript
interface VideoPlayerProps {
  videoUrl: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
}
```

## Data Structure

### Course Data Types

```typescript
interface Lesson {
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

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface CourseProgress {
  [lessonId: string]: boolean;
}
```

## Usage

### 1. Navigation to Course Player

From the courses listing page, users can click "Start Course" or "Continue" to navigate to:
```
/dashboard/learner/courses/{courseId}
```

### 2. Course Content Display

The course player automatically:
- Loads course modules and lessons
- Displays the first lesson by default
- Shows progress in the sidebar
- Enables lesson navigation

### 3. Lesson Types

**Video Lessons**:
- Displays custom video player
- Tracks video progress
- Shows instructor notes

**Text Lessons**:
- Renders HTML content
- Supports rich formatting
- Responsive typography

**File Lessons**:
- Provides download interface
- Shows file information
- Direct download links

## Customization

### Styling

The course player uses Tailwind CSS with custom color schemes:
- Primary: Blue tones (`blue-600`, `blue-700`)
- Success: Green tones (`green-500`, `green-600`)
- Progress: Custom orange (`#ed874a`)

### Data Integration

Currently uses mock data from `courseData.ts`. To integrate with real backend:

1. Replace mock functions in `courseData.ts` with actual API calls
2. Update authentication in `auth.tsx` with real auth provider
3. Add Supabase or your preferred backend integration

### Example Supabase Integration

```typescript
// Replace mock function with real Supabase query
export const fetchModulesAndLessons = async (programId: string): Promise<Module[]> => {
  const { data, error } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (*)
    `)
    .eq('program_id', programId)
    .order('order_index');
    
  if (error) throw error;
  return data;
};
```

## Installation

### Dependencies

The course player requires these packages (already added to package.json):

```json
{
  "@radix-ui/react-progress": "^1.1.0",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-tabs": "^1.1.1",
  "lucide-react": "^0.544.0",
  "class-variance-authority": "^0.7.1",
  "tailwind-merge": "^3.3.1"
}
```

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Navigate to courses page:
```
http://localhost:3000/dashboard/learner/courses
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Lazy loading for video content
- Optimized re-renders with React.memo and useCallback
- Efficient state management
- Responsive images and assets

## Accessibility

- Keyboard navigation support
- Screen reader compatible
- ARIA labels and roles
- High contrast support
- Focus management

## Future Enhancements

- [ ] Video playback speed control
- [ ] Closed captions support
- [ ] Bookmark/note-taking functionality
- [ ] Offline content support
- [ ] Advanced analytics tracking
- [ ] Discussion/comments system
- [ ] Quiz integration
- [ ] Certificate generation

## Support

For questions or issues with the course player, please refer to the main project documentation or contact the development team.
