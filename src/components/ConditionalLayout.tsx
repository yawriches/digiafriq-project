"use client"
import { usePathname } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isDashboardPage = pathname?.startsWith('/dashboard')
  const isCheckoutPage = pathname?.startsWith('/checkout')
  const isJoinPage = pathname?.startsWith('/join')

  if (isAuthPage || isDashboardPage || isCheckoutPage || isJoinPage) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
