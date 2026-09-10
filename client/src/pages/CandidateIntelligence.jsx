import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  ExternalLink,
  FileCheck,
  FileText,
  FolderKanban,
  GraduationCap,
  Info,
  Layers,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react'
import candidateIntelligenceService from '../services/candidateIntelligence.service'
import jobsService from '../services/jobs.service'
import Skeleton from '../components/ui/Skeleton'
import ROUTES from '../constants/routes'
import { normalizeArray } from '../utils/apiNormalizer'

const STATUS_CONFIG = {
  Applied: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  Screening: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Info },
  Shortlisted: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: UserCheck },
  Interview: { bg: 'bg-violet-50 text-violet-700 border-violet-200', icon: Target },
  Selected: { bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle2 },
  Rejected: { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  Hired: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Award },
}

const RECOMMENDATION_CONFIG = {
  'Strongly Recommended': {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  'Recommended': {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    bar: 'bg-blue-500',
    text: 'text-blue-700',
  },
  'Consider': {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    bar: 'bg-amber-500',
    text: 'text-amber-700',
  },
  'Needs Review': {
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    bar: 'bg-orange-500',
    text: 'text-orange-700',
  },
  'Low Match': {
    badge: 'bg-red-100 text-red-800 border-red-300',
    bar: 'bg-red-500',
    text: 'text-red-700',
  },
}

function CandidateIntelligence() {
  const { candidateId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const jobId = searchParams.get('jobId') || ''

  const [intelligence, setIntelligence] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'evidence' | 'resume' | 'applications'

  // Recruiter action state
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedActionStatus, setSelectedActionStatus] = useState('Shortlisted')
  const [actionNote, setActionNote] = useState('')

  useEffect(() => {
    fetchJobsList()
  }, [])

  useEffect(() => {
    if (candidateId) {
      loadCandidateData(candidateId, jobId)
    }
  }, [candidateId, jobId])

  async function fetchJobsList() {
    try {
      const response = await jobsService.getMyJobs()
      setJobs(normalizeArray(response))
    } catch {
      // Fallback silently if jobs cannot be fetched
    }
  }

  async function loadCandidateData(cid, jid) {
    setLoading(true)
    setError('')
    setActionSuccess('')

    try {
      const data = await candidateIntelligenceService.getCandidateIntelligence(cid, jid || null)
      setIntelligence(data)
    } catch (err) {
      console.error('[CandidateIntelligence] Fetch error:', err)
      setError(err?.message || 'Failed to load candidate intelligence. Please verify backend connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleJobChange(newJobId) {
    if (newJobId) {
      setSearchParams({ jobId: newJobId })
    } else {
      setSearchParams({})
    }
  }

  async function handleTakeAction(status) {
    setSelectedActionStatus(status)
    setActionNote('')
    setShowActionModal(true)
  }

  async function submitRecruiterAction() {
    setActionLoading(true)
    try {
      await candidateIntelligenceService.takeRecruiterAction(candidateId, {
        jobId: jobId || intelligence?.targetJob?.id || undefined,
        status: selectedActionStatus,
        note: actionNote,
      })

      setActionSuccess(`Candidate status updated to "${selectedActionStatus}".`)
      setShowActionModal(false)
      // Refresh candidate data to reflect new application status and timeline
      loadCandidateData(candidateId, jobId)
    } catch (err) {
      console.error('[CandidateIntelligence] Action error:', err)
      alert(err?.message || 'Failed to update candidate status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton width="180px" height="28px" />
          <Skeleton width="220px" height="38px" />
        </div>

        {/* Header skeleton */}
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <Skeleton width="280px" height="36px" />
              <Skeleton width="200px" height="20px" />
            </div>
            <div className="flex gap-4">
              <Skeleton width="120px" height="60px" />
              <Skeleton width="140px" height="60px" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-4">
            <Skeleton width="100%" height="180px" />
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm space-y-4">
            <Skeleton width="100%" height="180px" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !intelligence) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        <Link
          to={ROUTES.RECRUITER.RANKINGS}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Rankings
        </Link>
        <div className="rounded-3xl border border-red-200 bg-red-50/50 p-10 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Unable to Load Candidate Intelligence</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{error || 'Candidate profile not found.'}</p>
          <button
            onClick={() => loadCandidateData(candidateId, jobId)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    )
  }

  const {
    candidate,
    targetJob,
    applicationStatus,
    scores,
    recommendation,
    recommendationLabel,
    skills,
    strengths,
    gaps,
    evidence,
    resume,
    resumeHistory,
    academic,
    academicSummary,
    coding,
    projects,
    certificates,
    applications,
  } = intelligence

  const recConfig = RECOMMENDATION_CONFIG[recommendation] || RECOMMENDATION_CONFIG['Consider']
  const statusConfig = STATUS_CONFIG[applicationStatus] || STATUS_CONFIG.Applied
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Navigation Breadcrumb & Job Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link to={ROUTES.RECRUITER.RANKINGS} className="hover:text-blue-600 transition-colors">
            Rankings
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-slate-800">{candidate.name}</span>
        </div>

        {/* Job Match Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="job-selector" className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Evaluate Against:
          </label>
          <select
            id="job-selector"
            value={jobId}
            onChange={(e) => handleJobChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">General Candidate Profile</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title} {j.company ? `(${j.company})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Candidate Info */}
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-md">
              {candidate.name?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 truncate">
                  {candidate.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusConfig.bg}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {applicationStatus}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{candidate.email}</p>
              {targetJob && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 w-fit">
                  <Briefcase className="h-3.5 w-3.5" />
                  Targeting: <span className="font-bold">{targetJob.title}</span> {targetJob.company ? `· ${targetJob.company}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* AI Score & Recommendation Banner */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:px-6">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600">
                {scores.finalAIScore}
                <span className="text-lg text-slate-400 font-semibold">/100</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                Final AI Score
              </p>
            </div>

            <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />

            <div>
              <span className={`inline-block rounded-xl border px-3 py-1 text-xs font-extrabold ${recConfig.badge}`}>
                {recommendation}
              </span>
              <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                {recommendationLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Recruiter Actions Row */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Recruiter Actions:
            </span>
            <button
              type="button"
              onClick={() => handleTakeAction('Shortlisted')}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Shortlist Candidate
            </button>
            <button
              type="button"
              onClick={() => handleTakeAction('Interview')}
              className="rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors"
            >
              Move to Interview
            </button>
            <button
              type="button"
              onClick={() => handleTakeAction('Hired')}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Hire Candidate
            </button>
            <button
              type="button"
              onClick={() => handleTakeAction('Rejected')}
              className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Active Profile · Evaluated {new Date().toLocaleDateString()}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3.5 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4" /> AI Evaluation & Overview
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3.5 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" /> Evidence & Portfolio ({projects.length + certificates.length})
        </button>
        <button
          onClick={() => setActiveTab('resume')}
          className={`pb-3.5 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'resume'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" /> Resume & ATS Analysis
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3.5 px-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="h-4 w-4" /> Application History ({applications.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & AI EVALUATION */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <ScoreMetricCard label="Final AI Score" score={scores.finalAIScore} tone="blue" isPrimary />
            <ScoreMetricCard label="Semantic Match" score={scores.semanticMatch} tone="indigo" />
            <ScoreMetricCard label="ATS Score" score={scores.ats} tone="emerald" />
            <ScoreMetricCard label="Coding Score" score={scores.coding} tone="violet" />
            <ScoreMetricCard label="Project Score" score={scores.projects} tone="amber" />
            <ScoreMetricCard label="Academic Score" score={scores.academic} tone="teal" />
          </div>

          {/* Strengths & Skill Gap Analysis Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Strengths Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Key Strengths</h3>
                  <p className="text-xs text-slate-400">Validated evidence across candidate signals</p>
                </div>
              </div>

              {strengths.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 italic">No specific strengths recorded.</p>
              ) : (
                <ul className="space-y-3">
                  {strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Skill Gap Analysis Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Skill Gap & Requirements</h3>
                  <p className="text-xs text-slate-400">
                    {targetJob ? `Compared against ${targetJob.title}` : 'General profile requirements'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Matched Skills */}
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide block mb-2">
                    Matched Skills ({skills.matched.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.matched.length > 0 ? (
                      skills.matched.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No skills matched directly.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide block mb-2">
                    Missing Target Skills ({skills.missing.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.missing.length > 0 ? (
                      skills.missing.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {targetJob ? 'No skill gaps detected for this job!' : 'Select a target job to compare missing skills.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Evidence Summary Row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Projects</p>
                  <p className="text-xl font-extrabold text-slate-800">{evidence.totalProjects} Portfolios</p>
                  <p className="text-[11px] text-slate-500">{evidence.relevantProjectsCount} relevant</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Coding Stats</p>
                  <p className="text-xl font-extrabold text-slate-800">{evidence.problemsSolved} Solved</p>
                  <p className="text-[11px] text-slate-500">{evidence.githubContributions} GitHub contributions</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Certificates</p>
                  <p className="text-xl font-extrabold text-slate-800">{evidence.totalCertificates} Earned</p>
                  <p className="text-[11px] text-slate-500">{evidence.relevantCertificatesCount} relevant</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Academic Standing</p>
                  <p className="text-xl font-extrabold text-slate-800">{evidence.cgpa ? `${evidence.cgpa} CGPA` : 'N/A'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{academic?.branch || 'General'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE & PORTFOLIO DEEP DIVE */}
      {activeTab === 'evidence' && (
        <div className="space-y-8">
          {/* Projects Evidence Section */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Project Portfolio Evidence</h3>
                  <p className="text-xs text-slate-400">Practical experience and code implementations</p>
                </div>
              </div>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                {projects.length} Total Projects
              </span>
            </div>

            {projects.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl">
                <FolderKanban className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">No portfolio projects submitted yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      proj.isRelevant
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-800">{proj.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{proj.category} · {proj.role}</p>
                      </div>
                      {proj.projectScore > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          <Star className="h-3 w-3" /> {proj.projectScore}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                      {proj.description || 'No description provided.'}
                    </p>

                    {proj.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {proj.technologies.map((t, idx) => (
                          <span key={idx} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-3">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                        >
                          <Code2 className="h-3.5 w-3.5" /> Source Code <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {proj.liveDemoUrl && (
                        <a
                          href={proj.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                        >
                          Live Demo <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Coding Profile Evidence */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-violet-50 p-2 text-violet-600">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Competitive Coding Evidence</h3>
                <p className="text-xs text-slate-400">Activity on GitHub, LeetCode, and HackerRank</p>
              </div>
            </div>

            {!coding ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl">
                <Code2 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">No coding profiles linked by this candidate.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {/* LeetCode */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">LeetCode</span>
                    {coding.leetcodeUsername ? (
                      <span className="text-xs font-bold text-blue-600">@{coding.leetcodeUsername}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Not Linked</span>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {coding.leetcodeData?.totalSolved || coding.leetcodeData?.solvedProblems || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Problems Solved</p>
                </div>

                {/* GitHub */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">GitHub</span>
                    {coding.githubUsername ? (
                      <span className="text-xs font-bold text-blue-600">@{coding.githubUsername}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Not Linked</span>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {coding.githubData?.totalContributions || coding.githubData?.publicRepos || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Contributions / Repos</p>
                </div>

                {/* HackerRank */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-500">HackerRank</span>
                    {coding.hackerrankUsername ? (
                      <span className="text-xs font-bold text-blue-600">@{coding.hackerrankUsername}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Not Linked</span>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {coding.hackerrankData?.totalSolved || coding.hackerrankData?.badgesCount || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Badges / Solved</p>
                </div>
              </div>
            )}
          </section>

          {/* Certificates & Academic Evidence Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Certificates */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Certificates</h3>
                    <p className="text-xs text-slate-400">Verified credentials and qualifications</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  {certificates.length} Total
                </span>
              </div>

              {certificates.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 italic">No certificates submitted.</p>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-3">
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">{cert.name}</h5>
                        <p className="text-xs text-slate-500">{cert.issuer || 'Professional Authority'}</p>
                      </div>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline shrink-0 flex items-center gap-1"
                        >
                          Verify <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Academic Profile */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Academic Background</h3>
                  <p className="text-xs text-slate-400">University, branch, and performance metrics</p>
                </div>
              </div>

              {!academic ? (
                <p className="text-sm text-slate-400 py-4 italic">No academic profile information submitted.</p>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-400">College / Institution</span>
                      <span className="text-sm font-bold text-slate-800">{academic.college || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-400">Branch & Degree</span>
                      <span className="text-sm font-bold text-slate-800">{academic.branch || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-400">Graduation Year</span>
                      <span className="text-sm font-bold text-slate-800">{academic.graduationYear || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-xs font-bold uppercase text-slate-400">CGPA Standing</span>
                      <span className="text-base font-extrabold text-teal-700">{academic.cgpa} / 10</span>
                    </div>
                    {academic.backlogs > 0 && (
                      <div className="flex justify-between items-center text-red-600 text-xs font-bold pt-1">
                        <span>Active Backlogs</span>
                        <span>{academic.backlogs}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 italic bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    {academicSummary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESUME & ATS ANALYSIS */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Active Resume Record</h3>
                  <p className="text-xs text-slate-400">Parsed candidate resume text and ATS score</p>
                </div>
              </div>

              {resume && (
                <div className="flex items-center gap-3">
                  <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800">
                    ATS Score: {resume.atsScore}%
                  </span>
                </div>
              )}
            </div>

            {!resume ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl">
                <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">No active resume uploaded by this candidate.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{resume.fileName}</p>
                      <p className="text-xs text-slate-400">
                        Uploaded on {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Extracted Skills */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Extracted Resume Skills ({resume.extractedSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.extractedSkills.map((s, idx) => (
                      <span key={idx} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resume Version History */}
                {resumeHistory.length > 1 && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Resume Revision History ({resumeHistory.length} uploads)
                    </h4>
                    <div className="space-y-2">
                      {resumeHistory.map((rh) => (
                        <div key={rh.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-700">
                            v{rh.version}: {rh.fileName}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-blue-600">ATS: {rh.atsScore}%</span>
                            <span className="text-slate-400">{new Date(rh.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: APPLICATION HISTORY */}
      {activeTab === 'applications' && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Candidate Application History</h3>
              <p className="text-xs text-slate-400">All job applications and recruiting pipeline milestones</p>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl">
              <Briefcase className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">No applications recorded for this candidate.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map((app) => (
                <div key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{app.jobTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {app.company} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.matchScore > 0 && (
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
                        {app.matchScore}% Match
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recruiter Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Update Candidate Status</h3>
                <p className="text-xs text-slate-400">
                  Candidate: <strong className="text-slate-700">{candidate.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowActionModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Select Status:
                </label>
                <select
                  value={selectedActionStatus}
                  onChange={(e) => setSelectedActionStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Screening">Screening</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Move to Interview</option>
                  <option value="Selected">Selected</option>
                  <option value="Hired">Hire</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                  Recruiter Note (Optional):
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Add interview feedback, notes, or next steps..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={submitRecruiterAction}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Confirm Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreMetricCard({ label, score, tone = 'blue', isPrimary = false }) {
  const tones = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    teal: 'text-teal-600 bg-teal-50 border-teal-100',
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition-shadow hover:shadow-md ${
        isPrimary ? 'border-blue-300 bg-blue-50/40' : 'border-slate-100 bg-white'
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-slate-800">{score ?? 0}</span>
        <span className="text-xs font-semibold text-slate-400">%</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${tones[tone]}`}
          style={{ width: `${Math.max(0, Math.min(100, score || 0))}%` }}
        />
      </div>
    </div>
  )
}

export default CandidateIntelligence