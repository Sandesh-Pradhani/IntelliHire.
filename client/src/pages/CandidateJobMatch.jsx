import { useMemo, useState, useEffect } from 'react'
import { Brain, FileText, TrendingUp } from 'lucide-react'
import SectionHeader from '../components/common/SectionHeader'
import EmptyState from '../components/common/EmptyState'
import jobsService from '../services/jobs.service'
import aiService from '../services/ai.service'
import resumeService from '../services/resume.service'
import { normalizeArray } from '../utils/apiNormalizer'

export default function CandidateJobMatch() {
  const [selectedJob, setSelectedJob] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableJobs, setAvailableJobs] = useState([])
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')

  useEffect(() => {
    async function fetchJobs() {
      try {
        const data = await jobsService.getAll({ limit: 50 })
        const jobs = Array.isArray(data?.jobs) ? data.jobs : Array.isArray(data) ? data : []
        setAvailableJobs(jobs)
      } catch {
        setAvailableJobs([])
      }
    }
    async function fetchResumes() {
      try {
        const data = await resumeService.getHistory()
        const list = normalizeArray(data)
        setResumes(list)
        if (list.length > 0) setSelectedResumeId(list[0]._id)
      } catch {
        setResumes([])
      }
    }
    fetchJobs()
    fetchResumes()
  }, [])

  const selectedJobRecord = useMemo(
    () => availableJobs.find((j) => j._id === selectedJob),
    [selectedJob, availableJobs]
  )

  const runMatch = async () => {
    if (!selectedJob) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await aiService.matchCandidateJob({ jobId: selectedJob, resumeId: selectedResumeId })
      setResult(data || null)
    } catch (err) {
      setError(err?.message || 'Failed to run AI match. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-slate-500 bg-slate-50 border-slate-200'
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <SectionHeader
        title="AI Job Match"
        description="Compare your resume against a job posting for AI-powered analysis."
        icon={Brain}
      />

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <label className="mb-3 block text-sm font-bold text-slate-700">Select Job</label>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Select a job to analyze...</option>
          {availableJobs.map((job) => (
            <option key={job._id} value={job._id}>{job.title}</option>
          ))}
        </select>

        {selectedJobRecord ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Job Description Preview</p>
            <p className="mt-1 text-xs text-slate-500">{selectedJobRecord.description}</p>
          </div>
        ) : null}

        {resumes.length > 0 ? (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">Select Resume</label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>{r.fileName || r.filename || 'Resume'} (ATS: {r.atsScore || 0})</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-slate-700">No resumes uploaded</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">Upload a resume first to use AI matching.</p>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>
        ) : null}

        <button
          type="button"
          onClick={runMatch}
          disabled={loading || !selectedJob}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" />
              Analyze My Match
            </>
          )}
        </button>
      </div>

      {result ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-800">ATS Score</h3>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-extrabold ${getScoreColor(result.atsScore || result.finalScore || 0)} p-4 rounded-2xl`}>
                  {result.atsScore || result.finalScore || 0}
                </div>
                <p className="text-sm text-slate-500">Compatibility score based on AI analysis</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-800">Match Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Skills Match</span>
                  <span className="font-bold text-emerald-600">{result.similarity?.breakdown?.skills || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Experience Match</span>
                  <span className="font-bold text-blue-600">{result.similarity?.breakdown?.experience || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Overall Similarity</span>
                  <span className="font-bold text-indigo-600">{result.similarity?.overall || result.finalScore || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-800">Matched Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(result.matchedSkills || []).length > 0 ? (
                  (result.matchedSkills || []).map((skill, i) => (
                    <span key={i} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No skills matched</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-800">Missing Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(result.missingSkills || []).length > 0 ? (
                  (result.missingSkills || []).map((skill, i) => (
                    <span key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No missing skills identified</p>
                )}
              </div>
            </div>
          </div>

          {(result.suggestions || result.improvements || []).length > 0 ? (
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-800">Improvement Suggestions</h3>
              <ul className="space-y-3">
                {(result.suggestions || result.improvements || []).map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-[10px] font-bold text-blue-700">
                      {i + 1}
                    </span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : !loading ? (
        <EmptyState
          icon={Brain}
          title="Select a Job to Begin AI Analysis"
          description="Choose a job from the dropdown above to see how your resume matches."
        />
      ) : null}
    </div>
  )
}
