"use client"
import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  X,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Home,
  Award,
  BarChart3,
  Activity,
  CreditCard,
  BookOpen,
  Trophy,
  Target,
  Users,
  Mail,
  Briefcase,
  Loader2,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [userAvatar, setUserAvatar] = useState('')
  const { selectedCurrency, setSelectedCurrency } = useCurrency()
  const pathname = usePathname()
  const router = useRouter()
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)
  const { user, profile, signOut, refreshProfile } = useAuth()

  // Generate a random avatar for the user
  useEffect(() => {
    const avatarSeed = profile?.id || user?.id || user?.email || Math.random().toString()
    const avatarUrl = `https://picsum.photos/seed/${avatarSeed}/200/200.jpg`
    setUserAvatar(avatarUrl)
  }, [profile?.id, user?.id, user?.email])

  // Get user's first name from profile
  const getFirstName = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  // Get user's initials for avatar
  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) &&
        (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node))
      ) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const sidebarItems: SidebarItem[] = [
    { 
      title: "Dashboard", 
      icon: Home,
      href: "/dashboard/affiliate"
    },
    { 
      title: "Contests", 
      icon: Award,
      submenu: [
        { title: "Running", href: "/dashboard/affiliate/contests/running" },
        { title: "Ended", href: "/dashboard/affiliate/contests/ended" }
      ]
    },
    { title: "Leaderboard", icon: BarChart3, href: "/dashboard/affiliate/leaderboard" },
    { 
      title: "Activity", 
      icon: Activity,
      submenu: [
        { title: "Sales", href: "/dashboard/affiliate/activity/sales" },
        { title: "Transactions", href: "/dashboard/affiliate/activity/transactions" }
      ]
    },
    { 
      title: "Withdrawals", 
      icon: CreditCard,
      submenu: [
        { title: "Withdraw Now", href: "/dashboard/affiliate/withdrawals" },
        { title: "Withdrawal History", href: "/dashboard/affiliate/withdrawals/history" }
      ]
    },
    { title: "Tutorials", icon: BookOpen, href: "/dashboard/affiliate/tutorials", tooltipId: "training-section" },
    { title: "Profile Settings", icon: User, href: "/dashboard/profile" },
    { title: "Log out", icon: LogOut, href: "/login" }
  ]

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(item => item !== menuTitle)
        : [...prev, menuTitle]
    )
  }

  const isActiveRoute = (href: string) => {
    return pathname === href
  }

  const isParentActive = (item: SidebarItem) => {
    if (item.href && pathname === item.href) return true
    if (item.submenu) {
      return item.submenu.some(subItem => pathname === subItem.href)
    }
    return false
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout...')
      await signOut()
      console.log('✅ Logout complete, redirecting...')
      // Full page reload to ensure auth state is completely cleared
      window.location.href = '/login'
    } catch (error) {
      console.error('❌ Logout error:', error)
      window.location.href = '/login'
    }
  }

  // Get available roles from profile
  const availableRoles = (profile as any)?.available_roles || [profile?.role]
  // Force active role to 'affiliate' since we're in affiliate dashboard
  const activeRole: 'affiliate' | 'learner' = 'affiliate'

  const handleRoleSwitch = async (role: 'affiliate' | 'learner') => {
    if (role === activeRole || switchingRole) return

    // If user doesn't have the role, redirect appropriately
    if (!availableRoles.includes(role)) {
      if (role === 'affiliate') {
        window.location.href = '/dashboard/affiliate'
      } else if (role === 'learner') {
        window.location.href = '/dashboard/learner'
      }
      return
    }

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
      // Use full page reload to ensure layout re-initializes for the new role
      window.location.href = role === 'learner' ? '/dashboard/learner' : '/dashboard/affiliate'
    } catch (err) {
      console.error('Unexpected error switching role:', err)
      setSwitchingRole(false)
    }
  }

  const profileMenuItems = [
    { title: "Profile Settings", icon: User, href: "/dashboard/profile" },
    { title: "Change Password", icon: Settings, href: "/dashboard/affiliate/change-password" },
    { title: "Help & Support", icon: HelpCircle, href: "/dashboard/affiliate/help" },
    { title: "Log out", icon: LogOut, action: handleLogout }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Dark Premium Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Image
              src="/digiafriqlogo.png"
              alt="DigiAfriq"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Dark Role Switcher Buttons */}
        <div className="px-3 pt-4 pb-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Switch Role</p>
          <div className="space-y-2">
            <button
              onClick={() => handleRoleSwitch('affiliate')}
              disabled={switchingRole || activeRole === 'affiliate'}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeRole === 'affiliate'
                  ? 'bg-orange-50 border-2 border-orange-200 text-orange-600 shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50'
              } ${switchingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="flex-1 text-left">Affiliate Dashboard</span>
              {activeRole === 'affiliate' && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
              {switchingRole && activeRole !== 'affiliate' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>

            <button
              onClick={() => handleRoleSwitch('learner')}
              disabled={switchingRole || activeRole === 'learner'}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeRole === 'learner'
                  ? 'bg-orange-50 border-2 border-orange-200 text-orange-600 shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50'
              } ${switchingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="flex-1 text-left">E-Learning</span>
              {activeRole === 'learner' && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
              {switchingRole && activeRole !== 'learner' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
          </div>
        </div>

        <nav className="mt-4 px-3 pb-6 h-[calc(100vh-12rem)] overflow-y-auto">
          {sidebarItems.map((item, index) => (
            <div key={index} className="mb-2">
              <div
                className={`flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isParentActive(item) 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:border hover:border-gray-200'
                }`}
                {...(item.tooltipId ? { 'data-tooltip': item.tooltipId } : {})}
                onClick={() => {
                  if (item.submenu) {
                    toggleMenu(item.title)
                  } else if (item.href) {
                    if (item.title === 'Log out') {
                      handleLogout()
                    } else {
                      router.push(item.href)
                      setSidebarOpen(false) // Close sidebar on mobile after navigation
                    }
                  }
                }}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium flex-1">{item.title}</span>
                {item.submenu && (
                  expandedMenus.includes(item.title) ?
                    <ChevronDown className="w-4 h-4" /> :
                    <ChevronRight className="w-4 h-4" />
                )}
              </div>

              {item.submenu && expandedMenus.includes(item.title) && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.submenu.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      href={subItem.href}
                      className={`block px-3 py-2 text-sm rounded-lg cursor-pointer transition-all duration-200 ${
                        isActiveRoute(subItem.href) 
                          ? 'text-orange-700 bg-orange-50 font-medium border border-orange-200' 
                          : 'text-gray-600 hover:text-orange-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Dark Main Content - Mobile first responsive */}
      <div className={`flex-1 flex flex-col min-h-screen ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Dark Header - Mobile optimized height */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 lg:h-16 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center justify-between w-full lg:min-w-0 lg:flex-1 py-2 lg:py-0">
            <div className="flex items-center min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-md flex-shrink-0 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile: Dark optimized compact layout */}
            <div className="lg:hidden flex items-center justify-end w-full gap-2">
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs min-w-[60px] text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
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

              <div className="relative" ref={mobileDropdownRef}>
                <div 
                  className="flex items-center space-x-1.5 min-w-0 flex-1 justify-end cursor-pointer"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300 flex-shrink-0 shadow-sm">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt="Profile Avatar"
                        width={24}
                        height={24}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{getInitials()}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[65px] text-gray-700">{getFirstName()}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                </div>

                {/* Mobile Dark Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/affiliate/change-password"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Password
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false)
                          handleLogout()
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Dark horizontal layout */}
          <div className="hidden lg:flex items-center justify-end space-x-4 w-full">
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as any)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[80px] text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
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

            <div className="relative" ref={desktopDropdownRef}>
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 shadow-sm">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="Profile Avatar"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{getInitials()}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">{getFirstName()}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>

              {/* Desktop Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/affiliate/change-password"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Password
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Membership Expiry Warning */}
        <MembershipExpiryBanner />

        {/* Dark Page Content - Mobile optimized */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0 bg-gray-50">
          {children}
        </main>
      </div>

      {/* Dark Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default AffiliateDashboardLayout
