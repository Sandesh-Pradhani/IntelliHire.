import { useState, useEffect } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'

import Skeleton from '../components/ui/Skeleton'

import { Briefcase, Plus } from 'lucide-react'

function Jobs() {

    const [title, setTitle] = useState('')

    const [company, setCompany] = useState('')

    const [description, setDescription] = useState('')

    const [jobs, setJobs] = useState([])

    const [loading, setLoading] = useState(true)

    const [submitting, setSubmitting] = useState(false)

    const [error, setError] = useState('')

    const [success, setSuccess] = useState('')

    const fetchJobs = async () => {

        try {

            const response = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/jobs`
            )

            setJobs(response.data)

        } catch (error) {

            console.log(error)
            setError('Failed to load jobs.')
        } finally {

            setLoading(false)
        }
    }

    useEffect(() => {

        fetchJobs()

    }, [])

    const createJob = async () => {

        if (!title.trim() || !company.trim()) {
            setError('Title and Company are required.')
            return
        }

        setSubmitting(true)
        setError('')
        setSuccess('')

        try {

            await axios.post(

                `${import.meta.env.VITE_API_URL}/api/jobs/create`,

                {
                    title,
                    company,
                    description
                }
            )

            setSuccess('Job created successfully!')
            setTitle('')
            setCompany('')
            setDescription('')
            fetchJobs()

        } catch (error) {

            console.log(error)
            setError(error.response?.data?.message || 'Failed to create job.')

        } finally {

            setSubmitting(false)
        }
    }

    return (

        <Layout>

            <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-blue-600" />
                Job Management
            </h1>

            {error && (
                <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
                    {success}
                </div>
            )}

            {/* CREATE JOB */}

            <div className="bg-white rounded-3xl shadow-lg p-8 mt-8 border border-slate-100">

                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Create New Job
                </h2>

                <div className="mt-6 space-y-5">

                    <input
                        type="text"
                        placeholder="Job Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <input
                        type="text"
                        placeholder="Company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <textarea
                        rows="5"
                        placeholder="Job Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <button

                        onClick={createJob}
                        disabled={submitting}

                        className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            submitting
                                ? 'bg-blue-400 cursor-not-allowed text-white'
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white'
                        }`}

                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Creating...
                            </span>
                        ) : (
                            'Create Job'
                        )}
                    </button>

                </div>

            </div>

            {/* JOB LIST */}

            <div className="mt-10">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Current Openings</h2>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
                                <Skeleton width="60%" height="24px" />
                                <Skeleton width="30%" height="16px" className="mt-3" />
                                <Skeleton width="80%" height="16px" className="mt-4" />
                            </div>
                        ))}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                        <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-600">No jobs posted yet</h3>
                        <p className="text-sm text-slate-400 mt-1">Create your first job opening above.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">

                        {
                            jobs.map((job) => (

                                <div

                                    key={job._id}

                                    className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100 hover:shadow-md transition-shadow duration-300"

                                >

                                    <h2 className="text-2xl font-bold text-slate-800">

                                        {job.title}
                                    </h2>

                                    <p className="text-blue-600 mt-2 font-medium">

                                        {job.company}
                                    </p>

                                    <p className="text-slate-600 mt-4 leading-relaxed">

                                        {job.description}
                                    </p>

                                </div>
                            ))
                        }

                    </div>
                )}
            </div>

        </Layout>
    )
}

export default Jobs