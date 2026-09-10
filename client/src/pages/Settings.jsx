import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Eye, Key, LogOut, RefreshCcw, Settings as SettingsIcon, ShieldCheck, Trash2 } from 'lucide-react'
import { AuthContext } from '../context/authContext.js'
import { getDashboardRoute, getPortfolioRoute } from '../constants/routes'
import http from '../services/http.service'

function Settings({ role }) {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem('notifications_enabled') !== 'false'
  )

  const clearSidebarPreferences = () => {
    localStorage.removeItem('sidebar_collapsed')
    localStorage.removeItem('sidebar_expanded_section')
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordError('')

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all password fields.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setChangingPassword(true)
    try {
      await http.put('/api/auth/change-password', { currentPassword, newPassword })
      setPasswordMsg('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err?.message || 'Failed to change password.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await http.delete('/api/auth/delete-account')
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  const toggleNotifications = () => {
    const next = !notificationsEnabled
    setNotificationsEnabled(next)
    localStorage.setItem('notifications_enabled', String(next))
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Settings</h1>
        <p className="mt-2 text-slate-500">Manage your account, preferences, and security.</p>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Account</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{user?.email || 'Not available'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
            <p className="mt-2 text-sm font-bold text-slate-800 capitalize">{role}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
            <Bell className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Notification Preferences</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Push Notifications</p>
            <p className="text-xs text-slate-400">Receive notifications about applications and updates</p>
          </div>
          <button
            type="button"
            onClick={toggleNotifications}
            className={`relative h-6 w-11 rounded-full transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
            <Key className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
          {passwordMsg && <p className="text-xs text-emerald-600">{passwordMsg}</p>}
          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
            <Eye className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Privacy</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-600">
          <p>Your profile is visible to recruiters only when you apply to their jobs.</p>
          <p>Resume data is processed by our AI engine for analysis and matching.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <RefreshCcw className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Navigation Preferences</h2>
        </div>
        <p className="text-sm text-slate-600">Reset saved sidebar state if navigation layout gets out of sync.</p>
        <button
          type="button"
          onClick={clearSidebarPreferences}
          className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100"
        >
          Reset Sidebar Preferences
        </button>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Session</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-600">
          <p>Authentication token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          <p>Stored user profile: {localStorage.getItem('user') ? 'Present' : 'Missing'}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={getDashboardRoute(role)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
          <Link
            to={getPortfolioRoute(role)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
          >
            Open Portfolio
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
            <LogOut className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Sign Out</h2>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-700"
        >
          Logout
        </button>
      </section>

      <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Delete Account</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">This action is irreversible. All your data will be permanently deleted.</p>
        {!deleteConfirm ? (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all duration-200 hover:bg-red-100"
          >
            Delete My Account
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default Settings
