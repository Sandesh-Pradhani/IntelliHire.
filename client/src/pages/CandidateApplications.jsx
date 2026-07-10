import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import {
  Briefcase,
  Clock3,
  FileText,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  BarChart3,
  UserCheck,
  ClipboardList,
  Phone,
  MessageSquare,
  Star,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const PIPELINE_STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'Applied', label: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ClipboardList },
  { key: 'Screening', label: 'Screening', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileText },
  { key: 'Shortlisted', label: 'Shortlisted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Star },
  { key: 'Assessment', label: 'Assessment', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: BarChart3 },
  { key: 'Interview', label: 'Interview', color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Calendar },
  { key: 'Technical Round', label: 'Technical', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: ClipboardList },
  { key: 'HR Round', label: 'HR Round', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: MessageSquare },
  { key: 'Offered', label: 'Offered', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: Award },
  { key: 'Accepted', label: 'Accepted', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  { key: 'Hired', label: 'Hired', color: 'bg-green-100 text-green-800 border-green-300', icon: ShieldCheck },
  { key: 'Rejected', label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
]

function StatusBadge({ status }) {
  const s = PIPELINE_STATUSES.find(p => p.key === status)
  const Icon = s?.icon || Clock3
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${s?.color || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      <Icon className="h-3.5 w-3.5" />
      {status || 'Pending'}
    </span>
  )
}

function TimelineItem({ entry, isLast }) {
  const s = PIPELINE_STATUSES.find(p => p.key === entry.status)
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 ${isLast ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'} shrink-0`} />
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-semibold text-slate-800">{entry.status}</p>
        <p className="text-xs text-slate-400">
          {new Date(entry.changedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        {entry.note && <p className="text-xs text-slate-500 mt-1">{entry.note}</p>}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 inline-block">
          by {entry.changedBy}
        </span>
      </div>
    </div>
  )
}

function CandidateApplications() {
  const { user } = useContext(AuthContext)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedTimeline, setExpandedTimeline] = useState(null)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/applications/candidate`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setApplications(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter)

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status || 'Applied'] = (acc[a.status || 'Applied'] || 0) + 1
    return acc
  }, {})

  return (
    <main className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">My Applications</h1>
        <p className="text-slate-500 mt-2">Track your job application status through the hiring pipeline</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PIPELINE_STATUSES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label} ({key === 'all' ? applications.length : (statusCounts[key] || 0)})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold text-lg">No applications found</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter === 'all' ? 'Start applying to jobs to see them here' : `No applications in ${filter} stage`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isExpanded = expandedTimeline === app._id
            return (
              <div
                key={app._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{app.jobTitle || 'Position'}</h3>
                        <p className="text-sm text-slate-400">{app.jobId?.company || app.company || ''}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Applied {new Date(app.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={app.status} />
                      {app.matchScore > 0 && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full">
                          {app.matchScore}% Match
                        </span>
                      )}
                    </div>
                  </div>

                  {app.matchedSkills?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex flex-wrap gap-1.5">
                        {app.matchedSkills.slice(0, 6).map((skill, i) => (
                          <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                        {app.matchedSkills.length > 6 && (
                          <span className="text-xs font-medium text-slate-400 px-2 py-1">
                            +{app.matchedSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {app.timeline && app.timeline.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setExpandedTimeline(isExpanded ? null : app._id)}
                        className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        View Timeline ({app.timeline.length} updates)
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && app.timeline && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Application Timeline</h4>
                    <div className="space-y-0">
                      {[...app.timeline].reverse().map((entry, idx) => (
                        <TimelineItem
                          key={idx}
                          entry={entry}
                          isLast={idx === 0}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default CandidateApplications
