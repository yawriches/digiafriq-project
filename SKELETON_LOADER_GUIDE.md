# Skeleton Loader Implementation Guide

## Overview

This guide explains how to implement skeleton loaders for new pages in the Digiafriq application. Skeleton loaders provide a better user experience by showing placeholder content while data is loading, instead of blank screens or full-page spinners.

## Architecture

### Top-Loading Bar
- **Component**: `RouteLoading.tsx`
- **Purpose**: Shows a thin progress bar at the top during route navigation
- **Location**: Integrated in root layout
- **Library**: NProgress

### Skeleton Components
- **Location**: `src/components/skeletons/DashboardSkeleton.tsx`
- **Available Skeletons**:
  - `StatCardSkeleton` - For dashboard stat cards
  - `CourseCardSkeleton` - For course listings
  - `TableRowSkeleton` - For table rows
  - `LearnerDashboardSkeleton` - Complete learner dashboard
  - `AffiliateDashboardSkeleton` - Complete affiliate dashboard
  - `AdminDashboardSkeleton` - Complete admin dashboard

## Implementation Pattern

### 1. Import the Skeleton Component

```typescript
import { LearnerDashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
```

### 2. Replace Loading Logic

**❌ OLD PATTERN (Full-page spinner):**
```typescript
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  )
}
```

**✅ NEW PATTERN (Skeleton loader):**
```typescript
if (loading) {
  return <LearnerDashboardSkeleton />
}
```

### 3. Remove Loading Indicators from Data Display

**❌ OLD PATTERN:**
```typescript
const statsCards = [
  {
    title: "Total Users",
    value: loading ? "..." : stats.totalUsers.toString(),
    // ...
  }
]
```

**✅ NEW PATTERN:**
```typescript
const statsCards = [
  {
    title: "Total Users",
    value: stats.totalUsers.toString(),
    // ...
  }
]
```

## Creating Custom Skeleton Loaders

### Basic Skeleton Element

```typescript
<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
```

### Skeleton Card Example

```typescript
export function CustomCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )
}
```

### Full Page Skeleton Example

```typescript
export function CustomPageSkeleton() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CustomCardSkeleton />
        <CustomCardSkeleton />
        <CustomCardSkeleton />
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
```

## Layout Updates

### Learner Layout
- Removed full-page spinner
- Renders layout immediately with children
- Page components handle their own loading states

### Affiliate Layout
- Removed full-page spinner
- Renders layout immediately with children
- Membership checks happen after layout renders

### Admin Layout
- Already server component (no changes needed)
- Pages handle their own loading states

## Critical Blocking Spinners

**Keep small centered spinners ONLY for:**
- Payment processing
- Form submissions
- Critical blocking actions

**Example (Payment Processing):**
```typescript
{isProcessing && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#ed874a] mx-auto mb-3" />
      <p className="text-gray-600">Processing payment...</p>
    </div>
  </div>
)}
```

## Best Practices

### ✅ DO:
- Match skeleton shape to actual content
- Use `animate-pulse` for shimmer effect
- Show skeletons immediately (no delay)
- Keep skeleton simple and clean
- Use consistent gray colors (`bg-gray-200`)

### ❌ DON'T:
- Use full-page spinners for page loads
- Block layout rendering
- Show "Loading..." text with skeletons
- Make skeletons too detailed
- Use skeletons for critical blocking actions

## Testing Checklist

After implementing skeleton loaders:

- [ ] Navigate between dashboards - skeletons appear briefly
- [ ] Top-loading bar shows during route changes
- [ ] No full-page spinners appear
- [ ] No blank screens during loading
- [ ] Layout renders immediately
- [ ] Content appears smoothly after loading
- [ ] No flicker or hard refresh required
- [ ] Critical actions still show appropriate spinners

## File Structure

```
src/
├── components/
│   ├── RouteLoading.tsx          # Top-loading bar
│   └── skeletons/
│       └── DashboardSkeleton.tsx # All skeleton components
├── styles/
│   └── nprogress.css             # NProgress custom styles
└── app/
    ├── layout.tsx                # RouteLoading integrated here
    └── dashboard/
        ├── learner/
        │   └── page.tsx          # Uses LearnerDashboardSkeleton
        ├── affiliate/
        │   └── page.tsx          # Uses AffiliateDashboardSkeleton
        └── admin/
            └── page.tsx          # Uses AdminDashboardSkeleton
```

## NProgress Configuration

Located in `RouteLoading.tsx`:

```typescript
NProgress.configure({ 
  showSpinner: false,      // Hide spinner (we only want the bar)
  trickleSpeed: 200,       // Speed of progress bar
  minimum: 0.08,           // Minimum percentage
  easing: 'ease',          // Animation easing
  speed: 500               // Animation speed
})
```

## Customizing NProgress Styles

Edit `src/styles/nprogress.css`:

```css
#nprogress .bar {
  background: linear-gradient(90deg, #ed874a, #d76f32);
  height: 3px;
}
```

## Migration Checklist for New Pages

1. [ ] Import appropriate skeleton component
2. [ ] Replace full-page spinner with skeleton
3. [ ] Remove loading indicators from data display
4. [ ] Test navigation to/from the page
5. [ ] Verify no flicker or blank screens
6. [ ] Ensure layout renders immediately

## Support

For questions or issues with skeleton loaders, refer to:
- `src/components/skeletons/DashboardSkeleton.tsx` - Example implementations
- `src/app/dashboard/learner/page.tsx` - Reference implementation
- This guide for patterns and best practices
