import { useContext, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import {
  Briefcase,
  FileText,
  Users,
  CalendarCheck,
  BadgeCheck,
  TrendingUp,
  Sparkles,
  Clock,
  Plus,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Filter,
  Activity,
  Inbox
} from 'lucide-react'

const STATUS_COLORS = {
  Applied: 'bg-slate-100 text-slate-600',
  Screening: 'bg-amber-50 text-amber-700',
  Shortlisted: 'bg-blue-50 text-blue-700',
  Interview: 'bg-indigo-50 text-indigo-700',
  Offered: 'bg-emerald-50 text-emerald-700',
  Hired: 'bg-green-50 text-green-700',
  Rejected: 'bg-rose-50 text-rose-700',
}

const BAR_COLORS = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500']

const SKILL_COLORS = [
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-violet-500 to-violet-600',
  'from-sky-500 to-sky-600',
  'from-rose-500 to-rose-600',
  'from-teal-500 to-teal-600',
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-100 rounded-xl h-10 w-10" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-6 bg-slate-100 rounded w-12" />
          <div className="h-2 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

function SkeletonBar() {
  return (
    <div className="space-y-2.5 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-8" />
      </div>
      <div className="h-4 bg-slate-100 rounded-full" />
    </div>
  )
}

function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="p-2 bg-slate-100 rounded-xl h-8 w-8" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-2 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="h-5 bg-slate-100 rounded-full w-16" />
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-slate-50 rounded-2xl mb-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
    </div>
  )
}

function RecruiterDashboard() {
  const { user } = useContext(AuthContext)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  const currentDate = useMemo(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  [])

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

        const [jobsRes, appsRes, intRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/all`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/applications/recruiter`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/interviews/recruiter`, { headers }),
        ])

        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data || [])
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data || [])
        if (intRes.status === 'fulfilled') setInterviews(intRes.value.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalApps = applications.length
  const uniqueCandidates = useMemo(() => {
    const ids = new Set(applications.map(a => a.candidateId || a.candidateEmail || a.candidateName))
    return ids.size
  }, [applications])

  const offeredCount = applications.filter(a => a.status === 'Offered').length
  const hiredCount = applications.filter(a => a.status === 'Hired').length
  const hiringRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0
  const upcomingInterviews = interviews.length

  const applicationsTrend = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      const count = applications.filter(a => {
        const created = a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : null
        return created === dateStr
      }).length
      days.push({ label, count, date: dateStr })
    }
    return days
  }, [applications])

  const hiringFunnel = useMemo(() => {
    return [
      { stage: 'Applied', count: applications.filter(a => a.status).length || applications.length, color: 'bg-blue-500' },
      { stage: 'Screening', count: applications.filter(a => a.status === 'Screening' || a.status === 'screening').length, color: 'bg-indigo-500' },
      { stage: 'Shortlisted', count: applications.filter(a => a.status === 'Shortlisted' || a.status === 'shortlisted').length, color: 'bg-violet-500' },
      { stage: 'Interview', count: interviews.length, color: 'bg-amber-500' },
      { stage: 'Offered', count: offeredCount, color: 'bg-emerald-500' },
      { stage: 'Hired', count: hiredCount, color: 'bg-green-500' },
    ]
  }, [applications, interviews, offeredCount, hiredCount])

  const atsScoreDistribution = useMemo(() => {
    const buckets = [
      { label: '0-20', min: 0, max: 20, count: 0 },
      { label: '20-40', min: 20, max: 40, count: 0 },
      { label: '40-60', min: 40, max: 60, count: 0 },
      { label: '60-80', min: 60, max: 80, count: 0 },
      { label: '80-100', min: 80, max: 101, count: 0 },
    ]
    applications.forEach(a => {
      const score = a.atsScore ?? a.matchScore ?? a.score
      if (typeof score === 'number') {
        for (const b of buckets) {
          if (score >= b.min && score < b.max) { b.count++; break }
        }
      }
    })
    return buckets
  }, [applications])

  const skillDistribution = useMemo(() => {
    const counts = {}
    applications.forEach(a => {
      const skills = a.extractedSkills || a.skills || []
      if (Array.isArray(skills)) {
        skills.forEach(s => {
          const name = typeof s === 'string' ? s.trim() : s?.name || ''
          if (name) counts[name] = (counts[name] || 0) + 1
        })
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [applications])

  const recentActivities = useMemo(() => {
    const activities = []
    applications.forEach(a => {
      if (a.timeline && Array.isArray(a.timeline)) {
        a.timeline.forEach(t => {
          activities.push({
            text: t.action || t.description || t.text || 'Status updated',
            time: t.date || t.createdAt || a.updatedAt,
            status: a.status,
            candidate: a.candidateName || 'Candidate',
          })
        })
      } else {
        activities.push({
          text: `${a.status || 'Applied'}`,
          time: a.updatedAt || a.createdAt,
          status: a.status,
          candidate: a.candidateName || 'Candidate',
        })
      }
    })
    return activities
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      .slice(0, 10)
  }, [applications])

  const maxTrendCount = Math.max(...applicationsTrend.map(d => d.count), 1)
  const maxFunnelCount = Math.max(...hiringFunnel.map(f => f.count), 1)
  const maxAtpsCount = Math.max(...atsScoreDistribution.map(b => b.count), 1)
  const maxSkillCount = Math.max(...skillDistribution.map(s => s.count), 1)

  const formatTime = (t) => {
    if (!t) return ''
    const d = new Date(t)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const statusClass = (s) => STATUS_COLORS[s] || 'bg-slate-100 text-slate-600'

  return (
    <main className="space-y-8 animate-fade-in pb-12">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mb-16 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="h-4 w-4" />
            Recruiter Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {greeting}
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base md:text-lg font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            {currentDate}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/jobs/manage"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.98]"
            >
              <Plus className="h-4.5 w-4.5" />
              Manage Jobs
            </Link>
            <Link
              to="/rankings"
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold px-5 py-3 rounded-2xl transition-all duration-200 active:scale-[0.98]"
            >
              <BarChart3 className="h-4.5 w-4.5" />
              View Rankings
            </Link>
          </div>
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" aria-label="Key Performance Indicators">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {[
              { label: 'Jobs Posted', value: jobs.length, icon: Briefcase, color: 'blue', sub: 'All positions' },
              { label: 'Applications', value: totalApps, icon: FileText, color: 'indigo', sub: 'Total received' },
              { label: 'Candidates', value: uniqueCandidates, icon: Users, color: 'emerald', sub: 'Unique applicants' },
              { label: 'Interviews', value: upcomingInterviews, icon: CalendarCheck, color: 'amber', sub: 'Upcoming' },
              { label: 'Offers', value: offeredCount, icon: BadgeCheck, color: 'violet', sub: 'Sent out' },
              { label: 'Hiring Rate', value: `${hiringRate}%`, icon: TrendingUp, color: 'rose', sub: `${hiredCount} / ${totalApps}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-2">
                  <div className={`p-2.5 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl w-fit`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      {/* CHARTS SECTION */}
      <section className="grid lg:grid-cols-2 gap-8">
        {/* Applications Trend - Horizontal Bars */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Applications Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days activity</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {totalApps} total
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => <SkeletonBar key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {applicationsTrend.map((day, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-8 text-right shrink-0">{day.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${day.count === 0 ? 0 : Math.max((day.count / maxTrendCount) * 100, 8)}%` }}
                    >
                      {day.count > 0 && (
                        <span className="text-[10px] font-bold text-white">{day.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hiring Funnel - Vertical Bars */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hiring Funnel</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pipeline conversion overview</p>
            </div>
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          {loading ? (
            <div className="flex items-end gap-3 h-44">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 bg-slate-100 rounded-t-lg animate-pulse" style={{ height: `${30 + i * 15}%` }} />
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-2 sm:gap-3 h-44 px-1">
              {hiringFunnel.map((stage, idx) => {
                const pct = stage.count === 0 ? 0 : Math.max((stage.count / maxFunnelCount) * 100, 5)
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">{stage.count}</span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                      <div
                        className={`${stage.color} rounded-t-lg transition-all duration-700 ease-out w-full`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">{stage.stage}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ATS Score Distribution - Horizontal Bars */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">ATS Score Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Score buckets across applications</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Score ranges
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonBar key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {atsScoreDistribution.map((bucket, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-10 text-right shrink-0">{bucket.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${bucket.count === 0 ? 0 : Math.max((bucket.count / maxAtpsCount) * 100, 8)}%` }}
                    >
                      {bucket.count > 0 && (
                        <span className="text-[10px] font-bold text-white">{bucket.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skill Distribution - Top 8 Skills */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Skill Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Top 8 skills across all applications</p>
            </div>
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
              Top Skills
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonBar key={i} />)}
            </div>
          ) : skillDistribution.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No skills found"
              description="Skills will appear here once candidates with extracted skills apply"
            />
          ) : (
            <div className="space-y-3">
              {skillDistribution.map((skill, idx) => (
                <div key={skill.name} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 w-24 text-right shrink-0 truncate" title={skill.name}>
                    {skill.name}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${SKILL_COLORS[idx % SKILL_COLORS.length]} h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                      style={{ width: `${skill.count === 0 ? 0 : Math.max((skill.count / maxSkillCount) * 100, 8)}%` }}
                    >
                      {skill.count > 0 && (
                        <span className="text-[10px] font-bold text-white">{skill.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RECENT ACTIVITIES */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Activities</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last {recentActivities.length} activity events across all applications</p>
            </div>
          </div>
          <Link
            to="/applications"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonListItem key={i} />)}
          </div>
        ) : recentActivities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No recent activities"
            description="Activities will appear here as candidates move through the pipeline"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {activity.candidate}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{activity.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClass(activity.status)}`}>
                    {activity.status || 'N/A'}
                  </span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatTime(activity.time)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default RecruiterDashboard
