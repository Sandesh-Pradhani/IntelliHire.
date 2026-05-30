import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { Sparkles, LogOut, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'

function Navbar() {
  const { user, logout } = useContext(AuthContext)

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 bg-clip-text text-transparent tracking-tight">
            IntelliHire <span className="text-blue-600 font-extrabold">AI</span>
          </span>
        </Link>

        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium text-sm px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all duration-200"
              >
                <LayoutDashboard className="h-4 w-4" />
                Workspace
              </Link>

              <button
                onClick={logout}
                className="flex items-center gap-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-100 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
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
    </nav>
  )
}

export default Navbar