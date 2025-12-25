'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to refresh the page when user returns to tab and navigates
 * This ensures fresh data when user navigates back to the website
 */
export function usePageRefreshOnVisibilityChange() {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  const hasReturnedFromHidden = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('Visibility changed:', document.visibilityState);
      
      if (document.visibilityState === 'visible') {
        console.log('User returned to tab - setting flag for next navigation');
        
        // User has returned to the tab - set flag for next navigation
        hasReturnedFromHidden.current = true;
        
        // Store in sessionStorage to persist across reloads
        sessionStorage.setItem('userReturnedFromHidden', 'true');
        
        // Store timestamp for debugging
        sessionStorage.setItem('returnTimestamp', Date.now().toString());
        
        // DON'T refresh immediately - wait for navigation
        console.log('Flag set - will refresh on next navigation');
      } else if (document.visibilityState === 'hidden') {
        console.log('Tab became hidden');
      }
    };

    // Also listen for window focus events as backup
    const handleWindowFocus = () => {
      console.log('Window focused - checking if we need to set flag');
      
      // Check if we haven't already handled this return
      if (sessionStorage.getItem('userReturnedFromHidden') !== 'true') {
        console.log('Setting return flag from window focus');
        sessionStorage.setItem('userReturnedFromHidden', 'true');
        sessionStorage.setItem('returnTimestamp', Date.now().toString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Check for return status on mount and navigation
  useEffect(() => {
    const userReturned = sessionStorage.getItem('userReturnedFromHidden') === 'true';
    
    // If user returned and pathname changed (navigation occurred)
    if (userReturned && pathname !== lastPathname.current) {
      // Clear the flag and refresh
      sessionStorage.removeItem('userReturnedFromHidden');
      window.location.reload();
    }
    
    // Update last pathname
    lastPathname.current = pathname;
  }, [pathname]);

  // Clean up sessionStorage on unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('userReturnedFromHidden');
    };
  }, []);
}