import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  Brain,
  Briefcase,
  Clock,
  FileText,
  Plus,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react'
import ROUTES from '../constants/routes'
import { AuthContext } from '../context/authContext'
import http from '../services/http.service'
import recruiterService from '../services/recruiter.service'
import { normalizeArray } from '../utils/apiNormalizer'

function RecruiterDashboard() {
  const { user } = useContext(AuthContext)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
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
        const [jobsData, appsData, feedbackData] = await Promise.allSettled([
          recruiterService.getMyJobs(),
          recruiterService.getApplications(),
          (async () => {
            try {
              const res = await http.get('/api/feedback')
              return res.data
            } catch { return [] }
          })(),
        ])

        if (jobsData.status === 'fulfilled' && jobsData.value) {
          setJobs(normalizeArray(Array.isArray(jobsData.value) ? jobsData.value : []))
        }

        if (appsData.status === 'fulfilled' && appsData.value) {
          setApplications(normalizeArray(Array.isArray(appsData.value) ? appsData.value : []))
        }

        if (feedbackData.status === 'fulfilled') {
          setFeedbacks(normalizeArray(feedbackData.value))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const averageMatchScore = applications.length > 0
    ? Math.round(applications.reduce((sum, application) => sum + (application.matchScore || 0), 0) / applications.length)
    : 0

  return (
    <main className="space-y-8 animate-fade-in pb-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8 md:p-10">
        <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
            <Sparkles className="h-4 w-4" />
            Recruiter Dashboard
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {greeting}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-300 sm:text-base">
            <Clock className="h-4 w-4 text-blue-400" />
            {currentDate}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={ROUTES.RECRUITER.JOB_CREATE} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-500">
              <Plus className="h-4.5 w-4.5" />
              Create Job
            </Link>
            <Link to={ROUTES.RECRUITER.RANKINGS} className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:bg-slate-800">
              <Award className="h-4.5 w-4.5" />
              View Rankings
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to={ROUTES.RECRUITER.JOB_MANAGE} className="group">
          <Stat label="Active Jobs" value={jobs.length} icon={Briefcase} tone="blue" />
        </Link>
        <Link to={ROUTES.RECRUITER.APPLICATIONS} className="group">
          <Stat label="Applications" value={applications.length} icon={FileText} tone="indigo" />
        </Link>
        <Link to={ROUTES.RECRUITER.APPLICATIONS} className="group">
          <Stat
            label="Shortlisted"
            value={applications.filter((application) => ['Shortlisted', 'Hired', 'accepted'].includes(application.status)).length}
            icon={Award}
            tone="emerald"
          />
        </Link>
        <Link to={ROUTES.RECRUITER.ANALYTICS} className="group">
          <Stat label="Avg Match Score" value={applications.length > 0 ? `${averageMatchScore}%` : '--'} icon={TrendingUp} tone="violet" />
        </Link>
      </section>

      <section className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Application Pipeline</h3>
              <p className="text-xs text-slate-400">Recent candidate applications</p>
            </div>
            <Link to={ROUTES.RECRUITER.APPLICATIONS} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No applications received yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 4).map((application) => (
                <Link key={application._id} to={ROUTES.RECRUITER.APPLICATIONS} className="flex items-center justify-between py-3 transition-colors hover:bg-slate-50 -mx-2 px-2 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{application.candidateName || 'Candidate'}</p>
                      <p className="text-xs text-slate-400">{application.jobTitle || 'Position'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {application.status || 'Applied'}
                    </span>
                    {application.matchScore ? (
                      <span className="text-xs font-bold text-blue-600">{application.matchScore}%</span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8 lg:col-span-5">
          <div className="space-y-4.5 rounded-3xl bg-gradient-to-br from-indigo-900 to-blue-950 p-6 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-blue-500/20 p-2 text-blue-300">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">AI Insights</h3>
                <span className="text-[10px] font-semibold uppercase text-blue-300">Powered by IntelliHire Engine</span>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <Link to={ROUTES.RECRUITER.JOB_MANAGE} className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:bg-white/10">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-300">1</div>
                <p>
                  Total active jobs: <strong>{jobs.length}</strong>. Candidate pipeline size: <strong>{applications.length}</strong>.
                </p>
              </Link>
              <Link to={ROUTES.RECRUITER.ANALYTICS} className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:bg-white/10">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">2</div>
                <p>
                  Average match score is <strong>{averageMatchScore}%</strong>. Use rankings and job match to prioritize interviews.
                </p>
              </Link>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">User Feedback</h3>
              <Link to={ROUTES.RECRUITER.FEEDBACK} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                All feedback <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {feedbacks.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No feedback yet.</p>
            ) : (
              feedbacks.slice(0, 2).map((feedback) => (
                <div key={feedback._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                  <div className="mb-1 flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{feedback.rating || 5}/5</span>
                  </div>
                  <p className="text-xs italic text-slate-500">&ldquo;{feedback.message || 'No description'}&rdquo;</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value, icon: Icon, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
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

export default RecruiterDashboard
