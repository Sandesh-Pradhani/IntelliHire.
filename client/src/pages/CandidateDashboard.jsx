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
  ChevronRight
} from 'lucide-react'

function CandidateDashboard() {
  const { user } = useContext(AuthContext)
  const [resumes, setResumes] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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

        const [historyRes, appsRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL}/api/ai/history`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/applications/candidate`, { headers }),
        ])

        if (historyRes.status === 'fulfilled') setResumes(historyRes.value.data || [])
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const STATUS_ICONS = {
    pending: Clock3,
    reviewing: FileText,
    shortlisted: CheckCircle,
    rejected: XCircle,
    accepted: Award,
  }

  const STATUS_COLORS = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
    shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    accepted: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  return (
    <main className="space-y-8 animate-fade-in pb-12">
        {/* HERO */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="h-4 w-4" />
              Candidate Portal
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {greeting}
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
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
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold px-5 py-3 rounded-2xl transition-all duration-200"
              >
                <Briefcase className="h-4.5 w-4.5" />
                Browse Jobs
              </Link>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Resumes Uploaded</p>
                <p className="text-2xl font-extrabold text-slate-800">{resumes.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Applications</p>
                <p className="text-2xl font-extrabold text-slate-800">{applications.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Shortlisted</p>
                <p className="text-2xl font-extrabold text-slate-800">
                  {applications.filter(a => a.status === 'shortlisted' || a.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Avg ATS Score</p>
                <p className="text-2xl font-extrabold text-slate-800">
                  {resumes.length > 0
                    ? Math.round(resumes.reduce((a, r) => a + (r.atsScore || 0), 0) / resumes.length) + '%'
                    : '--'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* APPLICATION STATUS */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
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

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No applications yet</p>
              <Link to="/jobs" className="text-blue-600 text-sm font-semibold hover:underline mt-1 inline-block">
                Browse available jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => {
                const StatusIcon = STATUS_ICONS[app.status] || Clock3
                const statusColor = STATUS_COLORS[app.status] || 'bg-slate-50 text-slate-700 border-slate-200'
                return (
                  <div key={app._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{app.jobTitle || 'Position'}</p>
                        <p className="text-xs text-slate-400">{app.company || 'Company'}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColor}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* RECENT RESUMES */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Resumes</h3>
              <p className="text-xs text-slate-400">Your uploaded resume history</p>
            </div>
            <Link
              to="/resume-history"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              View history <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {resumes.slice(0, 3).map((res, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{res.filename}</p>
                  <p className="text-xs text-slate-400">{new Date(res.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                res.atsScore >= 85 ? 'bg-emerald-50 text-emerald-700' :
                res.atsScore >= 70 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {res.atsScore || 0} ATS
              </span>
            </div>
          ))}
        </section>
    </main>
  )
}

export default CandidateDashboard
