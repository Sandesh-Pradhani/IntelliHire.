import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle,
  Clock,
  Clock3,
  FileText,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import ROUTES from '../constants/routes'
import { AuthContext } from '../context/authContext'
import candidateService from '../services/candidate.service'
import { normalizeArray } from '../utils/apiNormalizer'

const STATUS_ICONS = {
  applied: Clock3,
  pending: Clock3,
  screening: FileText,
  reviewing: FileText,
  shortlisted: CheckCircle,
  interview: CheckCircle,
  rejected: XCircle,
  hired: Award,
  selected: Award,
  accepted: Award,
}

const STATUS_COLORS = {
  applied: 'bg-slate-50 text-slate-700 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  screening: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  interview: 'bg-purple-50 text-purple-700 border-purple-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  hired: 'bg-violet-50 text-violet-700 border-violet-200',
  selected: 'bg-violet-50 text-violet-700 border-violet-200',
  accepted: 'bg-violet-50 text-violet-700 border-violet-200',
}

function CandidateDashboard() {
  const { user } = useContext(AuthContext)
  const [resumes, setResumes] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  const greeting = useMemo(() => {
    if (!user?.name) return 'Welcome Back'
    const hour = new Date().getHours()
    const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    return `${prefix}, ${user.name.split(' ')[0]}`
  }, [user])

  useEffect(() => {
    async function fetchData() {
      try {
        const [resumesData, appsData] = await Promise.allSettled([
          candidateService.getResumeHistory(),
          candidateService.getApplications(),
        ])

        if (resumesData.status === 'fulfilled' && resumesData.value) {
          setResumes(normalizeArray(resumesData.value))
        }

        if (appsData.status === 'fulfilled' && appsData.value) {
          const apps = normalizeArray(appsData.value)
          setApplications(apps.map((app) => ({
            ...app,
            status: typeof app.status === 'string' ? app.status.toLowerCase() : 'applied',
          })))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <main className="space-y-8 animate-fade-in pb-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8 md:p-10">
        <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
            <Sparkles className="h-4 w-4" />
            Candidate Portal
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {greeting}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300 sm:text-base">
            <Clock className="h-4 w-4 text-blue-400" />
            {currentDate}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={ROUTES.CANDIDATE.RESUME_ANALYSIS}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:bg-blue-500"
            >
              <FileText className="h-4.5 w-4.5" />
              Resume Analysis
            </Link>
            <Link
              to={ROUTES.CANDIDATE.JOBS}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:bg-slate-800"
            >
              <Briefcase className="h-4.5 w-4.5" />
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to={ROUTES.CANDIDATE.PORTFOLIO_RESUME} className="group">
          <Stat label="Resumes Uploaded" value={resumes.length} icon={FileText} tone="blue" />
        </Link>
        <Link to={ROUTES.CANDIDATE.APPLICATIONS} className="group">
          <Stat label="Applications" value={applications.length} icon={Briefcase} tone="emerald" />
        </Link>
        <Link to={ROUTES.CANDIDATE.APPLICATIONS} className="group">
          <Stat
            label="Shortlisted"
            value={applications.filter((application) => ['shortlisted', 'accepted', 'hired'].includes(application.status)).length}
            icon={CheckCircle}
            tone="violet"
          />
        </Link>
        <Link to={ROUTES.CANDIDATE.ANALYTICS} className="group">
          <Stat
            label="Avg ATS Score"
            value={resumes.length > 0 ? `${Math.round(resumes.reduce((sum, item) => sum + (item.atsScore || 0), 0) / resumes.length)}%` : '--'}
            icon={TrendingUp}
            tone="amber"
          />
        </Link>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">My Applications</h3>
            <p className="text-xs text-slate-400">Track your job application status</p>
          </div>
          <Link to={ROUTES.CANDIDATE.APPLICATIONS} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="py-10 text-center">
            <Briefcase className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-500">No applications yet</p>
            <Link to={ROUTES.CANDIDATE.JOBS} className="mt-1 inline-block text-sm font-semibold text-blue-600 hover:underline">
              Browse available jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 5).map((application) => {
              const StatusIcon = STATUS_ICONS[application.status] || Clock3
              const statusColor = STATUS_COLORS[application.status] || 'bg-slate-50 text-slate-700 border-slate-200'

              return (
                <Link key={application._id} to={ROUTES.CANDIDATE.APPLICATIONS} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{application.jobTitle || 'Position'}</p>
                      <p className="text-xs text-slate-400">{application.company || 'Company'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusColor}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Resumes</h3>
            <p className="text-xs text-slate-400">Your uploaded resume history</p>
          </div>
          <Link to={ROUTES.CANDIDATE.PORTFOLIO_RESUME} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            View portfolio <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {resumes.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-500">No resumes uploaded yet</p>
            <Link to={ROUTES.CANDIDATE.RESUME_ANALYSIS} className="mt-1 inline-block text-sm font-semibold text-blue-600 hover:underline">
              Upload your first resume
            </Link>
          </div>
        ) : (
          resumes.slice(0, 3).map((resume) => (
            <Link key={resume._id} to={ROUTES.CANDIDATE.PORTFOLIO_RESUME} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 transition-colors hover:bg-slate-50 -mx-2 px-2 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="max-w-[200px] truncate text-sm font-semibold text-slate-800">{resume.filename || resume.fileName || 'Resume'}</p>
                  <p className="text-xs text-slate-400">{resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                resume.atsScore >= 85 ? 'bg-emerald-50 text-emerald-700' :
                resume.atsScore >= 70 ? 'bg-blue-50 text-blue-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {resume.atsScore || 0} ATS
              </span>
            </Link>
          ))
        )}
      </section>
    </main>
  )
}

function Stat({ label, value, icon: Icon, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all group-hover:shadow-md group-hover:border-blue-200">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default CandidateDashboard
