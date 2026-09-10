import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Briefcase, FileText, TrendingUp, Users, ArrowRight } from 'lucide-react'
import { AuthContext } from '../context/authContext'
import recruiterService from '../services/recruiter.service'
import { normalizeArray } from '../utils/apiNormalizer'
import ROUTES from '../constants/routes'

function RecruiterAnalytics() {
  const { user } = useContext(AuthContext)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [jobsData, appsData] = await Promise.allSettled([
          recruiterService.getMyJobs(),
          recruiterService.getApplications(),
        ])
        if (jobsData.status === 'fulfilled') setJobs(normalizeArray(Array.isArray(jobsData.value) ? jobsData.value : []))
        if (appsData.status === 'fulfilled') setApplications(normalizeArray(Array.isArray(appsData.value) ? appsData.value : []))
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

  const avgMatch = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + (a.matchScore || 0), 0) / applications.length)
    : 0

  const skillFrequency = applications.reduce((acc, app) => {
    const skills = app.matchedSkills || []
    skills.forEach((s) => { acc[s] = (acc[s] || 0) + 1 })
    return acc
  }, {})

  const topSkills = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-400">Recruitment analytics and hiring funnel overview.</p>
        </div>
      </div>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active Jobs" value={jobs.length} icon={Briefcase} tone="blue" />
        <Stat label="Total Applications" value={applications.length} icon={FileText} tone="indigo" />
        <Stat
          label="Shortlisted"
          value={applications.filter((a) => ['shortlisted', 'hired'].includes((a.status || '').toLowerCase())).length}
          icon={Users}
          tone="emerald"
        />
        <Stat label="Avg Match Score" value={avgMatch ? `${avgMatch}%` : '--'} icon={TrendingUp} tone="violet" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Hiring Funnel</h3>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No application data yet.</p>
          ) : (
            <div className="space-y-3">
              {['applied', 'screening', 'shortlisted', 'interview', 'technical', 'hr', 'offer', 'hired', 'rejected'].map((stage) => {
                const count = statusCounts[stage] || 0
                const maxCount = Math.max(...Object.values(statusCounts), 1)
                return (
                  <div key={stage}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize text-slate-700">{stage}</span>
                      <span className="text-sm font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-slate-800">Top Skills in Pool</h3>
          {topSkills.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No skill data yet.</p>
          ) : (
            <div className="space-y-2">
              {topSkills.map(([skill, count]) => (
                <div key={skill} className="flex items-center gap-3">
                  <span className="w-28 truncate text-xs font-medium text-slate-600">{skill}</span>
                  <div className="flex-1">
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${(count / topSkills[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Recent Applications</h3>
          <Link to={ROUTES.RECRUITER.APPLICATIONS} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
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
                  <p className="text-sm font-semibold text-slate-800">{app.candidateName || 'Candidate'}</p>
                  <p className="text-xs text-slate-400">{app.jobTitle || 'Position'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 capitalize">{app.status || 'Applied'}</span>
                  {app.matchScore ? <span className="text-xs font-bold text-blue-600">{app.matchScore}%</span> : null}
                </div>
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
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
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

export default RecruiterAnalytics
