import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Briefcase, ChevronDown, ChevronUp, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import Skeleton from '../components/ui/Skeleton'
import { AuthContext } from '../context/authContext'
import { normalizeArray } from '../utils/apiNormalizer'

function Jobs({ action }) {
  const { user } = useContext(AuthContext)
  const role = user?.role || 'candidate'
  const [form, setForm] = useState({ title: '', company: '', description: '' })
  const [jobs, setJobs] = useState([])
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [editingJobId, setEditingJobId] = useState('')
  const [expandedJobs, setExpandedJobs] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const [jobsResponse, applicationsResponse] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/all`),
          role === 'candidate'
            ? axios.get(`${import.meta.env.VITE_API_URL}/api/applications/candidate`, { headers })
            : Promise.resolve({ data: [] }),
        ])

        if (jobsResponse.status === 'fulfilled') {
          setJobs(normalizeArray(jobsResponse.value.data?.jobs ?? jobsResponse.value.data))
        }

        if (applicationsResponse.status === 'fulfilled' && role === 'candidate') {
          const applications = normalizeArray(applicationsResponse.value.data)
          setAppliedJobIds(new Set(applications.map((application) => String(application.jobId?._id || application.jobId))))
        }
      } catch (requestError) {
        console.error(requestError)
        setError('Failed to load jobs.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [role])

  const showCreateForm = role === 'recruiter' && action === 'create'
  const showJobList = role === 'candidate' || (role === 'recruiter' && ['manage', undefined].includes(action))

  const handleFieldChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm({ title: '', company: '', description: '' })
    setEditingJobId('')
  }

  const refreshJobs = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/all`)
    setJobs(normalizeArray(response.data?.jobs ?? response.data))
  }

  const submitJob = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      setError('Title and company are required.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      if (editingJobId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/jobs/update/${editingJobId}`, form, { headers })
        setSuccess('Job updated successfully.')
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/jobs/create`, form, { headers })
        setSuccess('Job created successfully.')
      }

      resetForm()
      await refreshJobs()
    } catch (requestError) {
      console.log(requestError)
      setError(requestError.response?.data?.message || 'Failed to save job.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = (job) => {
    setEditingJobId(job._id)
    setForm({
      title: job.title || '',
      company: job.company || '',
      description: job.description || '',
    })
  }

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/jobs/delete/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSuccess('Job deleted successfully.')
      await refreshJobs()
    } catch (requestError) {
      console.log(requestError)
      setError(requestError.response?.data?.message || 'Failed to delete job.')
    }
  }

  const toggleDescription = (jobId) => {
    setExpandedJobs((current) => {
      const next = new Set(current)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  const applyJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/applications/apply`,
        { jobId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccess('Application submitted successfully.')
      setAppliedJobIds((current) => new Set([...current, String(jobId)]))
    } catch (requestError) {
      console.log(requestError)
      setError(requestError.response?.data?.message || 'Failed to submit application. Please upload a resume first.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-800">
        <Briefcase className="h-8 w-8 text-blue-600" />
        {role === 'candidate' ? 'Browse Jobs' : action === 'create' ? 'Create New Job' : 'Job Management'}
      </h1>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{success}</div>
      ) : null}

      {(showCreateForm || editingJobId) ? (
        <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Plus className="h-5 w-5 text-blue-600" />
            {editingJobId ? 'Edit Job Opening' : 'Create New Job Opening'}
          </h2>

          <div className="mt-6 space-y-5">
            <input
              type="text"
              placeholder="Job Title"
              value={form.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              className="w-full rounded-xl border p-4 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <input
              type="text"
              placeholder="Company"
              value={form.company}
              onChange={(event) => handleFieldChange('company', event.target.value)}
              className="w-full rounded-xl border p-4 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <textarea
              rows="5"
              placeholder="Job Description"
              value={form.description}
              onChange={(event) => handleFieldChange('description', event.target.value)}
              className="w-full rounded-xl border p-4 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={submitJob}
                disabled={submitting}
                className={`rounded-xl px-8 py-3 font-semibold transition-all duration-200 ${
                  submitting
                    ? 'cursor-not-allowed bg-blue-400 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
                }`}
              >
                {submitting ? 'Saving...' : editingJobId ? 'Save Changes' : 'Create Job'}
              </button>
              {editingJobId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-8 py-3 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showJobList ? (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-slate-800">
            {role === 'candidate' ? 'Available Positions' : 'Active Openings'}
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
                  <Skeleton width="60%" height="24px" />
                  <Skeleton width="30%" height="16px" className="mt-3" />
                  <Skeleton width="80%" height="16px" className="mt-4" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
              <Briefcase className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600">No jobs posted yet</h3>
              {role === 'recruiter' ? <p className="mt-1 text-sm text-slate-400">Create a job opening to populate this list.</p> : null}
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs.map((job) => (
                <div key={job._id} className="relative rounded-3xl border border-slate-100 bg-white p-8 shadow-lg transition-shadow duration-300 hover:shadow-md">
                  {role === 'recruiter' ? (
                    <div className="absolute top-8 right-8 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(job)}
                        className="rounded-xl p-2 text-blue-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700"
                        title="Edit Job"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteJob(job._id)}
                        className="rounded-xl p-2 text-rose-500 transition-all duration-200 hover:bg-rose-50 hover:text-rose-700"
                        title="Delete Job"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ) : null}

                  <h2 className="text-2xl font-bold text-slate-800">{job.title || 'Untitled Position'}</h2>
                  <p className="mt-2 font-medium text-blue-600">{job.company || 'Unknown Company'}</p>
                  <div className="mt-4">
                    <p className={`leading-relaxed text-slate-600 ${expandedJobs.has(job._id) ? '' : 'line-clamp-3'}`}>
                      {job.description || 'No description provided.'}
                    </p>
                    {job.description && job.description.length > 150 ? (
                      <button
                        type="button"
                        onClick={() => toggleDescription(job._id)}
                        className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
                      >
                        {expandedJobs.has(job._id) ? (
                          <>
                            Read Less <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Read More <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    ) : null}
                  </div>

                  {role === 'candidate' ? (
                    <div className="mt-6 flex justify-end">
                      {appliedJobIds.has(String(job._id)) ? (
                        <button
                          type="button"
                          disabled
                          className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-400"
                        >
                          Applied
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => applyJob(job._id)}
                          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700"
                        >
                          Apply Job
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default Jobs
