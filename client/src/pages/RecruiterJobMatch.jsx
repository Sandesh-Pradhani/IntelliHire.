import { useMemo, useState, useEffect } from 'react'
import axios from 'axios'
import { Brain, Sparkles, TrendingUp, Users, Award, CheckCircle2, AlertTriangle } from 'lucide-react'
import SectionHeader from '../components/common/SectionHeader'
import EmptyState from '../components/common/EmptyState'
import jobsService from '../services/jobs.service'
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
        const jobsData = await jobsService.getMyJobs()
        setJobs(normalizeArray(Array.isArray(jobsData) ? jobsData : []))
      } catch {
        setJobs([])
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!selectedJob) { setCandidates([]); return }
    async function fetchCandidates() {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/applications/recruiter`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const apps = normalizeArray(res.data)
        const filtered = apps.filter((a) => a.jobId === selectedJob || a.job?._id === selectedJob)
        const unique = [...new Map(filtered.map((a) => [a.candidateId || a.candidate?._id, a])).values()]
        setCandidates(unique.map((a) => ({
          _id: a.candidateId || a.candidate?._id,
          name: a.candidateName || a.candidate?.name || 'Candidate',
          email: a.candidateEmail || a.candidate?.email || '',
          atsScore: a.atsScore || 0,
          matchScore: a.matchScore || 0,
          skills: a.matchedSkills || [],
        })))
      } catch {
        setCandidates([])
      }
    }
    fetchCandidates()
  }, [selectedJob])

  const selectedJobRecord = useMemo(
    () => jobs.find((j) => j._id === selectedJob),
    [selectedJob, jobs]
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
            disabled={!selectedJob}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{selectedJob ? 'Choose a candidate...' : 'Select a job first...'}</option>
            {candidates.map((c) => (
              <option key={c._id} value={c._id}>{c.name} (ATS: {c.atsScore})</option>
            ))}
          </select>
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
                <h3 className="text-xl font-bold text-slate-800">{result.candidate?.name || selectedCandidateRecord?.name}</h3>
                <p className="text-sm text-slate-500">{result.candidate?.email || selectedCandidateRecord?.email}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ScoreCard label="ATS Score" value={result.atsScore || 0} icon={Award} />
            <ScoreCard label="Similarity" value={`${result.similarity?.overall || 0}%`} icon={Brain} />
            <ScoreCard label="Strengths" value={(result.strengths || []).length} icon={CheckCircle2} />
            <ScoreCard label="Weaknesses" value={(result.weaknesses || []).length} icon={AlertTriangle} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(result.matchedSkills || []).map((skill, i) => (
                  <span key={i} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">{skill}</span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(result.missingSkills || []).map((skill, i) => (
                  <span key={i} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {result.recommendation ? (
            <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-bold text-slate-800">Recommendation</h3>
              <p className="text-sm text-slate-700">{result.recommendation}</p>
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            {(result.strengths || []).length > 0 ? (
              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {(result.strengths || []).map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(result.weaknesses || []).length > 0 ? (
              <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Weaknesses
                </h3>
                <ul className="space-y-2">
                  {(result.weaknesses || []).map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 text-amber-500">⚠</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
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
