'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500,
});

function TopLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if device is desktop (screen width >= 1024px)
    const isDesktop = () => window.innerWidth >= 1024;

    if (!isDesktop()) {
      return; // Don't show loader on mobile/tablet
    }

    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Check if device is desktop
    const isDesktop = () => window.innerWidth >= 1024;

    if (!isDesktop()) {
      return; // Don't initialize on mobile/tablet
    }

    const handleStart = () => {
      if (isDesktop()) {
        NProgress.start();
      }
    };

    const handleComplete = () => {
      NProgress.done();
    };

    // Intercept all link clicks to show loader
    const handleLinkClick = (e: MouseEvent) => {
      if (!isDesktop()) return;

      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.startsWith('#') && !link.target) {
        // Check if it's an internal link
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          NProgress.start();
        }
      }
    };

    // Intercept form submissions
    const handleFormSubmit = () => {
      if (isDesktop()) {
        NProgress.start();
      }
    };

    // Intercept browser navigation (back/forward)
    const handlePopState = () => {
      if (isDesktop()) {
        NProgress.start();
      }
    };

    // Add event listeners
    document.addEventListener('click', handleLinkClick, true);
    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('submit', handleFormSubmit, true);
    
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('submit', handleFormSubmit, true);
      handleComplete();
    };
  }, []);

  return null;
}

export default function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
