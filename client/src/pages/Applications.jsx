import { useEffect, useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import ApplicationCard from '../components/ApplicationCard'
import { Briefcase, AlertCircle, FileX } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

function Applications() {

    const [applications, setApplications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState(null)

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const response = await axios.get(
                `${API_URL}/api/applications/all`,
                { headers }
            )
            setApplications(response.data || [])
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
            await axios.put(
                `${API_URL}/api/applications/status/${id}`,
                { status },
                { headers }
            )
            fetchApplications()
        } catch (err) {
            console.error('Status update error:', err)
            setError('Failed to update status')
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <Layout>
            <div className="pb-12">
                <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-blue-600" />
                    Applications
                </h1>
                <p className="text-slate-500 mt-2">
                    Track and manage candidate applications.
                </p>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="mt-10 space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100 animate-pulse">
                                <div className="flex justify-between">
                                    <div className="space-y-3">
                                        <div className="h-6 bg-slate-200 rounded w-48" />
                                        <div className="h-4 bg-slate-100 rounded w-32" />
                                    </div>
                                    <div className="h-8 bg-slate-200 rounded w-16" />
                                </div>
                                <div className="mt-6 h-12 bg-slate-100 rounded-xl w-40" />
                            </div>
                        ))}
                    </div>
                ) : applications.length === 0 ? (
                    <div className="mt-10 bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                        <FileX className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600">No applications yet</h3>
                        <p className="text-slate-400 mt-2 max-w-md mx-auto">
                            Applications will appear here once candidates apply to jobs through the matching system.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 mt-10">
                        {applications.map(app => (
                            <ApplicationCard
                                key={app._id}
                                application={app}
                                onStatusChange={updateStatus}
                                isUpdating={updatingId === app._id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default Applications