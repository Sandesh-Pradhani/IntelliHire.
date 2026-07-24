import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Briefcase, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { AuthContext } from '../context/authContext'
import candidateService from '../services/candidate.service'
import { normalizeArray } from '../utils/apiNormalizer'
import ROUTES from '../constants/routes'

function CandidateAnalytics() {
  const { user } = useContext(AuthContext)
  const [applications, setApplications] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [appsData, resumesData] = await Promise.allSettled([
          candidateService.getApplications(),
          candidateService.getResumeHistory(),
        ])
        if (appsData.status === 'fulfilled') setApplications(normalizeArray(appsData.value))
        if (resumesData.status === 'fulfilled') setResumes(normalizeArray(resumesData.value))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statusCounts = applications.reduce((acc, app) => {
    const s = (app.status || 'applied').toLowerCase()
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const avgAts = resumes.length > 0
    ? Math.round(resumes.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumes.length)
    : 0

  const avgMatch = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + (a.matchScore || 0), 0) / applications.length)
    : 0

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-400">Track your job application progress and performance.</p>
        </div>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Applications" value={applications.length} icon={Briefcase} tone="blue" />
        <Stat label="Resumes Uploaded" value={resumes.length} icon={FileText} tone="emerald" />
        <Stat label="Avg ATS Score" value={avgAts ? `${avgAts}%` : '--'} icon={TrendingUp} tone="violet" />
        <Stat label="Avg Match Score" value={avgMatch ? `${avgMatch}%` : '--'} icon={BarChart3} tone="amber" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Application Status Distribution</h3>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No application data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize text-slate-700">{status}</span>
                    <span className="text-sm font-bold text-slate-800">{count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${(count / applications.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800">ATS Score Trend</h3>
          {resumes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No resume data yet.</p>
          ) : (
            <div className="space-y-2">
              {resumes.slice(0, 6).map((resume) => (
                <div key={resume._id} className="flex items-center gap-3">
                  <span className="w-24 truncate text-xs text-slate-500">{resume.fileName || 'Resume'}</span>
                  <div className="flex-1">
                    <div className="h-3 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          (resume.atsScore || 0) >= 80 ? 'bg-emerald-500' :
                          (resume.atsScore || 0) >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${resume.atsScore || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-slate-700">{resume.atsScore || 0}%</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Recent Applications</h3>
          <Link to={ROUTES.CANDIDATE.APPLICATIONS} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No applications yet.</p>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 5).map((app) => (
              <div key={app._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{app.jobTitle || 'Position'}</p>
                  <p className="text-xs text-slate-400">{app.company || 'Company'}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 capitalize">{app.status || 'Applied'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
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
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
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

export default CandidateAnalytics
