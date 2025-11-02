import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LogOut,
  Server,
  Users,
  Home,
  User,
  HelpCircle,
  Package
} from 'lucide-react'
import ModeSwitcher from './ModeSwitcher'
import ThemeToggle from './ThemeToggle'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Servers', href: '/servers', icon: Server },
    { name: 'Plugins', href: '/plugins', icon: Package },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ]

  if (user?.role === 'admin' || user?.role === 'moderator') {
    navigation.push({ name: 'Users', href: '/users', icon: Users })
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⛏</span>
            </div>
            <h1 className="text-xl font-bold text-white">CraftHost</h1>
            <span className="text-xs text-green-400 font-medium">PRO</span>
          </div>
        </div>
        
        <nav className="mt-8">
          <div className="space-y-1 px-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex-1">
              <ModeSwitcher />
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">{user?.username}</span>
                <span className="text-xs text-gray-500 capitalize">({user?.role})</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 min-h-[calc(100vh-8rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>© 2025 CraftHost Pro</span>
              <span>•</span>
              <span>Premium Minecraft Hosting</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>🔒 Secure</span>
              <span>•</span>
              <span>⚡ High Performance</span>
              <span>•</span>
              <span>🛠️ 24/7 Support</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Layout