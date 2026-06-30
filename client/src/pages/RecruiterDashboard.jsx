/**
 * RecruiterDashboard — Tailored dashboard for recruiters.
 *
 * Shows: job stats, application pipeline, candidate rankings, feedback.
 * Hidden from candidates — requires role='recruiter'.
 */
import { useContext, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import {
  Briefcase,
  FileText,
  Award,
  TrendingUp,
  Sparkles,
  Clock,
  Plus,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Brain,
  ThumbsUp,
  Users,
  BarChart3
} from 'lucide-react'



function RecruiterDashboard() {
  const { user } = useContext(AuthContext)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
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

        const [jobsRes, appsRes, fbRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/all`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/applications/recruiter`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/feedback`, { headers }),
        ])

        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data || [])
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data || [])
        if (fbRes.status === 'fulfilled') setFeedbacks(fbRes.value.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activeJobs = jobs
  const totalApps = applications.length
  const pendingApps = applications.filter(a => a.status === 'Applied').length
  const shortlistedApps = applications.filter(a => a.status === 'Shortlisted' || a.status === 'accepted').length

  return (
    <main className="space-y-8 animate-fade-in pb-12">
        {/* HERO */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="h-4 w-4" />
              Recruiter Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {greeting}
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              {currentDate}
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/jobs/manage" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg transition-all duration-200">
                <Plus className="h-4.5 w-4.5" />
                Manage Jobs
              </Link>
              <Link to="/rankings" className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 text-slate-200 text-sm font-semibold px-5 py-3 rounded-2xl transition-all duration-200">
                <Award className="h-4.5 w-4.5" />
                View Rankings
              </Link>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Jobs', value: activeJobs.length, icon: Briefcase, color: 'blue', sub: `${activeJobs.length > 0 ? activeJobs.filter(j => j.status === 'active').length : activeJobs.length} published` },
            { label: 'Total Applications', value: totalApps, icon: FileText, color: 'indigo', sub: `${pendingApps} pending review` },
            { label: 'Shortlisted', value: shortlistedApps, icon: Award, color: 'emerald', sub: 'Proceed to interview' },
            { label: 'Avg Match Score', value: totalApps > 0 ? `${Math.round(applications.reduce((a, app) => a + (app.matchScore || 0), 0) / totalApps)}%` : '--', icon: TrendingUp, color: 'violet', sub: 'Across all apps' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* PIPELINE + INSIGHTS GRID */}
        <section className="grid lg:grid-cols-12 gap-8">
          {/* Recent Applicants Pipeline */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Application Pipeline</h3>
                <p className="text-xs text-slate-400">Recent candidate applications</p>
              </div>
              <Link to="/applications" className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : applications.slice(0, 4).length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No applications received yet</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 4).map((app) => (
                  <div key={app._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{app.candidateName || 'Candidate'}</p>
                        <p className="text-xs text-slate-400">{app.jobTitle || 'Position'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        app.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        app.status === 'reviewing' ? 'bg-blue-50 text-blue-700' :
                        app.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700' :
                        app.status === 'accepted' ? 'bg-purple-50 text-purple-700' :
                        app.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}
                      </span>
                      {app.matchScore && (
                        <span className="text-xs font-bold text-blue-600">{app.matchScore}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className="bg-gradient-to-br from-indigo-900 to-blue-950 p-6 rounded-3xl text-white shadow-lg space-y-4.5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">AI Insights</h3>
                  <span className="text-[10px] font-semibold text-blue-300 uppercase">Powered by IntelliHire Engine</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                {applications.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <div className="h-5 w-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                    <p>No application data yet. Run job matching to populate the pipeline.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-2.5">
                      <div className="h-5 w-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                      <p>
                        Highest activity is now in <strong>{applications[0]?.status || 'Applied'}</strong> status.
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-2.5">
                      <div className="h-5 w-5 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                      <p>
                        Average match score across pipeline is <strong>{totalApps > 0 ? Math.round(applications.reduce((a, app) => a + (app.matchScore || 0), 0) / totalApps) : 0}%</strong>.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>


            {/* Recent Feedback */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">User Feedback</h3>
                <Link to="/feedback" className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                  All feedback <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {feedbacks.slice(0, 2).map((fb, i) => (
                <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{fb.rating || 5}/5</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">&ldquo;{fb.message || 'No description'}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>
    </main>
  )
}

export default RecruiterDashboard
