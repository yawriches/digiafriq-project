'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500
})

function RouteLoadingInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Start progress bar on route change
    NProgress.start()

    // Complete progress bar after a short delay
    const timer = setTimeout(() => {
      NProgress.done()
    }, 100)

    return () => {
      clearTimeout(timer)
      NProgress.done()
    }
  }, [pathname, searchParams])

  return null
}

export default function RouteLoading() {
  return (
    <Suspense fallback={null}>
      <RouteLoadingInner />
    </Suspense>
  )
}
