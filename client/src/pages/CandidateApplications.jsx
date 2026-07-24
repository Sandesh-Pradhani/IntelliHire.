import { useEffect, useState } from 'react'
import axios from 'axios'
import { Award, Briefcase, CheckCircle, Clock3, FileText, XCircle } from 'lucide-react'
import { normalizeArray } from '../utils/apiNormalizer'

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

function normalizeStatus(status) {
  return typeof status === 'string' ? status.toLowerCase() : 'pending'
}

function CandidateApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function fetchApplications() {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/applications/candidate`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const normalized = normalizeArray(data).map((application) => ({
          ...application,
          status: normalizeStatus(application.status),
        }))

        setApplications(normalized)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter((application) => application.status === filter)

  const statusCounts = applications.reduce((counts, application) => {
    const status = normalizeStatus(application.status)
    return {
      ...counts,
      [status]: (counts[status] || 0) + 1,
    }
  }, {})

  return (
    <main className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">My Applications</h1>
        <p className="mt-2 text-slate-500">Track the status of your job applications</p>
      </div>

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
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              filter === key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white py-20 text-center">
          <Briefcase className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <p className="text-lg font-semibold text-slate-500">No applications found</p>
          <p className="mt-1 text-sm text-slate-400">
            {filter === 'all' ? 'Start applying to jobs to see them here.' : `No ${filter} applications.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const status = normalizeStatus(application.status)
            const StatusIcon = STATUS_ICONS[status] || Clock3
            const statusColor = STATUS_COLORS[status] || 'bg-slate-50 text-slate-700 border-slate-200'

            return (
              <div
                key={application._id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{application.jobTitle || 'Position'}</h3>
                      <p className="text-sm text-slate-400">{application.company || 'Company'}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Applied {application.createdAt ? new Date(application.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold ${statusColor}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    {application.matchScore ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-600">
                        {application.matchScore}% Match
                      </span>
                    ) : null}
                  </div>
                </div>

                {application.recruiterNotes ? (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-500">Recruiter Note:</p>
                    <p className="mt-0.5 text-sm text-slate-700">{application.recruiterNotes}</p>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

export default CandidateApplications
