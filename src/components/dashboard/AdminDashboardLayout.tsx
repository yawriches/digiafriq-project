"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useAuth } from '@/lib/supabase/auth'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  TrendingUp,
  Award,
  CreditCard,
  Bell
} from 'lucide-react'

interface AdminDashboardLayoutProps {
  children: React.ReactNode
  title?: string
  headerAction?: React.ReactNode
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children, title, headerAction }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Content', 'Finance'])
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { selectedCurrency, setSelectedCurrency } = useCurrency()

  const menuItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard/admin" },
    { title: "Users", icon: Users, href: "/dashboard/admin/users" },
    { title: "Memberships", icon: Award, href: "/dashboard/admin/memberships" },
    { title: "Notifications", icon: Bell, href: "/dashboard/admin/notifications" },
    { 
      title: "Content", 
      icon: BookOpen,
      submenu: [
        { title: "Courses", href: "/dashboard/admin/courses" },
        { title: "Tutorials", href: "/dashboard/admin/tutorials" },
        { title: "Categories", href: "/dashboard/admin/categories" }
      ]
    },
    { 
      title: "Finance", 
      icon: DollarSign,
      submenu: [
        { title: "Payments", href: "/dashboard/admin/payments" },
        { title: "Withdrawals", href: "/dashboard/admin/withdrawals" },
        { title: "Commissions", href: "/dashboard/admin/commissions" },
        { title: "Revenue", href: "/dashboard/admin/revenue" }
      ]
    },
    { title: "Analytics", icon: TrendingUp, href: "/dashboard/admin/analytics" },
    { title: "Reports", icon: FileText, href: "/dashboard/admin/reports" },
    { title: "Settings", icon: Settings, href: "/dashboard/admin/settings" },
    { title: "Log out", icon: LogOut, href: "#" }
  ]

  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout...')
      await signOut()
      console.log('✅ Logout complete, waiting before redirect...')
      // Wait a bit to ensure session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('🔄 Redirecting to login...')
      router.push('/login')
    } catch (error) {
      console.error('❌ Logout error:', error)
      router.push('/login')
    }
  }

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(item => item !== menuTitle)
        : [...prev, menuTitle]
    )
  }

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dark Premium Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center ml-4 lg:ml-0">
                <img 
                  src="/digiafriqlogo.png" 
                  alt="DigiAfriq" 
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-bold text-gray-900">Admin</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dark Currency Switcher */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as any)}
                className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[80px] text-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
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
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">A</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Dark Premium Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full pt-20">
          <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.title}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-3" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedMenus.includes(item.title) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedMenus.includes(item.title) && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                              isActive(subItem.href)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : item.title === 'Log out' ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-700"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Dark Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dark Main Content */}
      <div className="lg:pl-64 pt-16">
        <main className="p-6 bg-gray-50 min-h-screen">
          {title && (
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {headerAction && (
                <div className="flex items-center gap-2">
                  {headerAction}
                </div>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboardLayout
