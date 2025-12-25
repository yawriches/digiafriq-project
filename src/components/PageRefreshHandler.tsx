'use client';

import { usePageRefreshOnVisibilityChange } from '@/lib/hooks/usePageRefreshOnVisibilityChange';

/**
 * Component that handles page refresh when user returns to tab
 * This component should be placed in the root layout to ensure it's always active
 */
export function PageRefreshHandler() {
  usePageRefreshOnVisibilityChange();
  
  // This component doesn't render anything
  return null;
}