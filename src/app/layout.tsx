import type { Metadata } from "next"
import "./globals.css"
import "./fonts.css"
import "@/styles/nprogress-custom.css"
import "@/styles/nprogress.css"
import { ConditionalLayout } from "@/components/ConditionalLayout"
import { AuthProvider } from '@/lib/supabase/auth'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import TopLoader from '@/components/TopLoader'
import RouteLoading from '@/components/RouteLoading'
import { Toaster } from 'sonner'
import { PageRefreshHandler } from '@/components/PageRefreshHandler'

export const metadata: Metadata = {
  title: {
    default: "Digiafriq - Learn Digital Skills, Earn Affiliate Income",
    template: "%s | Digiafriq",
  },
  description:
    "Digiafriq empowers individuals to learn high-demand digital skills and earn 100% commission through our affiliate network.",
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <TopLoader />
        <RouteLoading />
        <AuthProvider>
          <CurrencyProvider>
            <PageRefreshHandler />
            <ConditionalLayout>{children}</ConditionalLayout>
          </CurrencyProvider>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
