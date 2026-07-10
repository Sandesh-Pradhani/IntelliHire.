import { useContext, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import {
  FileText,
  TrendingUp,
  Briefcase,
  UploadCloud,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  Sparkles,
  Award,
  ChevronRight,
  Send,
  User,
  BarChart3,
  Layers,
  Star,
  CalendarDays,
  Tag,
  Activity
} from 'lucide-react'

const STATUS_CONFIG = {
  applied:         { label: 'Applied',         color: 'bg-blue-100 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  screening:       { label: 'Screening',       color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
  shortlisted:     { label: 'Shortlisted',     color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  assessment:      { label: 'Assessment',      color: 'bg-indigo-100 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  interview:       { label: 'Interview',       color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  'technical round': { label: 'Technical Round', color: 'bg-cyan-100 text-cyan-700 border-cyan-200',     dot: 'bg-cyan-500' },
  'hr round':      { label: 'HR Round',        color: 'bg-pink-100 text-pink-700 border-pink-200',     dot: 'bg-pink-500' },
  offered:         { label: 'Offered',         color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  accepted:        { label: 'Accepted',        color: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
  rejected:        { label: 'Rejected',        color: 'bg-rose-100 text-rose-700 border-rose-200',     dot: 'bg-rose-500' },
  hired:           { label: 'Hired',           color: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
  pending:         { label: 'Pending',         color: 'bg-slate-100 text-slate-600 border-slate-200',   dot: 'bg-slate-400' },
}

const SHORTLISTED_STATUSES = ['shortlisted', 'interview', 'technical round', 'hr round', 'offered', 'accepted', 'hired']

function CandidateDashboard() {
  const { user } = useContext(AuthContext)
  const [resumes, setResumes] = useState([])
  const [applications, setApplications] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [])

  const greeting = useMemo(() => {
    if (!user?.name) return 'Welcome Back'
    const hour = new Date().getHours()
    const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    return `${prefix}, ${user.name.split(' ')[0]}`
  }, [user?.name])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const [historyRes, appsRes, portfolioRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL}/api/ai/history`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/applications/candidate`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/portfolio`, { headers }),
        ])

        if (historyRes.status === 'fulfilled') setResumes(historyRes.value.data || [])
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data || [])
        if (portfolioRes.status === 'fulfilled') setPortfolio(portfolioRes.value.data || null)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const kpis = useMemo(() => {
    const shortlistedCount = applications.filter(a =>
      SHORTLISTED_STATUSES.includes(a.status?.toLowerCase())
    ).length

    const avgAts =
      resumes.length > 0
        ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
        : null

    return [
      {
        label: 'Resumes Uploaded',
        value: resumes.length || 0,
        icon: FileText,
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        ring: 'ring-blue-100',
      },
      {
        label: 'Applications',
        value: applications.length || 0,
        icon: Send,
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        ring: 'ring-emerald-100',
      },
      {
        label: 'Shortlisted',
        value: shortlistedCount,
        icon: CheckCircle,
        bg: 'bg-violet-50',
        text: 'text-violet-600',
        ring: 'ring-violet-100',
      },
      {
        label: 'Avg ATS Score',
        value: avgAts !== null ? `${avgAts}%` : '--',
        icon: BarChart3,
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        ring: 'ring-amber-100',
      },
    ]
  }, [resumes, applications])

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [applications]
  )

  const recentResumes = useMemo(
    () =>
      [...resumes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3),
    [resumes]
  )

  const getStatusConfig = (status) => {
    const key = status?.toLowerCase() || 'pending'
    return STATUS_CONFIG[key] || STATUS_CONFIG.pending
  }

  if (loading) {
    return (
      <main className="space-y-8 animate-fade-in pb-12">
        <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-72 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
            <div className="flex gap-3 mt-6">
              <div className="h-11 w-36 bg-white/10 rounded-2xl animate-pulse" />
              <div className="h-11 w-36 bg-white/10 rounded-2xl animate-pulse" />
            </div>
          </div>
        </section>
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 bg-slate-100 rounded-xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </section>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="h-5 w-36 bg-slate-100 rounded animate-pulse mb-6" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse mb-3" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="space-y-8 animate-fade-in pb-12">
      {/* HERO */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-4 w-4" />
            Candidate Portal
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {greeting}
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-400" />
            {currentDate}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/resume-upload"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200"
            >
              <UploadCloud className="h-4.5 w-4.5" />
              Upload Resume
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-all duration-200"
            >
              <Briefcase className="h-4.5 w-4.5" />
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 ${kpi.bg} ${kpi.text} rounded-xl ring-1 ${kpi.ring}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{kpi.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* MY APPLICATIONS + TIMELINE */}
      <section className="grid lg:grid-cols-5 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">My Applications</h3>
              <p className="text-xs text-slate-400">Track your job application status</p>
            </div>
            <Link
              to="/candidate/applications"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                <Briefcase className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No applications yet</p>
              <Link
                to="/jobs"
                className="text-blue-600 text-sm font-semibold hover:underline mt-1 inline-flex items-center gap-1"
              >
                Browse available jobs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentApplications.map((app) => {
                const sc = getStatusConfig(app.status)
                return (
                  <div
                    key={app._id}
                    className="group flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {app.jobTitle || 'Position'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{app.company || 'Company'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 ml-3">
                      {app.matchScore != null && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full hidden sm:inline-block">
                          {app.matchScore}% match
                        </span>
                      )}
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Application Timeline */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Application Timeline</h3>
              <p className="text-xs text-slate-400">Recent activity on your applications</p>
            </div>
            <Activity className="h-4.5 w-4.5 text-slate-400" />
          </div>

          {recentApplications.filter(a => a.timeline?.length > 0).length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                <Clock className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No timeline events yet</p>
              <p className="text-slate-400 text-xs mt-1">Timeline updates appear as your applications progress</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {recentApplications
                .filter(a => a.timeline?.length > 0)
                .slice(0, 3)
                .map((app) => (
                  <div key={app._id}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      {app.jobTitle || 'Position'}
                      <span className="text-slate-300 font-normal normal-case">— {app.company || 'Company'}</span>
                    </p>
                    <div className="relative pl-6">
                      {app.timeline
                        .slice()
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((entry, idx) => {
                          const tsc = getStatusConfig(entry.status)
                          const isLast = idx === app.timeline.length - 1
                          return (
                            <div key={idx} className="relative pb-5 last:pb-0">
                              {!isLast && (
                                <div className="absolute left-0 top-3 bottom-0 w-px bg-slate-200" />
                              )}
                              <div
                                className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-2 ring-slate-100 ${tsc.dot} z-10`}
                              />
                              <div className="ml-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tsc.color}`}
                                  >
                                    {tsc.label}
                                  </span>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>
                                {entry.note && (
                                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                    {entry.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* RECENT RESUMES */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Resumes</h3>
            <p className="text-xs text-slate-400">Your uploaded resume history & ATS scores</p>
          </div>
          <Link
            to="/resume-history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            View history <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recentResumes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
              <FileText className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">No resumes uploaded</p>
            <Link
              to="/resume-upload"
              className="text-blue-600 text-sm font-semibold hover:underline mt-1 inline-flex items-center gap-1"
            >
              Upload your first resume <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentResumes.map((res, idx) => {
              const scoreColor =
                res.atsScore >= 85
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                  : res.atsScore >= 70
                  ? 'bg-blue-50 text-blue-700 ring-blue-100'
                  : res.atsScore >= 50
                  ? 'bg-amber-50 text-amber-700 ring-amber-100'
                  : 'bg-slate-100 text-slate-600 ring-slate-200'

              const skills = res.extractedSkills || res.skills || []

              return (
                <div
                  key={idx}
                  className="group p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[160px]">
                          {res.filename || 'Untitled Resume'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(res.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${scoreColor} shrink-0 ml-2`}
                    >
                      <Star className="h-3 w-3" />
                      {res.atsScore || 0}%
                    </span>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.slice(0, 4).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-semibold px-2 py-0.5 bg-white text-slate-600 rounded-full border border-slate-200"
                        >
                          {typeof skill === 'string' ? skill : skill.name || skill}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full">
                          +{skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default CandidateDashboard
