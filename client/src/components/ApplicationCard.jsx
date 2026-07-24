import { User, Briefcase, Target, AlertTriangle, CheckCircle2, Clock, XCircle, UserCheck, ChevronDown } from 'lucide-react'

const STATUS_CONFIG = {
    Applied: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
    Shortlisted: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: UserCheck },
    Interview: { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Target },
    Rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    Hired: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
}

/**
 * ApplicationCard — Card displaying candidate application summary.
 * 
 * The "Change Status" button triggers the parent's onStatusClick callback
 * which opens a StatusModal (modal), avoiding clipping issues from overflow-hidden parents.
 */
function ApplicationCard({
    application,
    onStatusChange,
    onStatusClick,
    isUpdating,
    onClick
}) {
    const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.Applied
    const StatusIcon = statusConfig.icon

    const candidateName = application.candidateName || application.candidate?.name || 'Unknown'
    const jobTitle = application.jobTitle || application.job?.title || 'Unknown'
    const atsScore = application.atsScore || 0
    const matchScore = application.matchScore || 0

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
        if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
            onClick={() => onClick && onClick(application)}
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    {/* Candidate & Job Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1">
                            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 truncate">
                                {candidateName}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 ml-[34px]">
                            <Briefcase className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{jobTitle}</span>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {application.status}
                        </span>
                    </div>
                </div>

                {/* Scores Row */}
                <div className="flex items-center gap-4 mt-4 ml-[34px]">
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getScoreColor(atsScore)}`}>
                        ATS: {atsScore}
                    </div>
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getScoreColor(matchScore)}`}>
                        Match: {matchScore}%
                    </div>
                    <div className="text-xs text-slate-400 ml-auto">
                        {new Date(application.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </div>
                </div>

                {/* Skills Preview */}
                {application.matchedSkills && application.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 ml-[34px]">
                        {application.matchedSkills.slice(0, 4).map((skill, i) => (
                            <span
                                key={i}
                                className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg"
                            >
                                {skill}
                            </span>
                        ))}
                        {application.matchedSkills.length > 4 && (
                            <span className="text-[11px] font-medium text-slate-400">
                                +{application.matchedSkills.length - 4} more
                            </span>
                        )}
                    </div>
                )}

                {/* Change Status Button — Opens modal via parent callback, no inline dropdown */}
                <div className="mt-4 ml-[34px]">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (onStatusClick) {
                                onStatusClick(application)
                            }
                        }}
                        disabled={isUpdating}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isUpdating ? 'Updating...' : 'Change Status'}
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ApplicationCard