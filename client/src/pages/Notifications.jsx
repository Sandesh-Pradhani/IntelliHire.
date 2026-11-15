import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, Briefcase, MessageSquare, Award, AlertCircle } from 'lucide-react'
import { AuthContext } from '../context/authContext'
import notificationService from '../services/notification.service'
import { normalizeArray } from '../utils/apiNormalizer'
import EmptyState from '../components/common/EmptyState'

const TYPE_ICONS = {
  application: Briefcase,
  status_update: CheckCheck,
  interview: MessageSquare,
  message: MessageSquare,
  system: AlertCircle,
}

const TYPE_COLORS = {
  application: 'bg-blue-50 text-blue-600',
  status_update: 'bg-emerald-50 text-emerald-600',
  interview: 'bg-purple-50 text-purple-600',
  message: 'bg-amber-50 text-amber-600',
  system: 'bg-slate-50 text-slate-600',
}

function Notifications() {
  const { user } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await notificationService.getNotifications()
      const items = data?.notifications || normalizeArray(data)
      setNotifications(items)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id)
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n._id !== id))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter((n) => !n.read)
    : notifications.filter((n) => n.type === filter)

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
            <p className="mt-0.5 text-sm text-slate-400">Stay updated on your applications and activities.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'unread', 'application', 'status_update', 'interview', 'system'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filter === f
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            {f === 'unread' && unreadCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">{unreadCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications about your applications and updates will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell
            const colorClass = TYPE_COLORS[notification.type] || 'bg-slate-50 text-slate-600'
            return (
              <div
                key={notification._id}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
                  notification.read ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/50'
                }`}
              >
                <div className={`shrink-0 rounded-xl p-2.5 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${notification.read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 mt-1" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ''}
                    </span>
                    {notification.link && (
                      <Link to={notification.link} className="text-[10px] font-semibold text-blue-600 hover:underline">
                        View
                      </Link>
                    )}
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notification._id)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:underline"
                      >
                        <Check className="h-3 w-3" />
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notification._id)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Notifications
