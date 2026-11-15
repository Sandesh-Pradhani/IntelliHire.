import { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BarChart3, Brain, ChevronDown, ChevronUp, Sparkles, TrendingUp } from 'lucide-react'
import MatchCard from '../components/MatchCard'
import SkillGapCard from '../components/SkillGapCard'
import { AuthContext } from '../context/authContext'
import { normalizeArray } from '../utils/apiNormalizer'

const API_URL = import.meta.env.VITE_API_URL

function JobMatch() {
  const { user } = useContext(AuthContext)
  const isCandidate = user?.role === 'candidate'
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [jobText, setJobText] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSemanticDetails, setShowSemanticDetails] = useState(false)
  const [showSkillGapDetails, setShowSkillGapDetails] = useState(false)
  const [showRankingDetails, setShowRankingDetails] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token')
        const [jobsResponse, resumesResponse] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/all`),
          axios.get(`${API_URL}/api/resumes/all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        setJobs(normalizeArray(jobsResponse.data?.jobs ?? jobsResponse.data))
        setResumes(normalizeArray(resumesResponse.data))
      } catch (requestError) {
        console.log(requestError)
      }
    }

    fetchData()
  }, [])

  const selectedJobRecord = useMemo(
    () => jobs.find((job) => String(job._id) === String(selectedJob)),
    [jobs, selectedJob]
  )

  const selectedResumeRecord = useMemo(
    () => resumes.find((resume) => String(resume._id) === String(selectedResume)),
    [resumes, selectedResume]
  )

  const runMatching = async () => {
    try {
      const token = localStorage.getItem('token')
      setLoading(true)
      setError('')
      setShowSemanticDetails(false)
      setShowSkillGapDetails(false)
      setShowRankingDetails(false)

      const endpoint = isCandidate
        ? `${API_URL}/api/ai/match`
        : `${API_URL}/api/recruiter/match`

      const response = await axios.post(
        endpoint,
        {
          jobId: selectedJob,
          resumeId: selectedResume,
          job: jobText,
          resume: resumeText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Candidate endpoint returns a standard envelope { success, data, message }.
      // Recruiter endpoint returns the match result directly.
      setResult((response.data?.data && response.data.success !== undefined) ? response.data.data : response.data || null)
    } catch (requestError) {
      console.log(requestError)
      setError(requestError?.response?.data?.message || 'Matching failed.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-slate-500'
  }

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="pb-12 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">AI Job Matching</h1>
          <p className="mt-0.5 text-sm text-slate-400">Select a job and compare it against a resume for AI-powered analysis.</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-700">Select Job</label>
          <select
            value={selectedJob}
            onChange={(event) => {
              const value = event.target.value
              setSelectedJob(value)
              const job = jobs.find((item) => String(item._id) === String(value))
              setJobText(job?.description || '')
            }}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select a job...</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>{job.title || 'Untitled'}</option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-bold text-slate-700">Select Resume</label>
          <select
            value={selectedResume}
            onChange={(event) => {
              const value = event.target.value
              setSelectedResume(value)
              const resume = resumes.find((item) => String(item._id) === String(value))
              setResumeText(Array.isArray(resume?.extractedSkills) ? resume.extractedSkills.join(', ') : '')
            }}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select a resume...</option>
            {resumes.map((resume) => (
              <option key={resume._id} value={resume._id}>{resume.fileName || resume.filename || 'Unnamed Resume'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-slate-800">Job Description</h2>
          <textarea rows="10" value={jobText || selectedJobRecord?.description || ''} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600" />
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-slate-800">Candidate Skills</h2>
          <textarea rows="10" value={resumeText || (Array.isArray(selectedResumeRecord?.extractedSkills) ? selectedResumeRecord.extractedSkills.join(', ') : '')} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600" />
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      <button
        type="button"
        onClick={runMatching}
        disabled={loading || !selectedJob || !selectedResume}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing with AI Engine...
          </>
        ) : (
          <>
            <Brain className="h-6 w-6" />
            Analyze Candidate Match
          </>
        )}
      </button>

      {result ? (
        <div className="mt-10 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <MatchCard similarity={result?.similarity} finalScore={result?.finalScore} />
            <SkillGapCard
              matchedSkills={normalizeArray(result?.matchedSkills)}
              missingSkills={normalizeArray(result?.missingSkills)}
            />
          </div>

          {result?.semantic_match ? (
            <ExpandableCard
              icon={Sparkles}
              title="Semantic Match (SBERT)"
              score={`${result.semantic_match.match_percentage || 0}%`}
              scoreClassName={getScoreColor(result.semantic_match.match_percentage || 0)}
              open={showSemanticDetails}
              onToggle={() => setShowSemanticDetails((value) => !value)}
            >
              <div className="space-y-4">
                <div className="h-2.5 w-full rounded-full bg-slate-100">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(result.semantic_match.match_percentage || 0)}`} style={{ width: `${result.semantic_match.match_percentage || 0}%` }} />
                </div>
                <p className="text-xs text-slate-400">Model: {result.semantic_match.model_used || 'N/A'}</p>
                {normalizeArray(result.semantic_match.reasons).length > 0 ? (
                  <ul className="space-y-2">
                    {normalizeArray(result.semantic_match.reasons).map((reason, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-600">{index + 1}</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </ExpandableCard>
          ) : null}

          {result?.skill_gap_analysis ? (
            <ExpandableCard
              icon={BarChart3}
              title="Skill Gap Analysis"
              score={`${result.skill_gap_analysis.match_percentage || 0}% match`}
              scoreClassName={getScoreColor(result.skill_gap_analysis.match_percentage || 0)}
              open={showSkillGapDetails}
              onToggle={() => setShowSkillGapDetails((value) => !value)}
            >
              <div className="space-y-6">
                {result.skill_gap_analysis.missing_difficulty ? (
                  <div className="grid grid-cols-3 gap-3">
                    {['beginner', 'intermediate', 'advanced'].map((level) => {
                      const data = result.skill_gap_analysis.missing_difficulty[level]
                      return data?.count > 0 ? (
                        <div key={level} className="rounded-xl bg-slate-50 p-3 text-center">
                          <p className="text-lg font-extrabold text-slate-700">{data.count}</p>
                          <p className="text-xs capitalize text-slate-400">{level}</p>
                        </div>
                      ) : null
                    })}
                  </div>
                ) : null}

                {normalizeArray(result.skill_gap_analysis.recommended_skills).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {normalizeArray(result.skill_gap_analysis.recommended_skills).map((recommendation, index) => (
                      <div key={index} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                        <span className="font-semibold text-amber-800">{recommendation.skill}</span>
                        <span className="ml-1 text-amber-500">({recommendation.difficulty})</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {normalizeArray(result.skill_gap_analysis.roadmap).length > 0 ? (
                  <div className="space-y-2">
                    {normalizeArray(result.skill_gap_analysis.roadmap).map((step, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-700">{step.skill}</p>
                          <p className="text-xs text-slate-400">{step.difficulty} - {step.estimated_time} - {step.priority} priority</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </ExpandableCard>
          ) : null}

          {result?.unified_ranking ? (
            <ExpandableCard
              icon={TrendingUp}
              title="Unified Ranking Score"
              score={String(result.unified_ranking.overall || 0)}
              scoreClassName={getScoreColor(result.unified_ranking.overall || 0)}
              open={showRankingDetails}
              onToggle={() => setShowRankingDetails((value) => !value)}
            >
              <div className="space-y-4">
                {Object.entries(result.unified_ranking.breakdown || {}).map(([key, data]) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize text-slate-700">{key}</span>
                      <span className="text-xs text-slate-400">
                        {data.score?.toFixed?.(0) || data.score || 0} pts x {((data.weight || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${getProgressColor(data.score || 0)}`} style={{ width: `${(data.weighted || 0) * 3}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ExpandableCard({ icon: Icon, title, score, scoreClassName, open, onToggle, children }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <span className={`ml-2 text-sm font-bold ${scoreClassName}`}>{score}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}

export default JobMatch
