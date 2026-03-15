"use client"
import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight,
  X,
  Home,
  BookOpen,
  User,
  LogOut,
  Settings,
  GraduationCap,
  Briefcase,
  Loader2,
  CreditCard,
  Menu
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/supabase/auth'
import MembershipActivatedBanner from '@/components/MembershipActivatedBanner'
import { MembershipExpiryBanner } from '@/components/dashboard/MembershipExpiryBanner'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import ProfileCompletionModal from '@/components/dashboard/ProfileCompletionModal'
import { db as supabase } from '@/lib/supabase/client'

interface SidebarItem {
  title: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href?: string
  submenu?: { title: string; href: string }[]
}

interface LearnerDashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

const LearnerDashboardLayout = ({ children, title = "Dashboard" }: LearnerDashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, profile, signOut, refreshProfile } = useAuth()

  // Check if profile needs completion
  useEffect(() => {
    if (profile && profile.id) {
      const profileData = profile as any
      const needsCompletion = !profileData.sex || !profileData.date_of_birth || !profileData.city
      setShowProfileModal(needsCompletion)
    }
  }, [profile])

  const handleProfileComplete = async (data: { sex: string; date_of_birth: string; city: string }) => {
    if (!profile?.id) return
    const { error } = await supabase
      .from('profiles')
      .update({ sex: data.sex, date_of_birth: data.date_of_birth, city: data.city })
      .eq('id', profile.id)
    if (error) throw new Error(error.message)
    await refreshProfile()
    setShowProfileModal(false)
  }

  const getFirstName = () => {
    if (profile?.full_name) return profile.full_name.split(' ')[0]
    return user?.email?.split('@')[0] || 'User'
  }

  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ')
      if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase()
      return names[0][0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

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
    { title: "Dashboard", icon: Home, href: "/dashboard/learner" },
    { title: "My Courses", icon: BookOpen, href: "/dashboard/learner/courses" },
    { title: "Membership", icon: CreditCard, href: "/dashboard/learner/membership" },
    { title: "Profile", icon: User, href: "/dashboard/profile" },
  ]

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuTitle) ? prev.filter(i => i !== menuTitle) : [...prev, menuTitle]
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
    try { await signOut() } catch (e) { console.error('Logout error:', e) }
    window.location.href = '/login'
  }

  const availableRoles = (profile as any)?.available_roles || [profile?.role]
  const hasAffiliateRole = availableRoles.includes('affiliate')

  const handleRoleSwitch = async (role: 'learner' | 'affiliate') => {
    if (switchingRole || role === 'learner') return
    setSwitchingRole(true)
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { error } = await (supabase as any).rpc('switch_active_role', {
        user_id: profile?.id, new_active_role: role
      })
      if (error) { setSwitchingRole(false); return }
      await refreshProfile()
      window.location.href = '/dashboard/affiliate'
    } catch (err) { setSwitchingRole(false) }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[256px] bg-white border-r border-gray-200/80 shadow-sm transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-gray-100 shrink-0">
          <Link href="/" className="flex items-center">
            <Image src="/digiafriqlogo.png" alt="Digiafriq" width={120} height={30} className="h-7 w-auto" />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Role Switcher */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold bg-white text-gray-900 shadow-sm"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#ed874a]" />
              Learning
            </button>
            <button
              onClick={() => handleRoleSwitch('affiliate')}
              disabled={switchingRole}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${
                hasAffiliateRole
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  : 'text-gray-400 cursor-default'
              } ${switchingRole ? 'opacity-50' : ''}`}
            >
              {switchingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Briefcase className="w-3.5 h-3.5" />}
              Affiliate
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menu</p>
          <div className="space-y-0.5">
            {sidebarItems.map((item, index) => (
              <div key={index}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 ${
                    isParentActive(item)
                      ? 'bg-[#ed874a]/8 text-[#ed874a] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => {
                    if (item.submenu) toggleMenu(item.title)
                    else if (item.href) { router.push(item.href); setSidebarOpen(false) }
                  }}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${isParentActive(item) ? 'text-[#ed874a]' : 'text-gray-400'}`} />
                  <span className="text-[13px] flex-1">{item.title}</span>
                  {item.submenu && (
                    expandedMenus.includes(item.title)
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {item.submenu && expandedMenus.includes(item.title) && (
                  <div className="ml-8 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                    {item.submenu.map((sub, si) => (
                      <Link
                        key={si}
                        href={sub.href}
                        className={`block px-3 py-2 text-[13px] rounded-md transition-colors ${
                          isActiveRoute(sub.href)
                            ? 'text-[#ed874a] font-medium bg-[#ed874a]/5'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
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

        {/* Sidebar Footer */}
        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-[13px] font-medium"
          >
            {isLoggingOut ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <LogOut className="w-[18px] h-[18px]" />}
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200/80 h-[60px] flex items-center px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg mr-3">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page Title - Desktop */}
          <div className="hidden lg:block">
            <h1 className="text-[15px] font-semibold text-gray-800">
              {pathname === '/dashboard/learner' ? 'Dashboard' :
               pathname === '/dashboard/learner/courses' ? 'My Courses' :
               pathname === '/dashboard/learner/membership' ? 'Membership' :
               pathname === '/dashboard/profile' ? 'Profile' : 'Dashboard'}
            </h1>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <NotificationBell />

            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

            {/* Profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ed874a] to-[#d76f32] flex items-center justify-center ring-2 ring-white shadow-sm">
                  <span className="text-white text-[11px] font-bold">{getInitials()}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[13px] font-medium text-gray-800 leading-tight">{getFirstName()}</p>
                  <p className="text-[11px] text-gray-400 leading-tight">Learner</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard/profile" className="flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setProfileDropdownOpen(false)}>
                      <User className="w-4 h-4 mr-2.5 text-gray-400" /> Profile Settings
                    </Link>
                    <Link href="/dashboard/learner/settings" className="flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50" onClick={() => setProfileDropdownOpen(false)}>
                      <Settings className="w-4 h-4 mr-2.5 text-gray-400" /> Change Password
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={() => { setProfileDropdownOpen(false); handleLogout() }} className="flex items-center w-full px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4 mr-2.5" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <MembershipExpiryBanner />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <MembershipActivatedBanner />
      {showProfileModal && <ProfileCompletionModal onComplete={handleProfileComplete} />}
    </div>
  )
}

export default LearnerDashboardLayout
