'use client'

import { usePathname } from 'next/navigation'

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isGuestCallback = pathname?.includes('/payment/guest-callback')

  // Guest callback doesn't require auth
  if (isGuestCallback) {
    return <>{children}</>
  }

  // Middleware enforces auth - just render
  return <>{children}</>
}
