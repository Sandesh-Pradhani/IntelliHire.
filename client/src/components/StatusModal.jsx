import { useState } from 'react'
import { User, Briefcase, Target, AlertTriangle, CheckCircle2, Clock, XCircle, UserCheck, X } from 'lucide-react'

const STATUS_CONFIG = {
  Applied: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock, label: 'Applied' },
  Shortlisted: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: UserCheck, label: 'Shortlisted' },
  Interview: { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Target, label: 'Interview' },
  Rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
  Hired: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Hired' },
}

/**
 * StatusModal — Modal for changing application status.
 * 
 * Fixes the "clipped dropdown" issue by rendering outside overflow-hidden parents
 * as a fixed-position modal overlay. Contains:
 * - Candidate info (name, resume, ATS, match %)
 * - Current status display
 * - Status selection
 * - Save/Cancel actions
 */
export default function StatusModal({ application, onSave, onClose, isUpdating }) {
  const [selectedStatus, setSelectedStatus] = useState(application.status || 'Applied')

  const candidateName = application.candidateName || application.candidate?.name || 'Unknown'
  const jobTitle = application.jobTitle || application.job?.title || 'Unknown'
  const atsScore = application.atsScore || 0
  const matchScore = application.matchScore || 0

  const currentConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.Applied
  const CurrentIcon = currentConfig.icon

  const handleSave = () => {
    onSave(application._id, selectedStatus)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-800">Update Status</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-5">
            {/* Candidate Info */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{candidateName}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Briefcase className="h-3 w-3" />
                    <span>{jobTitle}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                <p className="text-xs font-semibold text-blue-600">ATS Score</p>
                <p className="text-2xl font-extrabold text-blue-700">{atsScore}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                <p className="text-xs font-semibold text-emerald-600">Match %</p>
                <p className="text-2xl font-extrabold text-emerald-700">{matchScore}%</p>
              </div>
            </div>

            {/* Current Status */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Current Status</p>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <CurrentIcon className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-800">{application.status}</span>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Select New Status
              </p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                  const Icon = config.icon
                  const isActive = selectedStatus === key
                  const isCurrent = application.status === key

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedStatus(key)}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                        isActive
                          ? 'border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="flex-1">{config.label}</span>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-slate-400">(current)</span>
                      ) : null}
                      {isActive ? (
                        <div className="h-4 w-4 rounded-full border-2 border-blue-600 bg-blue-600 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating || selectedStatus === application.status}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}