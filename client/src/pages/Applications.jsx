import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  FileX,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  XCircle,
} from 'lucide-react'
import ApplicationCard from '../components/ApplicationCard'
import ApplicationDetailModal from '../components/ApplicationDetailModal'
import StatusModal from '../components/StatusModal'
import applicationsService from '../services/applications.service'
import { normalizeArray } from '../utils/apiNormalizer'

const STATUS_CARDS = [
  { key: 'Applied', label: 'Applied', icon: Clock, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { key: 'Shortlisted', label: 'Shortlisted', icon: UserCheck, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  { key: 'Interview', label: 'Interview', icon: Target, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  { key: 'Rejected', label: 'Rejected', icon: XCircle, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  { key: 'Hired', label: 'Hired', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
]

function Applications() {
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [statusApplication, setStatusApplication] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError('')

    try {
      const [appsRes, statsRes] = await Promise.all([
        applicationsService.getRecruiterApplications(),
        applicationsService.getRecruiterStats(),
      ])

      setApplications(normalizeArray(appsRes))
      setStats(statsRes || null)
    } catch (err) {
      console.error('Applications fetch error:', err)
      setError(err?.message || 'Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    setUpdatingId(id)

    try {
      await applicationsService.updateStatus(id, status)
      await fetchData()
    } catch (err) {
      console.error('Status update error:', err)
      setError(err?.message || 'Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredApplications = filterStatus === 'All'
    ? applications
    : applications.filter((application) => application.status === filterStatus)

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-800">
            <Briefcase className="h-8 w-8 text-blue-600" />
            ATS Dashboard
          </h1>
          <p className="mt-2 text-slate-500">Track, manage, and evaluate all candidate applications in one place.</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100"
        >
          <ArrowUpRight className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse">
                <div className="mb-2 h-8 w-16 rounded bg-slate-200" />
                <div className="h-4 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-white p-6 animate-pulse">
                <div className="flex justify-between">
                  <div className="space-y-3">
                    <div className="h-5 w-40 rounded bg-slate-200" />
                    <div className="h-4 w-28 rounded bg-slate-100" />
                  </div>
                  <div className="h-8 w-20 rounded bg-slate-200" />
                </div>
                <div className="mt-4 flex gap-3">
                  <div className="h-6 w-16 rounded bg-slate-100" />
                  <div className="h-6 w-20 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : applications.length === 0 && !error ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
            <FileX className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-600">No applications yet</h3>
          <p className="mx-auto mt-3 max-w-lg leading-relaxed text-slate-400">
            Applications will appear here once candidates apply or AI job matching creates pipeline records.
          </p>
        </div>
      ) : (
        <>
          {stats ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Total" value={stats.totalApplications} icon={Briefcase} bg="bg-blue-100" text="text-blue-600" />
              {STATUS_CARDS.map(({ key, label, icon, bg, text }) => (
                <StatCard
                  key={key}
                  label={label}
                  value={stats.statusCounts?.[key] || 0}
                  icon={icon}
                  bg={bg}
                  text={text}
                />
              ))}
            </div>
          ) : null}

          {stats?.averageMatchScore > 0 ? (
            <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Average Match Score</p>
                <p className="text-2xl font-extrabold text-blue-700">{stats.averageMatchScore}%</p>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Across all applications
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {['All', ...STATUS_CARDS.map((card) => card.key)].map((status) => {
              const card = STATUS_CARDS.find((item) => item.key === status)
              const activeClasses = card
                ? `${card.bg} ${card.text} ${card.border}`
                : 'border-slate-800 bg-slate-800 text-white'

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                    filterStatus === status
                      ? activeClasses
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {status === 'All' ? 'All Applications' : status}
                  {status !== 'All' && stats ? <span className="ml-1.5 opacity-70">({stats.statusCounts?.[status] || 0})</span> : null}
                </button>
              )
            })}
          </div>

          <div className="grid gap-4">
            {filteredApplications.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
                <FileX className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                <p className="font-medium text-slate-500">No applications with status &ldquo;{filterStatus}&rdquo;</p>
              </div>
            ) : (
              filteredApplications.map((application) => (
                <ApplicationCard
                  key={application._id}
                  application={application}
                  onStatusChange={updateStatus}
                  onStatusClick={setStatusApplication}
                  isUpdating={updatingId === application._id}
                  onClick={setSelectedApplication}
                />
              ))
            )}
          </div>
        </>
      )}

      {selectedApplication ? (
        <ApplicationDetailModal application={selectedApplication} onClose={() => setSelectedApplication(null)} />
      ) : null}

      {statusApplication ? (
        <StatusModal
          application={statusApplication}
          onSave={updateStatus}
          onClose={() => setStatusApplication(null)}
          isUpdating={updatingId === statusApplication._id}
        />
      ) : null}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, bg, text }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <div className={`rounded-xl p-2 ${bg} ${text}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      </div>
      <p className="text-3xl font-extrabold text-slate-800">{value}</p>
      <p className="mt-1 text-xs text-slate-400">Candidates</p>
    </div>
  )
}

export default Applications
