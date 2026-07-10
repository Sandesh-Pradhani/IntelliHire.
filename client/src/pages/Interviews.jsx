import { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    Plus,
    X,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Star,
    ChevronDown,
    ChevronUp,
    FileX,
    Users,
    Briefcase,
    MessageSquare,
    CalendarDays,
    Eye,
    Edit3,
    Trash2,
    Send,
    RefreshCw,
    ArrowUpRight,
    Loader2,
    StickyNote,
    Target,
    UserCheck,
    CalendarClock
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const ROUNDS = ['Phone Screening', 'Technical', 'HR', 'Manager', 'Final']

const STATUS_CONFIG = {
    Scheduled: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CalendarClock },
    Completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    Cancelled: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
    Rescheduled: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: RefreshCw }
}

const RECOMMENDATION_OPTIONS = [
    'Strong Hire',
    'Hire',
    'Borderline',
    'No Hire',
    'Strong No Hire'
]

const RECOMMENDATION_COLORS = {
    'Strong Hire': 'bg-emerald-100 text-emerald-700',
    'Hire': 'bg-blue-100 text-blue-700',
    'Borderline': 'bg-amber-100 text-amber-700',
    'No Hire': 'bg-orange-100 text-orange-700',
    'Strong No Hire': 'bg-red-100 text-red-700'
}

function Interviews() {
    const { user } = useContext(AuthContext)
    const isRecruiter = user?.role === 'recruiter'

    const [interviews, setInterviews] = useState([])
    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [selectedInterview, setSelectedInterview] = useState(null)
    const [filterStatus, setFilterStatus] = useState('All')
    const [submitting, setSubmitting] = useState(false)

    // Create form state
    const [formData, setFormData] = useState({
        application: '',
        round: 'Phone Screening',
        date: '',
        time: '',
        duration: 60,
        location: '',
        googleMeetLink: '',
        notes: ''
    })
    const [selectedAppData, setSelectedAppData] = useState(null)

    // Feedback form state
    const [feedbackForm, setFeedbackForm] = useState({
        rating: 0,
        strengths: '',
        weaknesses: '',
        comments: '',
        recommendation: ''
    })
    const [submittingFeedback, setSubmittingFeedback] = useState(false)

    // Edit form state
    const [editMode, setEditMode] = useState(false)
    const [editData, setEditData] = useState({})

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (isRecruiter) {
            fetchApplications()
        }
    }, [isRecruiter])

    useEffect(() => {
        if (selectedInterview) {
            setFeedbackForm({
                rating: selectedInterview.feedback?.rating || 0,
                strengths: selectedInterview.feedback?.strengths?.join(', ') || '',
                weaknesses: selectedInterview.feedback?.weaknesses?.join(', ') || '',
                comments: selectedInterview.feedback?.comments || '',
                recommendation: selectedInterview.feedback?.recommendation || ''
            })
            setEditData({
                round: selectedInterview.round || '',
                date: selectedInterview.date ? new Date(selectedInterview.date).toISOString().split('T')[0] : '',
                time: selectedInterview.time || '',
                duration: selectedInterview.duration || 60,
                location: selectedInterview.location || '',
                googleMeetLink: selectedInterview.googleMeetLink || '',
                notes: selectedInterview.notes || ''
            })
        }
    }, [selectedInterview])

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token')
        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const endpoint = isRecruiter
                ? `${API_URL}/api/interviews/recruiter`
                : `${API_URL}/api/interviews/candidate`
            const res = await axios.get(endpoint, { headers: getAuthHeaders() })
            setInterviews(Array.isArray(res.data) ? res.data : res.data?.interviews || [])
        } catch (err) {
            console.error('Interviews fetch error:', err)
            if (err.response?.status === 404) {
                setError('Interviews API not found. Ensure the server is running.')
            } else {
                setError(err.response?.data?.message || 'Failed to load interviews')
            }
        } finally {
            setLoading(false)
        }
    }

    const fetchApplications = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/applications/recruiter`, { headers: getAuthHeaders() })
            setApplications(Array.isArray(res.data) ? res.data : res.data?.applications || [])
        } catch (err) {
            console.error('Applications fetch error:', err)
        }
    }

    const handleApplicationSelect = (appId) => {
        const app = applications.find(a => a._id === appId)
        setSelectedAppData(app)
        setFormData(prev => ({ ...prev, application: appId }))
    }

    const handleCreateInterview = async (e) => {
        e.preventDefault()
        if (!formData.application || !formData.date || !formData.time) {
            setError('Please fill in all required fields')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            await axios.post(`${API_URL}/api/interviews/create`, formData, { headers: getAuthHeaders() })
            setShowCreateForm(false)
            setFormData({ application: '', round: 'Phone Screening', date: '', time: '', duration: 60, location: '', googleMeetLink: '', notes: '' })
            setSelectedAppData(null)
            fetchData()
        } catch (err) {
            console.error('Create interview error:', err)
            setError(err.response?.data?.message || 'Failed to create interview')
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`${API_URL}/api/interviews/${id}/status`, { status }, { headers: getAuthHeaders() })
            fetchData()
            if (selectedInterview?._id === id) {
                setSelectedInterview(prev => ({ ...prev, status }))
            }
        } catch (err) {
            console.error('Status update error:', err)
            setError('Failed to update interview status')
        }
    }

    const handleCandidateResponse = async (id, candidateResponse) => {
        try {
            await axios.patch(`${API_URL}/api/interviews/${id}/response`, { candidateResponse }, { headers: getAuthHeaders() })
            fetchData()
            if (selectedInterview?._id === id) {
                setSelectedInterview(prev => ({ ...prev, candidateResponse }))
            }
        } catch (err) {
            console.error('Response update error:', err)
            setError('Failed to update response')
        }
    }

    const handleUpdateInterview = async (id) => {
        setSubmitting(true)
        setError('')
        try {
            await axios.put(`${API_URL}/api/interviews/${id}`, editData, { headers: getAuthHeaders() })
            setEditMode(false)
            fetchData()
            const updated = await axios.get(`${API_URL}/api/interviews/${id}`, { headers: getAuthHeaders() })
            setSelectedInterview(updated.data)
        } catch (err) {
            console.error('Update interview error:', err)
            setError(err.response?.data?.message || 'Failed to update interview')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteInterview = async (id) => {
        if (!window.confirm('Are you sure you want to delete this interview?')) return
        try {
            await axios.delete(`${API_URL}/api/interviews/${id}`, { headers: getAuthHeaders() })
            setSelectedInterview(null)
            fetchData()
        } catch (err) {
            console.error('Delete interview error:', err)
            setError('Failed to delete interview')
        }
    }

    const handleSubmitFeedback = async (e) => {
        e.preventDefault()
        setSubmittingFeedback(true)
        setError('')
        try {
            const payload = {
                rating: feedbackForm.rating,
                strengths: feedbackForm.strengths.split(',').map(s => s.trim()).filter(Boolean),
                weaknesses: feedbackForm.weaknesses.split(',').map(s => s.trim()).filter(Boolean),
                comments: feedbackForm.comments,
                recommendation: feedbackForm.recommendation
            }
            await axios.put(`${API_URL}/api/interviews/${selectedInterview._id}`, { feedback: payload }, { headers: getAuthHeaders() })
            fetchData()
            const updated = await axios.get(`${API_URL}/api/interviews/${selectedInterview._id}`, { headers: getAuthHeaders() })
            setSelectedInterview(updated.data)
        } catch (err) {
            console.error('Submit feedback error:', err)
            setError(err.response?.data?.message || 'Failed to submit feedback')
        } finally {
            setSubmittingFeedback(false)
        }
    }

    const filteredInterviews = filterStatus === 'All'
        ? interviews
        : interviews.filter(iv => iv.status === filterStatus)

    const upcomingInterviews = interviews.filter(iv =>
        iv.status === 'Scheduled' && (iv.candidateResponse === 'Pending' || iv.candidateResponse === 'Accepted')
    )
    const pastInterviews = interviews.filter(iv => iv.status === 'Completed')

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatTime = (timeStr) => {
        if (!timeStr) return '—'
        const [h, m] = timeStr.split(':')
        const hour = parseInt(h)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const h12 = hour % 12 || 12
        return `${h12}:${m} ${ampm}`
    }

    // ─── Loading Skeleton ───
    if (loading) {
        return (
            <div className="pb-12 space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
                        <div className="h-4 bg-slate-100 rounded w-64 animate-pulse" />
                    </div>
                    <div className="h-10 bg-slate-200 rounded-xl w-36 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 bg-slate-200 rounded w-32" />
                                    <div className="h-4 bg-slate-100 rounded w-48" />
                                </div>
                                <div className="h-6 bg-slate-200 rounded-full w-20" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-100 rounded w-40" />
                                <div className="h-4 bg-slate-100 rounded w-32" />
                            </div>
                            <div className="mt-4 flex gap-2">
                                <div className="h-8 bg-slate-100 rounded-xl w-24" />
                                <div className="h-8 bg-slate-100 rounded-xl w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // ─── Candidate View ───
    if (!isRecruiter) {
        return (
            <div className="pb-12 space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        My Interviews
                    </h1>
                    <p className="text-slate-500 mt-2">View and respond to your scheduled interviews.</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Upcoming Interviews */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-blue-600" />
                        Upcoming Interviews
                    </h2>
                    {upcomingInterviews.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                            <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-600">No upcoming interviews</h3>
                            <p className="text-sm text-slate-400 mt-1">You will see scheduled interviews here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {upcomingInterviews.map(iv => (
                                <CandidateInterviewCard
                                    key={iv._id}
                                    interview={iv}
                                    onAccept={() => handleCandidateResponse(iv._id, 'Accepted')}
                                    onReject={() => handleCandidateResponse(iv._id, 'Rejected')}
                                    onClick={() => setSelectedInterview(iv)}
                                    formatDate={formatDate}
                                    formatTime={formatTime}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Past Interviews */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Past Interviews
                    </h2>
                    {pastInterviews.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                            <FileX className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-600">No completed interviews</h3>
                            <p className="text-sm text-slate-400 mt-1">Your past interviews will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pastInterviews.map(iv => (
                                <CandidatePastCard
                                    key={iv._id}
                                    interview={iv}
                                    onClick={() => setSelectedInterview(iv)}
                                    formatDate={formatDate}
                                    formatTime={formatTime}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedInterview && (
                    <InterviewDetailModal
                        interview={selectedInterview}
                        isRecruiter={false}
                        onClose={() => setSelectedInterview(null)}
                        formatDate={formatDate}
                        formatTime={formatTime}
                    />
                )}
            </div>
        )
    }

    // ─── Recruiter View ───
    return (
        <div className="pb-12 space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        Interview Management
                    </h1>
                    <p className="text-slate-500 mt-2">Schedule, manage, and evaluate candidate interviews.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Interview
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {['All', ...Object.keys(STATUS_CONFIG)].map(status => {
                    const isActive = filterStatus === status
                    const cfg = STATUS_CONFIG[status]
                    return (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                                isActive
                                    ? status === 'All'
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : `${cfg.color} border-current`
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {status}
                            {status !== 'All' && (
                                <span className="ml-1.5 opacity-70">
                                    ({interviews.filter(iv => iv.status === status).length})
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Interviews Grid */}
            {filteredInterviews.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileX className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-600">No interviews found</h3>
                    <p className="text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
                        {filterStatus === 'All'
                            ? 'Create your first interview by clicking the "New Interview" button above.'
                            : `No interviews with status "${filterStatus}" found.`
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInterviews.map(iv => (
                        <RecruiterInterviewCard
                            key={iv._id}
                            interview={iv}
                            onComplete={() => handleStatusUpdate(iv._id, 'Completed')}
                            onCancel={() => handleStatusUpdate(iv._id, 'Cancelled')}
                            onClick={() => setSelectedInterview(iv)}
                            formatDate={formatDate}
                            formatTime={formatTime}
                        />
                    ))}
                </div>
            )}

            {/* Create Interview Modal */}
            {showCreateForm && (
                <CreateInterviewModal
                    formData={formData}
                    setFormData={setFormData}
                    applications={applications}
                    selectedAppData={selectedAppData}
                    onApplicationSelect={handleApplicationSelect}
                    onSubmit={handleCreateInterview}
                    onClose={() => { setShowCreateForm(false); setFormData({ application: '', round: 'Phone Screening', date: '', time: '', duration: 60, location: '', googleMeetLink: '', notes: '' }); setSelectedAppData(null) }}
                    submitting={submitting}
                    rounds={ROUNDS}
                />
            )}

            {/* Detail Modal */}
            {selectedInterview && (
                <InterviewDetailModal
                    interview={selectedInterview}
                    isRecruiter={true}
                    onClose={() => { setSelectedInterview(null); setEditMode(false) }}
                    onComplete={() => handleStatusUpdate(selectedInterview._id, 'Completed')}
                    onCancel={() => handleStatusUpdate(selectedInterview._id, 'Cancelled')}
                    onDelete={() => handleDeleteInterview(selectedInterview._id)}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    editData={editData}
                    setEditData={setEditData}
                    onUpdate={() => handleUpdateInterview(selectedInterview._id)}
                    feedbackForm={feedbackForm}
                    setFeedbackForm={setFeedbackForm}
                    onSubmitFeedback={handleSubmitFeedback}
                    submittingFeedback={submittingFeedback}
                    submitting={submitting}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    rounds={ROUNDS}
                />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
//  Recruiter Interview Card
// ═══════════════════════════════════════════════════════════════════
function RecruiterInterviewCard({ interview, onComplete, onCancel, onClick, formatDate, formatTime }) {
    const statusCfg = STATUS_CONFIG[interview.status] || STATUS_CONFIG.Scheduled
    const StatusIcon = statusCfg.icon
    const candidateName = interview.candidateName || interview.candidate?.name || 'Unknown'
    const jobTitle = interview.jobTitle || interview.job?.title || 'Unknown'

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group"
            onClick={() => onClick(interview)}
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-800 truncate">{candidateName}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                            <Briefcase className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{jobTitle}</span>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${statusCfg.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {interview.status}
                    </span>
                </div>

                {/* Calendar-style date */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-14 bg-blue-50 border border-blue-200 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                            {new Date(interview.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-extrabold text-blue-700 leading-tight">
                            {new Date(interview.date).getDate()}
                        </span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(interview.time)} · {interview.duration}min
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Target className="h-3.5 w-3.5 text-slate-400" />
                            {interview.round}
                        </div>
                    </div>
                </div>

                {/* Location & Link */}
                {interview.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{interview.location}</span>
                    </div>
                )}
                {interview.googleMeetLink && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-500 mb-1">
                        <Video className="h-3.5 w-3.5" />
                        <span className="truncate">Google Meet</span>
                    </div>
                )}

                {/* Candidate Response */}
                {interview.candidateResponse && interview.candidateResponse !== 'Pending' && (
                    <div className="mt-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                            interview.candidateResponse === 'Accepted'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                            Candidate: {interview.candidateResponse}
                        </span>
                    </div>
                )}

                {/* Action Buttons */}
                {interview.status === 'Scheduled' && (
                    <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={onComplete}
                            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Complete
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-colors"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
//  Candidate Interview Card (Upcoming)
// ═══════════════════════════════════════════════════════════════════
function CandidateInterviewCard({ interview, onAccept, onReject, onClick, formatDate, formatTime }) {
    const jobTitle = interview.jobTitle || interview.job?.title || 'Unknown'
    const recruiterName = interview.recruiterName || interview.recruiter?.name || 'Recruiter'

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
            onClick={() => onClick(interview)}
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-800 truncate">{jobTitle}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{recruiterName}</span>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {interview.candidateResponse || 'Pending'}
                    </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-14 bg-blue-50 border border-blue-200 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-blue-600 uppercase leading-none">
                            {new Date(interview.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-extrabold text-blue-700 leading-tight">
                            {new Date(interview.date).getDate()}
                        </span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(interview.time)} · {interview.duration}min
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Target className="h-3.5 w-3.5 text-slate-400" />
                            {interview.round}
                        </div>
                    </div>
                </div>

                {interview.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{interview.location}</span>
                    </div>
                )}
                {interview.googleMeetLink && (
                    <a
                        href={interview.googleMeetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 mb-1"
                        onClick={e => e.stopPropagation()}
                    >
                        <Video className="h-3.5 w-3.5" />
                        Join Google Meet
                    </a>
                )}

                {interview.candidateResponse === 'Pending' && (
                    <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={onAccept}
                            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-colors"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accept
                        </button>
                        <button
                            onClick={onReject}
                            className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-colors"
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
//  Candidate Past Interview Card
// ═══════════════════════════════════════════════════════════════════
function CandidatePastCard({ interview, onClick, formatDate, formatTime }) {
    const jobTitle = interview.jobTitle || interview.job?.title || 'Unknown'
    const feedback = interview.feedback

    return (
        <div
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
            onClick={() => onClick(interview)}
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-800 truncate">{jobTitle}</h3>
                        <div className="text-sm text-slate-500 mt-0.5">{interview.round}</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                    </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">
                            {new Date(interview.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-extrabold text-slate-700 leading-tight">
                            {new Date(interview.date).getDate()}
                        </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatTime(interview.time)}
                        </div>
                    </div>
                </div>

                {feedback && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= (feedback.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                    />
                                ))}
                            </div>
                            {feedback.recommendation && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${RECOMMENDATION_COLORS[feedback.recommendation] || 'bg-slate-100 text-slate-600'}`}>
                                    {feedback.recommendation}
                                </span>
                            )}
                        </div>
                        {feedback.comments && (
                            <p className="text-xs text-slate-600 line-clamp-2">{feedback.comments}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
//  Create Interview Modal
// ═══════════════════════════════════════════════════════════════════
function CreateInterviewModal({ formData, setFormData, applications, selectedAppData, onApplicationSelect, onSubmit, onClose, submitting, rounds }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <h2 className="text-xl font-bold text-slate-800">Schedule Interview</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    {/* Application Select */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application *</label>
                        <select
                            value={formData.application}
                            onChange={e => onApplicationSelect(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">Select an application...</option>
                            {applications.map(app => (
                                <option key={app._id} value={app._id}>
                                    {app.candidateName || app.candidate?.name || 'Unknown'} — {app.jobTitle || app.job?.title || 'Unknown'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Auto-filled Candidate & Job */}
                    {selectedAppData && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Candidate</label>
                                <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium">
                                    {selectedAppData.candidateName || selectedAppData.candidate?.name || 'Unknown'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job</label>
                                <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium truncate">
                                    {selectedAppData.jobTitle || selectedAppData.job?.title || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Round */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Round *</label>
                        <select
                            value={formData.round}
                            onChange={e => setFormData(prev => ({ ...prev, round: e.target.value }))}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {rounds.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Time *</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration (minutes)</label>
                        <input
                            type="number"
                            min="15"
                            max="480"
                            step="15"
                            value={formData.duration}
                            onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="e.g. Conference Room A, Office HQ"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Google Meet Link */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Google Meet Link</label>
                        <input
                            type="url"
                            value={formData.googleMeetLink}
                            onChange={e => setFormData(prev => ({ ...prev, googleMeetLink: e.target.value }))}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            placeholder="Additional notes for this interview..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {submitting ? 'Scheduling...' : 'Schedule Interview'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
//  Interview Detail Modal
// ═══════════════════════════════════════════════════════════════════
function InterviewDetailModal({
    interview,
    isRecruiter,
    onClose,
    onComplete,
    onCancel,
    onDelete,
    editMode,
    setEditMode,
    editData,
    setEditData,
    onUpdate,
    feedbackForm,
    setFeedbackForm,
    onSubmitFeedback,
    submittingFeedback,
    submitting,
    formatDate,
    formatTime,
    rounds
}) {
    const [showFeedback, setShowFeedback] = useState(false)
    const statusCfg = STATUS_CONFIG[interview.status] || STATUS_CONFIG.Scheduled
    const StatusIcon = statusCfg.icon
    const candidateName = interview.candidateName || interview.candidate?.name || 'Unknown'
    const jobTitle = interview.jobTitle || interview.job?.title || 'Unknown'
    const feedback = interview.feedback

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800">Interview Details</h2>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {interview.status}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Candidate & Job */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Candidate</div>
                            <div className="text-sm font-bold text-slate-800">{candidateName}</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Job Position</div>
                            <div className="text-sm font-bold text-slate-800 truncate">{jobTitle}</div>
                        </div>
                    </div>

                    {/* Calendar-style Date Display */}
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-16 h-20 bg-white border-2 border-blue-200 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                            <span className="text-xs font-bold text-blue-600 uppercase leading-none">
                                {new Date(interview.date).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-2xl font-extrabold text-blue-700 leading-tight">
                                {new Date(interview.date).getDate()}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-500">
                                {new Date(interview.date).getFullYear()}
                            </span>
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="font-semibold">{formatTime(interview.time)}</span>
                                <span className="text-slate-400">·</span>
                                <span>{interview.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Target className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{interview.round}</span>
                            </div>
                        </div>
                    </div>

                    {/* Location & Meet Link */}
                    {(interview.location || interview.googleMeetLink) && (
                        <div className="space-y-2">
                            {interview.location && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    {interview.location}
                                </div>
                            )}
                            {interview.googleMeetLink && (
                                <a
                                    href={interview.googleMeetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                    <Video className="h-4 w-4" />
                                    Join Google Meet
                                </a>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    {interview.notes && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
                                <StickyNote className="h-3.5 w-3.5" />
                                Notes
                            </div>
                            <p className="text-sm text-amber-800 whitespace-pre-wrap">{interview.notes}</p>
                        </div>
                    )}

                    {/* Edit Mode (Recruiter) */}
                    {isRecruiter && editMode && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <h3 className="text-sm font-bold text-slate-700">Edit Interview</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Round</label>
                                    <select
                                        value={editData.round}
                                        onChange={e => setEditData(prev => ({ ...prev, round: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {rounds.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (min)</label>
                                    <input
                                        type="number"
                                        value={editData.duration}
                                        onChange={e => setEditData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={editData.date}
                                        onChange={e => setEditData(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={editData.time}
                                        onChange={e => setEditData(prev => ({ ...prev, time: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={editData.location}
                                    onChange={e => setEditData(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Google Meet Link</label>
                                <input
                                    type="url"
                                    value={editData.googleMeetLink}
                                    onChange={e => setEditData(prev => ({ ...prev, googleMeetLink: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                                <textarea
                                    value={editData.notes}
                                    onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onUpdate}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Existing Feedback Display */}
                    {feedback && !showFeedback && !editMode && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Interview Feedback
                                </h3>
                                {feedback.recommendation && (
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${RECOMMENDATION_COLORS[feedback.recommendation] || 'bg-slate-100 text-slate-600'}`}>
                                        {feedback.recommendation}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-0.5 mb-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                        key={star}
                                        className={`h-5 w-5 ${star <= (feedback.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                    />
                                ))}
                            </div>
                            {feedback.strengths?.length > 0 && (
                                <div className="mb-2">
                                    <span className="text-xs font-semibold text-emerald-600">Strengths: </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {feedback.strengths.map((s, i) => (
                                            <span key={i} className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {feedback.weaknesses?.length > 0 && (
                                <div className="mb-2">
                                    <span className="text-xs font-semibold text-rose-600">Weaknesses: </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {feedback.weaknesses.map((w, i) => (
                                            <span key={i} className="text-[11px] font-medium text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">{w}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {feedback.comments && (
                                <p className="text-sm text-emerald-800 mt-2 whitespace-pre-wrap">{feedback.comments}</p>
                            )}
                        </div>
                    )}

                    {/* Feedback Form (Recruiter) */}
                    {isRecruiter && interview.status === 'Completed' && (
                        <div>
                            {!showFeedback && !feedback && (
                                <button
                                    onClick={() => setShowFeedback(true)}
                                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-colors"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Add Feedback
                                </button>
                            )}
                            {(showFeedback || feedback) && (
                                <form onSubmit={onSubmitFeedback} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Edit3 className="h-4 w-4" />
                                        {feedback ? 'Update Feedback' : 'Interview Feedback'}
                                    </h3>

                                    {/* Star Rating */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rating *</label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                                                    className="p-0.5 transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        className={`h-7 w-7 transition-colors ${
                                                            star <= feedbackForm.rating
                                                                ? 'text-amber-400 fill-amber-400'
                                                                : 'text-slate-300 hover:text-amber-300'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-slate-500 self-center">{feedbackForm.rating}/5</span>
                                        </div>
                                    </div>

                                    {/* Strengths */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Strengths (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={feedbackForm.strengths}
                                            onChange={e => setFeedbackForm(prev => ({ ...prev, strengths: e.target.value }))}
                                            placeholder="e.g. Problem Solving, Communication, Team Player"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Weaknesses */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Weaknesses (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={feedbackForm.weaknesses}
                                            onChange={e => setFeedbackForm(prev => ({ ...prev, weaknesses: e.target.value }))}
                                            placeholder="e.g. Time Management, Public Speaking"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Comments */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Comments</label>
                                        <textarea
                                            value={feedbackForm.comments}
                                            onChange={e => setFeedbackForm(prev => ({ ...prev, comments: e.target.value }))}
                                            rows={3}
                                            placeholder="Detailed comments about the interview..."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* Recommendation */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Recommendation *</label>
                                        <select
                                            value={feedbackForm.recommendation}
                                            onChange={e => setFeedbackForm(prev => ({ ...prev, recommendation: e.target.value }))}
                                            required
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select recommendation...</option>
                                            {RECOMMENDATION_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowFeedback(false); if (!feedback) setFeedbackForm({ rating: 0, strengths: '', weaknesses: '', comments: '', recommendation: '' }) }}
                                            className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingFeedback || feedbackForm.rating === 0}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {submittingFeedback ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                            {feedback ? 'Update Feedback' : 'Submit Feedback'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {/* Candidate Response Section */}
                    {!isRecruiter && interview.status === 'Scheduled' && interview.candidateResponse === 'Pending' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    const API = import.meta.env.VITE_API_URL
                                    axios.patch(`${API}/api/interviews/${interview._id}/response`, { candidateResponse: 'Accepted' }, {
                                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                    }).then(() => onClose())
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Accept Interview
                            </button>
                            <button
                                onClick={() => {
                                    const API = import.meta.env.VITE_API_URL
                                    axios.patch(`${API}/api/interviews/${interview._id}/response`, { candidateResponse: 'Rejected' }, {
                                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                    }).then(() => onClose())
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                            >
                                <XCircle className="h-4 w-4" />
                                Reject Interview
                            </button>
                        </div>
                    )}
                </div>

                {/* Recruiter Action Footer */}
                {isRecruiter && !editMode && (
                    <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-3xl">
                        <div className="flex flex-wrap gap-2">
                            {interview.status === 'Scheduled' && (
                                <>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={onComplete}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Mark Complete
                                    </button>
                                    <button
                                        onClick={onCancel}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Cancel
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onDelete}
                                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl transition-colors ml-auto"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Interviews
