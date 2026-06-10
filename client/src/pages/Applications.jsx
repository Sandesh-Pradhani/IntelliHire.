import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import ApplicationCard from '../components/ApplicationCard'
import ApplicationDetailModal from '../components/ApplicationDetailModal'
import { 
    Briefcase, 
    AlertCircle, 
    FileX, 
    Users, 
    TrendingUp, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    UserCheck,
    Target,
    Sparkles,
    ArrowUpRight
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const STATUS_CARDS = [
    { key: 'Applied', label: 'Applied', icon: Clock, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { key: 'Shortlisted', label: 'Shortlisted', icon: UserCheck, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { key: 'Interview', label: 'Interview', icon: Target, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600' },
    { key: 'Rejected', label: 'Rejected', icon: XCircle, color: 'from-red-500 to-red-600', bg: 'bg-red-50', text: 'text-red-600' },
    { key: 'Hired', label: 'Hired', icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' }
]

function Applications() {
    const [applications, setApplications] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState(null)
    const [selectedApp, setSelectedApp] = useState(null)
    const [filterStatus, setFilterStatus] = useState('All')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const headers = token ? { Authorization: `Bearer ${token}` } : {}

            const [appsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/api/applications`, { headers }),
                axios.get(`${API_URL}/api/applications/stats`, { headers })
            ])

            setApplications(appsRes.data || [])
            setStats(statsRes.data || null)
        } catch (err) {
            console.error('Applications fetch error:', err)
            if (err.response?.status === 404) {
                setError('Applications API not found. Ensure the server is running.')
            } else {
                setError(err.response?.data?.message || 'Failed to load applications')
            }
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id, status) => {
        setUpdatingId(id)
        try {
            const token = localStorage.getItem('token')
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            await axios.patch(
                `${API_URL}/api/applications/${id}/status`,
                { status },
                { headers }
            )
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

    return (
        <Layout>
            <div className="pb-12 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                            <Briefcase className="h-8 w-8 text-blue-600" />
                            ATS Dashboard
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Track, manage, and evaluate all candidate applications in one place.
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                        Refresh Data
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-6">
                        {/* Stats Skeleton */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                                    <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
                                    <div className="h-4 bg-slate-100 rounded w-20" />
                                </div>
                            ))}
                        </div>
                        {/* Cards Skeleton */}
                        <div className="grid gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                                    <div className="flex justify-between">
                                        <div className="space-y-3">
                                            <div className="h-5 bg-slate-200 rounded w-40" />
                                            <div className="h-4 bg-slate-100 rounded w-28" />
                                        </div>
                                        <div className="h-8 bg-slate-200 rounded w-20" />
                                    </div>
                                    <div className="mt-4 flex gap-3">
                                        <div className="h-6 bg-slate-100 rounded w-16" />
                                        <div className="h-6 bg-slate-100 rounded w-20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : applications.length === 0 && !error ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileX className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-600">No applications yet</h3>
                        <p className="text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
                            Applications will automatically appear here once you run AI Job Matching.
                            Select a job and resume, run the match analysis, and applications will be created automatically.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                {/* Total Applications */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                            <Briefcase className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</span>
                                    </div>
                                    <p className="text-3xl font-extrabold text-slate-800">{stats.totalApplications}</p>
                                    <p className="text-xs text-slate-400 mt-1">Applications</p>
                                </div>

                                {STATUS_CARDS.map(({ key, label, icon: Icon, color, bg, text }) => (
                                    <div key={key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 ${bg} ${text} rounded-xl`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
                                        </div>
                                        <p className="text-3xl font-extrabold text-slate-800">{stats.statusCounts[key] || 0}</p>
                                        <p className="text-xs text-slate-400 mt-1">Candidates</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Average Match Score Bar */}
                        {stats && stats.averageMatchScore > 0 && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
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
                        )}

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {['All', ...STATUS_CARDS.map(s => s.key)].map((status) => {
                                const isActive = filterStatus === status
                                const card = STATUS_CARDS.find(s => s.key === status)
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
                                            isActive
                                                ? card
                                                    ? `${card.bg} ${card.text} border-${card.key.toLowerCase()}-200`
                                                    : 'bg-slate-800 text-white border-slate-800'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {status === 'All' ? 'All Applications' : status}
                                        {status !== 'All' && stats && (
                                            <span className="ml-1.5 opacity-70">({stats.statusCounts[status] || 0})</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Applications List */}
                        <div className="grid gap-4">
                            {filteredApplications.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                                    <FileX className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No applications with status "{filterStatus}"</p>
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
            </div>

            {/* Detail Modal */}
            {selectedApp && (
                <ApplicationDetailModal
                    application={selectedApp}
                    onClose={() => setSelectedApp(null)}
                />
            )}
        </Layout>
    )
}

export default Applications