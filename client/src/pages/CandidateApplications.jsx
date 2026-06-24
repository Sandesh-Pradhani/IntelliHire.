import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import Layout from '../components/Layout'
import axios from 'axios'
import {
  Briefcase,
  Clock3,
  FileText,
  CheckCircle,
  XCircle,
  Award,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

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

function CandidateApplications() {
  const { user } = useContext(AuthContext)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

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
    acc[a.status || 'pending'] = (acc[a.status || 'pending'] || 0) + 1
    return acc
  }, {})

  return (
    <Layout>
      <main className="space-y-8 animate-fade-in pb-12">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">My Applications</h1>
          <p className="text-slate-500 mt-2">Track the status of your job applications</p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: `All (${applications.length})` },
            { key: 'pending', label: `Pending (${statusCounts.pending || 0})` },
            { key: 'reviewing', label: `Reviewing (${statusCounts.reviewing || 0})` },
            { key: 'shortlisted', label: `Shortlisted (${statusCounts.shortlisted || 0})` },
            { key: 'rejected', label: `Rejected (${statusCounts.rejected || 0})` },
            { key: 'accepted', label: `Accepted (${statusCounts.accepted || 0})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Applications List */}
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
              {filter === 'all' ? 'Start applying to jobs to see them here' : `No ${filter} applications`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => {
              const StatusIcon = STATUS_ICONS[app.status] || Clock3
              const statusColor = STATUS_COLORS[app.status] || 'bg-slate-50 text-slate-700 border-slate-200'
              return (
                <div
                  key={app._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{app.jobTitle || 'Position'}</h3>
                        <p className="text-sm text-slate-400">{app.company || 'Company'}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Applied {new Date(app.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border ${statusColor}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : 'Pending'}
                      </div>
                      {app.matchScore && (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-full">
                          {app.matchScore}% Match
                        </span>
                      )}
                    </div>
                  </div>
                  {app.recruiterNotes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Recruiter Note:</p>
                      <p className="text-sm text-slate-700 mt-0.5">{app.recruiterNotes}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </Layout>
  )
}

export default CandidateApplications