import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, FileText, FolderKanban, Award, Search, X } from 'lucide-react'
import jobsService from '../services/jobs.service'
import candidateService from '../services/candidate.service'
import { normalizeArray } from '../utils/apiNormalizer'

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [jobsData, appsData] = await Promise.allSettled([
        jobsService.getAll({ limit: 50 }),
        candidateService.getApplications(),
      ])
      if (jobsData.status === 'fulfilled') {
        const data = jobsData.value
        setJobs(normalizeArray(data?.jobs || data))
      }
      if (appsData.status === 'fulfilled') {
        setApplications(normalizeArray(appsData.value))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const q = debouncedQuery.toLowerCase()

  const filteredJobs = q ? jobs.filter((j) =>
    j.title?.toLowerCase().includes(q) ||
    j.description?.toLowerCase().includes(q) ||
    j.location?.toLowerCase().includes(q) ||
    (j.requiredSkills || []).some((s) => s.toLowerCase().includes(q))
  ) : jobs

  const filteredApplications = q ? applications.filter((a) =>
    a.jobTitle?.toLowerCase().includes(q) ||
    a.company?.toLowerCase().includes(q) ||
    a.candidateName?.toLowerCase().includes(q) ||
    a.status?.toLowerCase().includes(q)
  ) : applications

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'applications', label: 'Applications' },
  ]

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Global Search</h1>
          <p className="mt-0.5 text-sm text-slate-400">Search across jobs, applications, and more.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search jobs, applications, skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {(activeTab === 'all' || activeTab === 'jobs') && filteredJobs.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Jobs ({filteredJobs.length})</h3>
              <div className="space-y-3">
                {filteredJobs.slice(0, 10).map((job) => (
                  <div key={job._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Briefcase className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{job.title}</p>
                        <p className="text-xs text-slate-400">{job.location || 'Remote'} &middot; {job.jobType || 'Full-time'}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{job.status || 'active'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'applications') && filteredApplications.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Applications ({filteredApplications.length})</h3>
              <div className="space-y-3">
                {filteredApplications.slice(0, 10).map((app) => (
                  <div key={app._id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-violet-50 p-2 text-violet-600"><FileText className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{app.jobTitle || 'Position'}</p>
                        <p className="text-xs text-slate-400">{app.company || 'Company'}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 capitalize">{app.status || 'Applied'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!loading && filteredJobs.length === 0 && filteredApplications.length === 0 && query && (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="font-medium text-slate-500">No results found for "{query}"</p>
              <p className="mt-1 text-sm text-slate-400">Try a different search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
