import * as React from 'react'
import { Link, useNavigate } from 'react-router'
import { useUser, useClerk } from '@clerk/clerk-react'
import { Button } from '../ui/button'

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'My Scans', path: '/scans', icon: '🧠' },
  { name: 'Upload New Scan', path: '/upload', icon: '📤' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }
  
  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-background border-r overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link to="/dashboard" className="font-bold text-xl">Neurosphere</Link>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-muted"
                >
                  <span className="mr-3 h-6 w-6 flex items-center justify-center">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <Button variant="ghost" className="text-sm mt-1" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden border-b bg-background">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="font-bold text-xl">Neurosphere</Link>
          
          <div className="flex items-center">
            <div className="ml-3 relative">
              <div className="flex space-x-3">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="p-1 rounded-md text-xl"
                  >
                    {item.icon}
                  </Link>
                ))}
                <Button variant="ghost" onClick={handleSignOut}>
                  🚪
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 