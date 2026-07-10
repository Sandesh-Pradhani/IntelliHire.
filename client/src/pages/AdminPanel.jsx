import { useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import {
  Shield,
  Users,
  UserCheck,
  Briefcase,
  Send,
  BarChart3,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Ban,
  CheckCircle,
  Filter,
  Award,
  Layers,
  Target
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'applications', label: 'Applications', icon: Send },
  { id: 'reports', label: 'Reports', icon: TrendingUp },
]

const ROLE_OPTIONS = ['candidate', 'recruiter', 'admin']

const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-700',
  screening: 'bg-amber-100 text-amber-700',
  shortlisted: 'bg-emerald-100 text-emerald-700',
  interview: 'bg-violet-100 text-violet-700',
  rejected: 'bg-rose-100 text-rose-700',
  hired: 'bg-green-100 text-green-700',
  offered: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-slate-100 text-slate-600',
}

function AdminPanel() {
  const { user } = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  // Overview stats
  const [stats, setStats] = useState(null)

  // Users
  const [users, setUsers] = useState([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersPage, setUsersPage] = useState(1)
  const [usersLimit] = useState(10)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)

  // Jobs
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)

  // Applications
  const [applications, setApplications] = useState([])
  const [appsLoading, setAppsLoading] = useState(false)

  // Reports
  const [reportData, setReportData] = useState(null)

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/admin/stats`, { headers: authHeaders() })
      setStats(res.data)
    } catch (err) {
      console.error('Stats fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async (page, search, role) => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams({
        page: page ?? 1,
        limit: usersLimit,
      })
      if (search) params.append('search', search)
      if (role) params.append('role', role)
      const res = await axios.get(`${API_URL}/api/admin/users?${params}`, { headers: authHeaders() })
      setUsers(res.data.users || res.data || [])
      setUsersTotal(res.data.total || res.data.length || 0)
    } catch (err) {
      console.error('Users fetch error:', err)
    } finally {
      setUsersLoading(false)
    }
  }, [usersLimit])

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/admin/jobs`, { headers: authHeaders() })
      setJobs(res.data.jobs || res.data || [])
    } catch (err) {
      console.error('Jobs fetch error:', err)
    } finally {
      setJobsLoading(false)
    }
  }, [])

  const fetchApplications = useCallback(async () => {
    setAppsLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/admin/applications`, { headers: authHeaders() })
      setApplications(res.data.applications || res.data || [])
    } catch (err) {
      console.error('Applications fetch error:', err)
    } finally {
      setAppsLoading(false)
    }
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      const [appsRes, statsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/admin/applications`, { headers: authHeaders() }),
        axios.get(`${API_URL}/api/admin/stats`, { headers: authHeaders() })
      ])
      const apps = appsRes.status === 'fulfilled' ? (appsRes.value.data.applications || appsRes.value.data || []) : []
      const st = statsRes.status === 'fulfilled' ? statsRes.value.data : null

      const statusCounts = {}
      const skillCounts = {}
      const monthlyCounts = {}

      apps.forEach(app => {
        const s = app.status?.toLowerCase() || 'pending'
        statusCounts[s] = (statusCounts[s] || 0) + 1

        if (app.extractedSkills && Array.isArray(app.extractedSkills)) {
          app.extractedSkills.forEach(skill => {
            const name = typeof skill === 'string' ? skill : skill.name || skill
            skillCounts[name] = (skillCounts[name] || 0) + 1
          })
        }

        const date = new Date(app.createdAt || app.date)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthlyCounts[key] = (monthlyCounts[key] || 0) + 1
      })

      const topSkills = Object.entries(skillCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const last6Months = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        last6Months.push({ key, label, count: monthlyCounts[key] || 0 })
      }

      setReportData({ statusCounts, topSkills, monthlyCounts: last6Months, stats: st })
    } catch (err) {
      console.error('Reports fetch error:', err)
    }
  }, [])

  const changeUserRole = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/role`, { role: newRole }, { headers: authHeaders() })
      fetchUsers(usersPage, userSearch, userRoleFilter)
    } catch (err) {
      console.error('Role change error:', err)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/toggle-status`, {}, { headers: authHeaders() })
      fetchUsers(usersPage, userSearch, userRoleFilter)
    } catch (err) {
      console.error('Toggle status error:', err)
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, { headers: authHeaders() })
      fetchUsers(usersPage, userSearch, userRoleFilter)
    } catch (err) {
      console.error('Delete user error:', err)
    }
  }

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return
    try {
      await axios.delete(`${API_URL}/api/admin/jobs/${jobId}`, { headers: authHeaders() })
      fetchJobs()
    } catch (err) {
      console.error('Delete job error:', err)
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user?.role !== 'admin') return
    fetchOverview()
  }, [user, fetchOverview])

  useEffect(() => {
    if (user?.role !== 'admin') return
    if (activeTab === 'users') fetchUsers(1, '', '')
    if (activeTab === 'jobs') fetchJobs()
    if (activeTab === 'applications') fetchApplications()
    if (activeTab === 'reports') fetchReports()
  }, [activeTab, user, fetchUsers, fetchJobs, fetchApplications, fetchReports])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUserSearch = (value) => {
    setUserSearch(value)
    setUsersPage(1)
    fetchUsers(1, value, userRoleFilter)
  }

  const handleRoleFilter = (value) => {
    setUserRoleFilter(value)
    setUsersPage(1)
    fetchUsers(1, userSearch, value)
  }

  const handleUsersPageChange = (page) => {
    setUsersPage(page)
    fetchUsers(page, userSearch, userRoleFilter)
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  const usersTotalPages = Math.ceil(usersTotal / usersLimit)

  return (
    <main className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-1">
            <Shield className="h-4 w-4" />
            Admin Panel
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Platform Administration
          </h1>
          <p className="mt-2 text-slate-300 text-sm">
            Manage users, jobs, and platform-wide analytics
          </p>
        </div>
      </div>

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
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 bg-slate-100 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                      <div className="h-7 w-12 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, bg: 'bg-blue-50', text: 'text-blue-600' },
                { label: 'Total Recruiters', value: stats.totalRecruiters ?? 0, icon: UserCheck, bg: 'bg-indigo-50', text: 'text-indigo-600' },
                { label: 'Total Candidates', value: stats.totalCandidates ?? 0, icon: Users, bg: 'bg-violet-50', text: 'text-violet-600' },
                { label: 'Total Jobs', value: stats.totalJobs ?? 0, icon: Briefcase, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                { label: 'Total Applications', value: stats.totalApplications ?? 0, icon: Send, bg: 'bg-amber-50', text: 'text-amber-600' },
                { label: 'Active Jobs', value: stats.activeJobs ?? 0, icon: Layers, bg: 'bg-rose-50', text: 'text-rose-600' },
              ].map(kpi => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 ${kpi.bg} ${kpi.text} rounded-2xl`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                        <p className="text-3xl font-extrabold text-slate-900 mt-0.5">{kpi.value}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Unable to load stats</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => handleUserSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Search users..."
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                value={userRoleFilter}
                onChange={e => handleRoleFilter(e.target.value)}
                className="border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
              >
                <option value="">All Roles</option>
                {ROLE_OPTIONS.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {usersLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Name</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Email</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Role</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Joined</th>
                      <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-semibold text-slate-800 truncate max-w-[140px]">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 truncate max-w-[180px]">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={u.role}
                            onChange={e => changeUserRole(u._id, e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.status === 'inactive' || u.isBanned
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'inactive' || u.isBanned ? 'bg-rose-500' : 'bg-emerald-500'
                            }`} />
                            {u.status === 'inactive' || u.isBanned ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '--'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleUserStatus(u._id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.status === 'inactive' || u.isBanned
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                              }`}
                              title={u.status === 'inactive' || u.isBanned ? 'Unban' : 'Ban'}
                            >
                              {u.status === 'inactive' || u.isBanned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => deleteUser(u._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {usersTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400">
                  Showing {((usersPage - 1) * usersLimit) + 1} to {Math.min(usersPage * usersLimit, usersTotal)} of {usersTotal}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUsersPageChange(Math.max(1, usersPage - 1))}
                    disabled={usersPage === 1}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: usersTotalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
                    <button
                      key={page}
                      onClick={() => handleUsersPageChange(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        usersPage === page
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handleUsersPageChange(Math.min(usersTotalPages, usersPage + 1))}
                    disabled={usersPage === usersTotalPages}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {jobsLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No jobs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Title</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Company</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Posted By</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Applications</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
                      <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {jobs.map(job => (
                      <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-800 truncate max-w-[200px]">{job.title}</td>
                        <td className="px-5 py-3.5 text-slate-500 truncate max-w-[150px]">{job.company}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            job.status === 'active' || !job.status
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              job.status === 'active' || !job.status ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            {job.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 truncate max-w-[140px]">
                          {job.postedBy?.name || job.recruiterName || '--'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Send className="h-3 w-3" />
                            {job.applicationCount ?? job.applications?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : '--'}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => deleteJob(job._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {appsLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center">
                <Send className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Candidate</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Job</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">ATS Score</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Match Score</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {applications.map(app => {
                      const statusKey = app.status?.toLowerCase() || 'pending'
                      const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.pending
                      return (
                        <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {app.candidateName?.charAt(0)?.toUpperCase() || 'C'}
                              </div>
                              <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                                {app.candidateName || 'Candidate'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 truncate max-w-[160px]">
                            {app.jobTitle || 'Position'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                              {app.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              <Award className="h-3 w-3" />
                              {app.atsScore ?? '--'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              <Target className="h-3 w-3" />
                              {app.matchScore ?? '--'}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 text-xs">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric'
                            }) : '--'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {reportData ? (
            <>
              {/* Applications by Status - Bar Chart */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Applications by Status</h3>
                <p className="text-xs text-slate-400 mb-6">Distribution of all applications across stages</p>
                <div className="flex items-end gap-3 h-48">
                  {Object.entries(reportData.statusCounts).map(([status, count]) => {
                    const maxCount = Math.max(...Object.values(reportData.statusCounts), 1)
                    const height = (count / maxCount) * 100
                    const colors = {
                      applied: 'from-blue-500 to-blue-600',
                      screening: 'from-amber-500 to-amber-600',
                      shortlisted: 'from-emerald-500 to-emerald-600',
                      interview: 'from-violet-500 to-violet-600',
                      rejected: 'from-rose-500 to-rose-600',
                      hired: 'from-green-500 to-green-600',
                      offered: 'from-teal-500 to-teal-600',
                      pending: 'from-slate-400 to-slate-500',
                    }
                    return (
                      <div key={status} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{count}</span>
                        <div
                          className={`w-full bg-gradient-to-t ${colors[status] || colors.pending} rounded-t-xl transition-all duration-700 ease-out min-h-[4px]`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                        <span className="text-[10px] font-semibold text-slate-500 capitalize truncate w-full text-center">
                          {status}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {Object.keys(reportData.statusCounts).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">No status data available</div>
                )}
              </div>

              {/* Top Skills */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Top Skills Across Platform</h3>
                <p className="text-xs text-slate-400 mb-6">Most frequently extracted skills from resumes</p>
                <div className="space-y-4">
                  {reportData.topSkills.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 text-sm">No skills data available</p>
                  ) : (
                    reportData.topSkills.map((skill, idx) => {
                      const maxCount = Math.max(...reportData.topSkills.map(s => s.count), 1)
                      const percent = (skill.count / maxCount) * 100
                      const barColors = [
                        'from-blue-500 to-indigo-600',
                        'from-emerald-500 to-teal-600',
                        'from-violet-500 to-purple-600',
                        'from-sky-400 to-blue-500',
                        'from-amber-400 to-orange-500',
                        'from-rose-400 to-pink-500',
                        'from-cyan-400 to-blue-500',
                        'from-lime-400 to-green-500',
                        'from-fuchsia-400 to-purple-500',
                        'from-yellow-400 to-amber-500',
                      ]
                      return (
                        <div key={skill.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-700">{skill.name}</span>
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                              {skill.count}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div
                              className={`bg-gradient-to-r ${barColors[idx % barColors.length]} h-full rounded-full transition-all duration-700 ease-out`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Applications per Month */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Applications per Month</h3>
                <p className="text-xs text-slate-400 mb-6">Last 6 months application volume</p>
                <div className="flex items-end gap-3 h-44">
                  {reportData.monthlyCounts.map(month => {
                    const maxCount = Math.max(...reportData.monthlyCounts.map(m => m.count), 1)
                    const height = (month.count / maxCount) * 100
                    return (
                      <div key={month.key} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{month.count}</span>
                        <div
                          className="w-full bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-t-xl transition-all duration-700 ease-out min-h-[4px]"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                        <span className="text-[10px] font-semibold text-slate-500">{month.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Loading report data...</p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default AdminPanel
