import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Palette,
  Bell,
  Eye,
  Trash2,
  Save,
  Mail,
  Phone,
  MapPin,
  FileText,
  Link2,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Loader2,
  EyeOff
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
]

function Settings() {
  const { user, logout } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatarUrl: ''
  })

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Theme state
  const [theme, setTheme] = useState('system')

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    applicationUpdates: true,
    interviewInvites: true,
    offers: true
  })

  // Privacy state
  const [privacy, setPrivacy] = useState({
    showEmail: false,
    showPhone: false,
    profileVisible: true
  })

  // Delete account state
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/settings/profile`, {
          headers: authHeaders()
        })
        const data = res.data
        setProfile({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || ''
        })
        if (data.theme) setTheme(data.theme)
        if (data.notifications) setNotifications(data.notifications)
        if (data.privacy) setPrivacy(data.privacy)
      } catch {
        setProfile({
          name: user?.name || '',
          email: user?.email || '',
          phone: '',
          location: '',
          bio: '',
          avatarUrl: ''
        })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await axios.put(`${API_URL}/api/settings/profile`, {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl
      }, { headers: authHeaders() })
      showMessage('success', 'Profile updated successfully')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const validatePasswords = () => {
    const errors = {}
    if (!passwords.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwords.newPassword) errors.newPassword = 'New password is required'
    else if (passwords.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters'
    if (passwords.newPassword !== passwords.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const changePassword = async () => {
    if (!validatePasswords()) return
    setSaving(true)
    try {
      await axios.put(`${API_URL}/api/settings/password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, { headers: authHeaders() })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showMessage('success', 'Password changed successfully')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const saveTheme = async () => {
    setSaving(true)
    try {
      await axios.put(`${API_URL}/api/settings/theme`, { theme }, { headers: authHeaders() })
      showMessage('success', 'Theme preference saved')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async () => {
    setSaving(true)
    try {
      await axios.put(`${API_URL}/api/settings/notifications`, { notifications }, { headers: authHeaders() })
      showMessage('success', 'Notification preferences saved')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save notifications')
    } finally {
      setSaving(false)
    }
  }

  const savePrivacy = async () => {
    setSaving(true)
    try {
      await axios.put(`${API_URL}/api/settings/privacy`, { privacy }, { headers: authHeaders() })
      showMessage('success', 'Privacy settings saved')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to save privacy settings')
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    if (deleteEmail !== profile.email) {
      showMessage('error', 'Email does not match your account')
      return
    }
    setDeleteLoading(true)
    try {
      await axios.delete(`${API_URL}/api/settings/account`, {
        headers: authHeaders(),
        data: { email: deleteEmail }
      })
      logout()
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="h-10 w-48 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-12 bg-white rounded-2xl border border-slate-100 animate-pulse" />
        <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-11 bg-slate-50 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <main className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <SettingsIcon className="h-6 w-6" />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account preferences and configuration</p>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 p-1.5 flex flex-wrap gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
              <p className="text-sm text-slate-400 mt-1">Update your personal details and public profile</p>
            </div>

            {/* Avatar Preview */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shrink-0">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800">{profile.name || 'Your Name'}</p>
                <p className="text-sm text-slate-400">{profile.email}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Location
                </label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={e => setProfile({ ...profile, location: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Link2 className="h-3.5 w-3.5 text-slate-400" />
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={profile.avatarUrl}
                  onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* PASSWORD TAB */}
        {activeTab === 'password' && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
              <p className="text-sm text-slate-400 mt-1">Ensure your account stays secure with a strong password</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      passwordErrors.currentPassword ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-red-500 font-medium">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.newPassword}
                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      passwordErrors.newPassword ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-red-500 font-medium">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      passwordErrors.confirmPassword ? 'border-red-300' : 'border-slate-200'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={changePassword}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}

        {/* THEME TAB */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Theme Preference</h2>
              <p className="text-sm text-slate-400 mt-1">Choose how IntelliHire looks on your device</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { id: 'light', label: 'Light', icon: Sun, desc: 'Bright and clean', preview: 'bg-white border-2 border-slate-200', previewHeader: 'bg-slate-50 border-b border-slate-200', previewContent: 'bg-slate-100' },
                { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes', preview: 'bg-slate-900 border-2 border-slate-700', previewHeader: 'bg-slate-800 border-b border-slate-700', previewContent: 'bg-slate-700' },
                { id: 'system', label: 'System', icon: Monitor, desc: 'Match your OS', preview: 'bg-gradient-to-br from-white via-slate-100 to-slate-800 border-2 border-slate-300', previewHeader: 'bg-white/50 border-b border-slate-200', previewContent: 'bg-slate-200' },
              ].map(option => {
                const Icon = option.icon
                const isSelected = theme === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-md'
                    }`}
                  >
                    {/* Mini Preview */}
                    <div className={`w-full h-20 rounded-xl mb-3 overflow-hidden ${option.preview}`}>
                      <div className={`h-3 ${option.previewHeader}`} />
                      <div className="p-2 space-y-1.5">
                        <div className={`h-1.5 w-10 rounded ${option.previewContent}`} />
                        <div className={`h-1.5 w-16 rounded ${option.previewContent}`} />
                        <div className={`h-1.5 w-12 rounded ${option.previewContent}`} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                        {option.label}
                      </span>
                      {isSelected && <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{option.desc}</p>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveTheme}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Theme'}
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Notification Settings</h2>
              <p className="text-sm text-slate-400 mt-1">Control how and when you receive notifications</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email', icon: Mail },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications', icon: Bell },
                { key: 'applicationUpdates', label: 'Application Updates', desc: 'Status changes on your applications', icon: FileText },
                { key: 'interviewInvites', label: 'Interview Invites', desc: 'Get notified of interview scheduling', icon: User },
                { key: 'offers', label: 'Offer Notifications', desc: 'Alerts when you receive job offers', icon: CheckCircle },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        notifications[item.key] ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveNotifications}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Privacy Settings</h2>
              <p className="text-sm text-slate-400 mt-1">Control who can see your information</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'showEmail', label: 'Show Email', desc: 'Allow others to see your email address', icon: Mail },
                { key: 'showPhone', label: 'Show Phone', desc: 'Allow others to see your phone number', icon: Phone },
                { key: 'profileVisible', label: 'Profile Visible', desc: 'Make your profile visible to recruiters', icon: Eye },
              ].map(item => {
                const Icon = item.icon
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPrivacy({ ...privacy, [item.key]: !privacy[item.key] })}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        privacy[item.key] ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        privacy[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={savePrivacy}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Privacy'}
              </button>
            </div>
          </div>
        )}

        {/* DANGER ZONE TAB */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-slate-400 mt-1">Irreversible actions for your account</p>
            </div>

            <div className="border-2 border-red-200 bg-red-50 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-xl shrink-0">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800">Delete Account</h3>
                  <p className="text-sm text-red-600/80 mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pl-0 sm:pl-11">
                <div className="p-3 bg-white rounded-xl border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-2">
                    Type your email to confirm: <span className="font-bold">{profile.email}</span>
                  </p>
                  <input
                    type="email"
                    value={deleteEmail}
                    onChange={e => setDeleteEmail(e.target.value)}
                    className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  onClick={deleteAccount}
                  disabled={deleteLoading || deleteEmail !== profile.email}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-lg shadow-red-500/20 transition-all duration-200 active:scale-[0.98]"
                >
                  {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default Settings
