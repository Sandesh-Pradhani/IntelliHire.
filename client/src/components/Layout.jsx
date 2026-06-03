import { useState, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import {
  LayoutDashboard,
  History,
  Briefcase,
  Award,
  MessageSquare,
  UploadCloud,
  Menu,
  X,
  User,
  LogOut,
  Sparkles
} from 'lucide-react'

function Layout({ children }) {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/resume-upload',
      label: 'Upload Resume',
      icon: UploadCloud
    },
    {
      path: '/resume-history',
      label: 'Resume History',
      icon: History
    },
    {
      path: '/jobs',
      label: 'Jobs',
      icon: Briefcase
    },
    {
      path: '/rankings',
      label: 'Candidate Rankings',
      icon: Award
    },
    {
      path: '/feedback',
      label: 'Feedback',
      icon: MessageSquare
    },
    {
      path: '/job-match',
      label: 'AI Job Matching',
      icon: Sparkles
    }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 relative">
      {/* MOBILE HEADER BUTTONS */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE OVERLAY BACKGROUND */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-slate-300 fixed left-0 top-16 bottom-0 border-r border-slate-800 z-30 transition-all duration-300">
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Recruitment ATS
              </p>
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* USER PROFILE INFO */}
          {user && (
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
                  {user.name ? user.name[0].toUpperCase() : <User className="h-5 w-5" />}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-sm text-white truncate leading-tight">
                    {user.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                    {user.email || 'Recruiter Account'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/10 active:bg-rose-500/20 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* SIDEBAR - MOBILE */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 z-50 flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:hidden border-r border-slate-800 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-blue-500">IntelliHire Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Recruitment ATS
            </p>
            <nav className="space-y-1.5" onClick={() => setMobileMenuOpen(false)}>
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                        : 'hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* USER PROFILE INFO MOBILE */}
        {user && (
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
                {user.name ? user.name[0].toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-semibold text-sm text-white truncate leading-tight">
                  {user.name}
                </h4>
                <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                  {user.email || 'Recruiter Account'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                logout()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/10 active:bg-rose-500/20 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-72 w-full transition-all duration-300">
        <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout