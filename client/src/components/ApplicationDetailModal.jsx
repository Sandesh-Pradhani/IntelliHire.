import { useEffect, useRef } from 'react'
import { X, User, Briefcase, Target, AlertTriangle, CheckCircle2, Calendar, FileText, TrendingUp, ShieldCheck } from 'lucide-react'

const STATUS_COLORS = {
    Applied: 'bg-blue-100 text-blue-700 border-blue-200',
    Screening: 'bg-amber-100 text-amber-700 border-amber-200',
    Shortlisted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Assessment: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Interview: 'bg-violet-100 text-violet-700 border-violet-200',
    'Technical Round': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'HR Round': 'bg-pink-100 text-pink-700 border-pink-200',
    Offered: 'bg-teal-100 text-teal-700 border-teal-200',
    Accepted: 'bg-green-100 text-green-700 border-green-200',
    Rejected: 'bg-red-100 text-red-700 border-red-200',
    Hired: 'bg-green-200 text-green-800 border-green-300',
}

function ApplicationDetailModal({ application, onClose }) {
    const overlayRef = useRef(null)

    useEffect(() => {
        const handleEscape = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [onClose])

    if (!application) return null

    const candidateName = application.candidateName || application.candidate?.name || 'Unknown'
    const candidateEmail = application.candidateEmail || application.candidate?.email || 'N/A'
    const jobTitle = application.jobTitle || application.job?.title || 'Unknown'
    const atsScore = application.atsScore || 0
    const matchScore = application.matchScore || 0
    const matchedSkills = application.matchedSkills || []
    const missingSkills = application.missingSkills || []
    const timeline = application.timeline || []
    const createdAt = application.createdAt ? new Date(application.createdAt) : new Date()

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600'
        if (score >= 60) return 'text-blue-600'
        if (score >= 40) return 'text-amber-600'
        return 'text-red-600'
    }

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-emerald-50 border-emerald-200'
        if (score >= 60) return 'bg-blue-50 border-blue-200'
        if (score >= 40) return 'bg-amber-50 border-amber-200'
        return 'bg-red-50 border-red-200'
    }

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Application Details</h2>
                        <p className="text-sm text-slate-400 mt-0.5">Candidate application overview</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{candidateName}</h3>
                                <p className="text-sm text-slate-500">{candidateEmail}</p>
                            </div>
                            <div className="ml-auto">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[application.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {application.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Applied Position</p>
                                <p className="text-sm text-slate-500">{jobTitle}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`rounded-2xl border-2 p-5 text-center ${getScoreBg(atsScore)}`}>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <FileText className={`h-4 w-4 ${getScoreColor(atsScore)}`} />
                                <span className="text-sm font-semibold text-slate-600">ATS Score</span>
                            </div>
                            <div className={`text-4xl font-extrabold ${getScoreColor(atsScore)}`}>{atsScore}</div>
                            <div className="mt-1 text-xs text-slate-400">Resume quality score</div>
                        </div>
                        <div className={`rounded-2xl border-2 p-5 text-center ${getScoreBg(matchScore)}`}>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <TrendingUp className={`h-4 w-4 ${getScoreColor(matchScore)}`} />
                                <span className="text-sm font-semibold text-slate-600">Match Score</span>
                            </div>
                            <div className={`text-4xl font-extrabold ${getScoreColor(matchScore)}`}>{matchScore}%</div>
                            <div className="mt-1 text-xs text-slate-400">Job compatibility</div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <h4 className="text-sm font-bold text-slate-700">Matched Skills ({matchedSkills.length})</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {matchedSkills.length > 0 ? matchedSkills.map((skill, i) => (
                                <span key={i} className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                                    {skill}
                                </span>
                            )) : (
                                <p className="text-sm text-slate-400 italic">No skills matched</p>
                            )}
                        </div>
                    </div>

                    {missingSkills.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <h4 className="text-sm font-bold text-slate-700">Missing Skills ({missingSkills.length})</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {missingSkills.map((skill, i) => (
                                    <span key={i} className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {timeline.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <h4 className="text-sm font-bold text-slate-700">Timeline ({timeline.length} updates)</h4>
                            </div>
                            <div className="space-y-3">
                                {[...timeline].reverse().map((entry, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-slate-300'} shrink-0`} />
                                            {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                                        </div>
                                        <div className="pb-3">
                                            <p className="text-sm font-semibold text-slate-800">{entry.status}</p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(entry.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                {' '}&middot; by {entry.changedBy}
                                            </p>
                                            {entry.note && <p className="text-xs text-slate-500 mt-0.5">{entry.note}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-500">
                            Applied on {createdAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ApplicationDetailModal
