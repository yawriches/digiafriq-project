"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/supabase/auth"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Pricing", href: "/#pricing" },
  { name: "FAQ", href: "/#faq" },
  { name: "Blog", href: "/#blog" },
  { name: "Affiliate Network", href: "/join/dcs-affiliate" },
  { name: "Contact Us", href: "/contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const { error } = await signOut()
    if (!error) {
      router.push('/')
    }
    setIsLoggingOut(false)
  }

  return (
    <header className="bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between py-4 px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/digiafriqlogo.png"
              alt="Digiafriq logo"
              width={130}
              height={30}
              className="h-auto w-auto"
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-700 hover:text-[#4A0D66] transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right: Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="border-[#ed874a] text-[#4A0D66] hover:bg-[#ed874a] hover:text-white"
                asChild
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button
                className="bg-[#ed874a] text-white hover:bg-[#d76f32]"
                asChild
              >
                <Link href="/signup">Join Now</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#ed874a]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white px-6 pb-6">
          <div className="flex flex-col gap-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 text-sm hover:text-[#4A0D66]"
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600 text-white w-full hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 text-sm hover:text-[#ed874a]">
                  Log In
                </Link>
                <Button
                  className="bg-[#ed874a] text-white w-full hover:bg-[#3a0952]"
                  asChild
                >
                  <Link href="/signup">Join Now</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
