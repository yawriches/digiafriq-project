"use client"
import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight, 
  X,
  User,
  Settings,
  LogOut,
  Home,
  Award,
  BarChart3,
  Activity,
  CreditCard,
  BookOpen,
  Briefcase,
  Loader2,
  GraduationCap,
  Menu
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/supabase/auth'
import { useCurrency } from '@/contexts/CurrencyContext'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { MembershipExpiryBanner } from '@/components/dashboard/MembershipExpiryBanner'

interface SidebarItem {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href?: string
  submenu?: { title: string; href: string }[]
  tooltipId?: string
}

interface AffiliateDashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

const AffiliateDashboardLayout = ({ children, title = "Dashboard" }: AffiliateDashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Dashboard'])
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { selectedCurrency, setSelectedCurrency } = useCurrency()
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, profile, signOut, refreshProfile } = useAuth()

  const getFirstName = () => {
    if (profile?.full_name) return profile.full_name.split(' ')[0]
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ')
      if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase()
      return names[0][0].toUpperCase()
    }
    if (user?.email) return user.email[0].toUpperCase()
    return 'U'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sidebarItems: SidebarItem[] = [
    { title: "Dashboard", icon: Home, href: "/dashboard/affiliate" },
    { 
      title: "Contests", icon: Award,
      submenu: [
        { title: "Running", href: "/dashboard/affiliate/contests/running" },
        { title: "Ended", href: "/dashboard/affiliate/contests/ended" }
      ]
    },
    { title: "Leaderboard", icon: BarChart3, href: "/dashboard/affiliate/leaderboard" },
    { 
      title: "Activity", icon: Activity,
      submenu: [
        { title: "Sales", href: "/dashboard/affiliate/activity/sales" },
        { title: "Transactions", href: "/dashboard/affiliate/activity/transactions" }
      ]
    },
    { 
      title: "Withdrawals", icon: CreditCard,
      submenu: [
        { title: "Withdraw Now", href: "/dashboard/affiliate/withdrawals" },
        { title: "History", href: "/dashboard/affiliate/withdrawals/history" }
      ]
    },
    { title: "Tutorials", icon: BookOpen, href: "/dashboard/affiliate/tutorials", tooltipId: "training-section" },
    { title: "Profile", icon: User, href: "/dashboard/profile" },
  ]

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(item => item !== menuTitle)
        : [...prev, menuTitle]
    )
  }

  const isActiveRoute = (href: string) => pathname === href

  const isParentActive = (item: SidebarItem) => {
    if (item.href && pathname === item.href) return true
    if (item.submenu) return item.submenu.some(sub => pathname === sub.href)
    return false
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
    window.location.href = '/login'
  }

  // Role switching
  const availableRoles = (profile as any)?.available_roles || [profile?.role]

  const handleRoleSwitch = async (role: 'affiliate' | 'learner') => {
    if (role === 'affiliate' || switchingRole) return

    setSwitchingRole(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { error } = await (supabase as any).rpc('switch_active_role', {
        user_id: profile?.id,
        new_active_role: role
      })

      if (error) {
        console.error('Error switching role:', error)
        setSwitchingRole(false)
        return
      }

      await refreshProfile()
      window.location.href = '/dashboard/learner'
    } catch (err) {
      console.error('Unexpected error switching role:', err)
      setSwitchingRole(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      {/* Premium Dark Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-gray-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 shrink-0">
          <Link href="/">
            <Image src="/digiafriqlogo.png" alt="Digiafriq" width={110} height={28} className="h-7 w-auto brightness-0 invert" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Role Switcher */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10 shrink-0">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.12em] mb-2 px-1">Switch View</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => handleRoleSwitch('learner')}
              disabled={switchingRole}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all bg-white/10 text-gray-300 hover:bg-white/15 hover:text-white ${switchingRole ? 'opacity-50' : ''}`}
            >
              {switchingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
              Learning
            </button>
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#ed874a] text-white shadow-sm"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Affiliate
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {sidebarItems.map((item, index) => (
              <div key={index}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isParentActive(item)
                      ? 'bg-[#ed874a] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/8'
                  }`}
                  {...(item.tooltipId ? { 'data-tooltip': item.tooltipId } : {})}
                  onClick={() => {
                    if (item.submenu) {
                      toggleMenu(item.title)
                    } else if (item.href) {
                      router.push(item.href)
                      setSidebarOpen(false)
                    }
                  }}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.title}</span>
                  {item.submenu && (
                    expandedMenus.includes(item.title)
                      ? <ChevronDown className="w-4 h-4 opacity-50" />
                      : <ChevronRight className="w-4 h-4 opacity-50" />
                  )}
                </div>

                {item.submenu && expandedMenus.includes(item.title) && (
                  <div className="ml-7 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {item.submenu.map((sub, si) => (
                      <Link
                        key={si}
                        href={sub.href}
                        className={`block px-3 py-2 text-[13px] rounded-md transition-all ${
                          isActiveRoute(sub.href)
                            ? 'text-[#ed874a] font-medium bg-white/5'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer - Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
          >
            {isLoggingOut ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <LogOut className="w-[18px] h-[18px]" />}
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200/80 h-14 flex items-center px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Currency Selector */}
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 focus:border-[#ed874a] focus:ring-1 focus:ring-[#ed874a]/20 outline-none transition-colors"
            >
              <option value="USD">USD</option>
              <option value="GHS">GHS</option>
              <option value="NGN">NGN</option>
              <option value="KES">KES</option>
              <option value="ZAR">ZAR</option>
              <option value="XOF">XOF</option>
              <option value="XAF">XAF</option>
            </select>

            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ed874a] to-[#d76f32] flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">{getInitials()}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{getFirstName()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2.5 text-gray-400" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/affiliate/change-password"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2.5 text-gray-400" />
                      Change Password
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={() => { setProfileDropdownOpen(false); handleLogout() }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2.5" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Membership Expiry Warning */}
        <MembershipExpiryBanner />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default AffiliateDashboardLayout
