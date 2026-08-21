import { useMemo, useState, useEffect } from 'react'
import axios from 'axios'
import { Brain, Sparkles, TrendingUp, Users, Award, CheckCircle2, AlertTriangle } from 'lucide-react'
import SectionHeader from '../components/common/SectionHeader'
import EmptyState from '../components/common/EmptyState'
import { normalizeArray } from '../utils/apiNormalizer'

export default function RecruiterJobMatch() {
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/all`, { headers })
        const jobsData = res.data?.jobs ?? res.data
        setJobs(normalizeArray(Array.isArray(jobsData) ? jobsData : []))
      } catch {
        setJobs([])
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/recruiter/candidates`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const list = normalizeArray(res.data)
        setCandidates(list.map((c) => ({
          _id: c._id,
          name: c.name || 'Candidate',
          email: c.email || '',
          atsScore: c.atsScore || 0,
          matchScore: c.matchScore || 0,
          skills: c.skills || [],
          hasResume: Boolean(c.hasResume),
          applicationCount: c.applicationCount || 0,
        })))
      } catch {
        setCandidates([])
      }
    }
    fetchCandidates()
  }, [])

  const selectedJobRecord = useMemo(
    () => jobs.find((j) => j._id === selectedJob),
    [selectedJob, jobs]
  )

  const availableCandidates = useMemo(
    () => candidates.filter((c) => c.hasResume),
    [candidates]
  )

  const selectedCandidateRecord = useMemo(
    () => candidates.find((c) => c._id === selectedCandidate),
    [selectedCandidate, candidates]
  )

  const runMatch = async () => {
    if (!selectedJob || !selectedCandidate) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/recruiter/match`,
        { jobId: selectedJob, candidateId: selectedCandidate },
        { headers }
      )
      setResult(response.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to run AI match.')
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
        title="Candidate Match"
        description="Select a job, choose a candidate, and run AI-powered matching."
        icon={Users}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-700">1. Select Job</label>
          <select
            value={selectedJob}
            onChange={(e) => {
              setSelectedJob(e.target.value)
              setSelectedCandidate('')
              setResult(null)
            }}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Choose a job...</option>
            {jobs.filter((j) => j.status === 'active').map((job) => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </select>
          {selectedJobRecord ? (
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <p>{selectedJobRecord.location || 'Location not specified'}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-700">2. Choose Candidate</label>
          <select
            value={selectedCandidate}
            onChange={(e) => { setSelectedCandidate(e.target.value); setResult(null) }}
            disabled={!selectedJob || availableCandidates.length === 0}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {!selectedJob
                ? 'Select a job first...'
                : availableCandidates.length === 0
                  ? 'No candidates with resumes available...'
                  : 'Choose a candidate...'}
            </option>
            {availableCandidates.map((c) => (
              <option key={c._id} value={c._id}>{c.name} (ATS: {c.atsScore})</option>
            ))}
          </select>
          {availableCandidates.length > 0 ? (
            <p className="mt-2 text-xs text-slate-400">{availableCandidates.length} candidate{availableCandidates.length === 1 ? '' : 's'} available for matching</p>
          ) : null}
          {selectedCandidateRecord ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">Skills</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(selectedCandidateRecord.skills || []).map((skill, i) => (
                  <span key={i} className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{skill}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <button
        type="button"
        onClick={runMatch}
        disabled={loading || !selectedJob || !selectedCandidate}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running AI Match...
          </>
        ) : (
          <>
            <Brain className="h-6 w-6" />
            Run AI Match
          </>
        )}
      </button>

      {result ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedCandidateRecord?.name || 'Candidate'}</h3>
                <p className="text-sm text-slate-500">{selectedCandidateRecord?.email || ''}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ScoreCard label="Final Score" value={`${Math.round(result.finalScore || 0)}%`} icon={Award} />
            <ScoreCard label="Similarity" value={`${Math.round(typeof result.similarity === 'number' ? result.similarity : (result.similarity?.overall || 0))}%`} icon={Brain} />
            <ScoreCard label="Matched Skills" value={(result.matchedSkills || []).length} icon={CheckCircle2} />
            <ScoreCard label="Missing Skills" value={(result.missingSkills || []).length} icon={AlertTriangle} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(result.matchedSkills || []).length > 0 ? (
                  (result.matchedSkills || []).map((skill, i) => (
                    <span key={i} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">{skill}</span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No skills matched</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(result.missingSkills || []).length > 0 ? (
                  (result.missingSkills || []).map((skill, i) => (
                    <span key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">{skill}</span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No missing skills identified</p>
                )}
              </div>
            </div>
          </div>

          {result.skill_gap_analysis?.recommended_skills?.length > 0 ? (
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-800">Recommended Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(result.skill_gap_analysis.recommended_skills || []).map((rec, i) => (
                  <span key={i} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                    {rec.skill || rec} {rec.difficulty ? `(${rec.difficulty})` : ''}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : !loading && !selectedJob ? (
        <EmptyState
          icon={Brain}
          title="Select a Job to Begin AI Analysis"
          description="Choose a job and a candidate to see AI-powered match results."
        />
      ) : null}
    </div>
  )
}

function ScoreCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  )
}
