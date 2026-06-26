import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { Sparkles, LogOut, LogIn, UserPlus, Bell, Moon, Sun } from 'lucide-react'

function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all duration-300">
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Link
          to={user ? (user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard') : '/'}
          className="flex items-center gap-2.5 group focus:outline-none shrink-0"
        >
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 bg-clip-text text-transparent tracking-tight">
            IntelliHire <span className="text-blue-600 font-extrabold">AI</span>
          </span>
        </Link>

        {/* Right: Workspace / Notifications / Theme / Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Workspace indicator */}
              <span className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Workspace
              </span>

              {/* Notifications placeholder */}
              <button className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-white" />
              </button>

              {/* Theme placeholder */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
              >
                {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-100 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          )}

          {!user && (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-slate-50 transition-all duration-200"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                <UserPlus className="h-4 w-4" />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar