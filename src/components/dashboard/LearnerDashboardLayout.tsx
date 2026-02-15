"use client"
import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Bell, 
  ChevronDown, 
  ChevronRight,
  X,
  Home,
  BookOpen,
  Award,
  Download,
  User,
  LogOut,
  Users,
  Settings,
  HelpCircle,
  GraduationCap,
  Briefcase,
  Loader2,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/supabase/auth'
import MembershipActivatedBanner from '@/components/MembershipActivatedBanner'
import { MembershipExpiryBanner } from '@/components/dashboard/MembershipExpiryBanner'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import ProfileCompletionModal from '@/components/dashboard/ProfileCompletionModal'
import { supabase } from '@/lib/supabase/client'

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
  const [userAvatar, setUserAvatar] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)
  const { user, profile, signOut, refreshProfile } = useAuth()

  // Check if profile needs completion (sex, date_of_birth, city are required)
  useEffect(() => {
    if (profile) {
      const profileData = profile as any
      const needsCompletion = !profileData.sex || !profileData.date_of_birth || !profileData.city
      setShowProfileModal(needsCompletion)
    }
  }, [profile])

  // Handle profile completion
  const handleProfileComplete = async (data: { sex: string; date_of_birth: string; city: string }) => {
    if (!profile?.id) return

    const { error } = await supabase
      .from('profiles')
      .update({
        sex: data.sex,
        date_of_birth: data.date_of_birth,
        city: data.city
      })
      .eq('id', profile.id)

    if (error) {
      throw new Error(error.message)
    }

    await refreshProfile()
    setShowProfileModal(false)
  }

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
    return user?.email?.split('@')[0] || 'User'
  }

  const getUserInitial = () => {
    const firstName = getFirstName()
    return firstName.charAt(0).toUpperCase()
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
      href: "/dashboard/learner"
    },
    { 
      title: "My Courses", 
      icon: BookOpen,
      href: "/dashboard/learner/courses"
    },
    { 
      title: "Membership", 
      icon: CreditCard,
      href: "/dashboard/learner/membership"
    },
    { 
      title: "Profile Settings", 
      icon: User,
      href: "/dashboard/profile"
    },
    { 
      title: "Log out", 
      icon: LogOut,
      href: "/login"
    }
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
  const activeRole = (profile as any)?.active_role || profile?.role
  const hasAffiliateRole = availableRoles.includes('affiliate')

  // Auto-select learner role when on learner dashboard pages
  const isOnLearnerDashboard = pathname.startsWith('/dashboard/learner')
  const displayActiveRole = isOnLearnerDashboard ? 'learner' : activeRole

  const handleRoleSwitch = async (role: 'learner' | 'affiliate') => {
    if (switchingRole) return

    // If user doesn't have the role, redirect to affiliate dashboard
    if (!availableRoles.includes(role)) {
      if (role === 'affiliate') {
        window.location.href = '/dashboard/affiliate'
      }
      return
    }

    // If already viewing the selected role's dashboard, don't switch
    if (role === displayActiveRole) return

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Image 
              src="/digiafriqlogo.png" 
              alt="DigiAfriq" 
              width={120} 
              height={30}
              className="h-8 w-auto"
            />
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Role Switcher Buttons */}
        <div className="px-3 pt-4 pb-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Switch Role</p>
          <div className="space-y-2">
            <button
              onClick={() => handleRoleSwitch('learner')}
              disabled={switchingRole || displayActiveRole === 'learner'}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                displayActiveRole === 'learner'
                  ? 'bg-orange-50 border-2 border-orange-200 text-orange-600 shadow-sm'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50'
              } ${switchingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="flex-1 text-left">E-Learning</span>
              {displayActiveRole === 'learner' && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
              {switchingRole && displayActiveRole !== 'learner' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>

            <button
              onClick={() => handleRoleSwitch('affiliate')}
              disabled={switchingRole || displayActiveRole === 'affiliate'}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                displayActiveRole === 'affiliate'
                  ? 'bg-orange-50 border-2 border-orange-200 text-orange-700 shadow-sm'
                  : hasAffiliateRole
                  ? 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50'
                  : 'bg-gray-50 text-gray-500 border border-dashed border-gray-300 hover:border-orange-200'
              } ${switchingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="flex-1 text-left">Affiliate Dashboard</span>
              {displayActiveRole === 'affiliate' && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
              {switchingRole && displayActiveRole !== 'affiliate' && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
          </div>
        </div>
        
        <nav className="mt-4 px-3 pb-6 overflow-y-auto h-[calc(100vh-12rem)]">
          {sidebarItems.map((item, index) => (
            <div key={index} className="mb-2">
              <div 
                className={`flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isParentActive(item) 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:border hover:border-gray-200'
                }`}
                onClick={() => {
                  if (item.submenu) {
                    toggleMenu(item.title)
                  } else if (item.href) {
                    if (item.title === 'Log out') {
                      handleLogout()
                    } else {
                      router.push(item.href)
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
                          ? 'text-orange-600 bg-orange-50 font-medium border border-orange-200' 
                          : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                      }`}
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
                        <span className="text-white text-xs font-medium">{getUserInitial()}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[65px] text-gray-700">{getFirstName()}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                </div>

                {/* Mobile Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="py-2">
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ed874a] transition-all duration-200"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/learner/settings"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ed874a] transition-all duration-200"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Change Password
                      </Link>
                      <Link
                        href="/dashboard/learner/help"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ed874a] transition-all duration-200"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <HelpCircle className="w-4 h-4 mr-3" />
                        Help
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false)
                          handleLogout()
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
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
                      <span className="text-white text-sm font-medium">{getUserInitial()}</span>
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
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ed874a] transition-all duration-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/learner/settings"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ed874a] transition-all duration-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Change Password
                    </Link>
                    <Link
                      href="/dashboard/learner/help"
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#ed874a] transition-all duration-200"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <HelpCircle className="w-4 h-4 mr-3" />
                      Help
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
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
      
      {/* Membership Activation Banner */}
      <MembershipActivatedBanner />

      {/* Profile Completion Modal - Blocks access until completed */}
      {showProfileModal && (
        <ProfileCompletionModal onComplete={handleProfileComplete} />
      )}
    </div>
  )
}

export default LearnerDashboardLayout
