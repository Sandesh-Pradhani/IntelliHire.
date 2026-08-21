import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, LogIn, LogOut, Sparkles, UserPlus, X } from 'lucide-react'
import ROUTES, { getDashboardRoute } from '../../constants/routes'
import { AuthContext } from '../../context/authContext'
import notificationService from '../../services/notification.service'
import { normalizeArray } from '../../utils/apiNormalizer'

function NotificationDropdown({ onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        const data = await notificationService.getNotifications()
        const items = data?.notifications || normalizeArray(data)
        setNotifications(items.slice(0, 8))
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silent
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div className="absolute top-full right-0 z-50 mt-2 w-[360px] rounded-2xl border border-slate-200 bg-white shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[10px] font-semibold text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 ${
                  !n.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${n.read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-slate-100 px-4 py-2.5">
          <Link
            to={ROUTES.CANDIDATE.NOTIFICATIONS}
            onClick={onClose}
            className="block text-center text-xs font-semibold text-blue-600 hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </div>
    </>
  )
}

function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    async function fetchCount() {
      try {
        const data = await notificationService.getNotifications()
        setUnreadCount(data?.unreadCount || 0)
      } catch {
        // silent
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[72px] border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all duration-300">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to={user ? getDashboardRoute(user.role) : ROUTES.LOGIN}
          className="group shrink-0 flex items-center gap-2.5 focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all duration-300 group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            IntelliHire <span className="font-extrabold text-blue-600">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-500 sm:flex">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                {user.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
              </span>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((value) => !value)}
                  className="relative rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationDropdown onClose={() => setShowNotifications(false)} />
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
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
