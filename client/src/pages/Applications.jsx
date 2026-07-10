import { useEffect, useState } from 'react'
import axios from 'axios'
import ApplicationCard from '../components/ApplicationCard'
import ApplicationDetailModal from '../components/ApplicationDetailModal'
import {
    Briefcase,
    AlertCircle,
    FileX,
    TrendingUp,
    CheckCircle2,
    Clock,
    XCircle,
    UserCheck,
    Target,
    Sparkles,
    ArrowUpRight,
    FileText,
    Star,
    BarChart3,
    Calendar,
    MessageSquare,
    Award,
    ShieldCheck
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const PIPELINE = [
    { key: 'Applied', label: 'Applied', icon: Clock, color: 'bg-blue-50', text: 'text-blue-600' },
    { key: 'Screening', label: 'Screening', icon: FileText, color: 'bg-amber-50', text: 'text-amber-600' },
    { key: 'Shortlisted', label: 'Shortlisted', icon: Star, color: 'bg-emerald-50', text: 'text-emerald-600' },
    { key: 'Assessment', label: 'Assessment', icon: BarChart3, color: 'bg-indigo-50', text: 'text-indigo-600' },
    { key: 'Interview', label: 'Interview', icon: Calendar, color: 'bg-violet-50', text: 'text-violet-600' },
    { key: 'Technical Round', label: 'Technical', icon: Target, color: 'bg-cyan-50', text: 'text-cyan-600' },
    { key: 'HR Round', label: 'HR Round', icon: MessageSquare, color: 'bg-pink-50', text: 'text-pink-600' },
    { key: 'Offered', label: 'Offered', icon: Award, color: 'bg-teal-50', text: 'text-teal-600' },
    { key: 'Accepted', label: 'Accepted', icon: CheckCircle2, color: 'bg-green-50', text: 'text-green-600' },
    { key: 'Hired', label: 'Hired', icon: ShieldCheck, color: 'bg-green-100', text: 'text-green-700' },
    { key: 'Rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-50', text: 'text-red-600' },
]

function Applications() {
    const [applications, setApplications] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState(null)
    const [selectedApp, setSelectedApp] = useState(null)
    const [filterStatus, setFilterStatus] = useState('All')

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const [appsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/applications/recruiter`, { headers }),
                axios.get(`${API_URL}/api/applications/stats`, { headers })
            ])
            setApplications(appsRes.data || [])
            setStats(statsRes.data || null)
        } catch (err) {
            console.error('Applications fetch error:', err)
            setError(err.response?.data?.message || 'Failed to load applications')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id, status) => {
        setUpdatingId(id)
        try {
            const token = localStorage.getItem('token')
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            await axios.put(`${API_URL}/api/applications/status/${id}`, { status }, { headers })
            fetchData()
        } catch (err) {
            console.error('Status update error:', err)
            setError('Failed to update status')
        } finally {
            setUpdatingId(null)
        }
    }

    const filteredApplications = filterStatus === 'All'
        ? applications
        : applications.filter(app => app.status === filterStatus)

    const statusCounts = applications.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
    }, {})

    return (
        <div className="pb-12 space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                        <Briefcase className="h-8 w-8 text-blue-600" />
                        Application Pipeline
                    </h1>
                    <p className="text-slate-500 mt-2">Track candidates through the full hiring pipeline</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-colors"
                >
                    <ArrowUpRight className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                                <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
                                <div className="h-4 bg-slate-100 rounded w-20" />
                            </div>
                        ))}
                    </div>
                    <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                                <div className="flex justify-between">
                                    <div className="space-y-3">
                                        <div className="h-5 bg-slate-200 rounded w-40" />
                                        <div className="h-4 bg-slate-100 rounded w-28" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : applications.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileX className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-600">No applications yet</h3>
                    <p className="text-slate-400 mt-3 max-w-lg mx-auto">
                        Applications will appear here once candidates apply or you run AI Job Matching.
                    </p>
                </div>
            ) : (
                <>
                    {stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Briefcase className="h-4 w-4" /></div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Total</span>
                                </div>
                                <p className="text-3xl font-extrabold text-slate-800">{stats.total || applications.length}</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><UserCheck className="h-4 w-4" /></div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Hired</span>
                                </div>
                                <p className="text-3xl font-extrabold text-slate-800">{stats.statusCounts?.Hired || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-violet-100 text-violet-600 rounded-xl"><Calendar className="h-4 w-4" /></div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">In Pipeline</span>
                                </div>
                                <p className="text-3xl font-extrabold text-slate-800">
                                    {applications.filter(a => !['Rejected', 'Hired'].includes(a.status)).length}
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><TrendingUp className="h-4 w-4" /></div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Avg Score</span>
                                </div>
                                <p className="text-3xl font-extrabold text-slate-800">
                                    {stats.averageMatchScore || 0}%
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterStatus('All')}
                            className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                                filterStatus === 'All'
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            All ({applications.length})
                        </button>
                        {PIPELINE.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                                    filterStatus === key
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label} ({statusCounts[key] || 0})
                            </button>
                        ))}
                    </div>

                    <div className="grid gap-4">
                        {filteredApplications.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                <FileX className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No applications with status &ldquo;{filterStatus}&rdquo;</p>
                            </div>
                        ) : (
                            filteredApplications.map(app => (
                                <ApplicationCard
                                    key={app._id}
                                    application={app}
                                    onStatusChange={updateStatus}
                                    isUpdating={updatingId === app._id}
                                    onClick={(app) => setSelectedApp(app)}
                                />
                            ))
                        )}
                    </div>
                </>
            )}

            {selectedApp && (
                <ApplicationDetailModal
                    application={selectedApp}
                    onClose={() => setSelectedApp(null)}
                />
            )}
        </div>
    )
}

export default Applications
