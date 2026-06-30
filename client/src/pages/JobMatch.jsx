import { useState, useEffect } from 'react'
import axios from 'axios'

import MatchCard from '../components/MatchCard'
import SkillGapCard from '../components/SkillGapCard'
import { Brain, TrendingUp, BarChart3, Lightbulb, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

function JobMatch() {

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
        fetchJobs()
        fetchResumes()
    }, [])

    const fetchResumes = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${API_URL}/api/resumes/all`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )
            setResumes(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const fetchJobs = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/jobs/all`)
            setJobs(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const handleJobChange = (e) => {
        const jobId = e.target.value
        setSelectedJob(jobId)
        const selected = jobs.find((job) => String(job._id) === String(jobId))
        if (selected) {
            setJobText(selected.description)
        }
    }

    const runMatching = async () => {
        try {
            const token = localStorage.getItem('token')
            setLoading(true)
            setError('')
            setShowSemanticDetails(false)
            setShowSkillGapDetails(false)
            setShowRankingDetails(false)

            const response = await axios.post(
                `${API_URL}/api/recruiter/match`,
                {
                    jobId: selectedJob,
                    resumeId: selectedResume,
                    job: jobText,
                    resume: resumeText
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            setResult(response.data)
        } catch (error) {
            console.log(error)
            setError(error?.response?.data?.message || 'Matching Failed')
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
        <div className="animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Brain className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">AI Job Matching</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Select a job and compare it against a resume for AI-powered analysis</p>
                </div>
            </div>

            {/* Selection Cards */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <label className="text-sm font-bold text-slate-700 mb-3 block">Select Job</label>
                    <select
                        value={selectedJob}
                        onChange={handleJobChange}
                        className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    >
                        <option value="">Select a job...</option>
                        {jobs.map((job) => (
                            <option key={job._id} value={job._id}>{job.title}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <label className="text-sm font-bold text-slate-700 mb-3 block">Select Resume</label>
                    <select
                        value={selectedResume}
                        onChange={(e) => {
                            const resumeId = e.target.value
                            setSelectedResume(resumeId)
                            const resume = resumes.find(r => String(r._id) === String(resumeId))
                            if (resume) {
                                setResumeText(resume.extractedSkills.join(', '))
                            }
                        }}
                        className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    >
                        <option value="">Select a resume...</option>
                        {resumes.map((resume) => (
                            <option key={resume._id} value={resume._id}>{resume.fileName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Text Comparison */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-base font-bold text-slate-800 mb-3">Job Description</h2>
                    <textarea rows="10" value={jobText} readOnly className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-600 bg-slate-50" />
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-base font-bold text-slate-800 mb-3">Candidate Skills</h2>
                    <textarea rows="10" value={resumeText} readOnly className="w-full border border-slate-200 rounded-xl p-4 text-sm text-slate-600 bg-slate-50" />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Analyze Button */}
            <button
                onClick={runMatching}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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

            {/* Results */}
            {result && (
                <div className="mt-10 space-y-6">
                    {/* Basic Match Scores */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <MatchCard similarity={result.similarity} finalScore={result.finalScore} />
                        <SkillGapCard matchedSkills={result.matchedSkills || []} missingSkills={result.missingSkills || []} />
                    </div>

                    {/* Phase 3: Semantic Match Details */}
                    {result.semantic_match && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <button
                                onClick={() => setShowSemanticDetails(!showSemanticDetails)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-500" />
                                    <h3 className="text-lg font-bold text-slate-800">Semantic Match (SBERT)</h3>
                                    <span className={`text-sm font-bold ml-2 ${getScoreColor(result.semantic_match.match_percentage || 0)}`}>
                                        {result.semantic_match.match_percentage || 0}%
                                    </span>
                                </div>
                                {showSemanticDetails ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </button>

                            {showSemanticDetails && (
                                <div className="mt-4 space-y-4">
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(result.semantic_match.match_percentage || 0)}`}
                                            style={{ width: `${result.semantic_match.match_percentage || 0}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">Model: {result.semantic_match.model_used || 'N/A'}</p>
                                    {result.semantic_match.reasons && result.semantic_match.reasons.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 mb-2">Match Analysis:</p>
                                            <ul className="space-y-2">
                                                {result.semantic_match.reasons.map((reason, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <span className="h-5 w-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                                                        {reason}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phase 3: Enhanced Skill Gap Analysis */}
                    {result.skill_gap_analysis && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <button
                                onClick={() => setShowSkillGapDetails(!showSkillGapDetails)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-amber-500" />
                                    <h3 className="text-lg font-bold text-slate-800">Skill Gap Analysis</h3>
                                    <span className={`text-sm font-bold ml-2 ${getScoreColor(result.skill_gap_analysis.match_percentage || 0)}`}>
                                        {result.skill_gap_analysis.match_percentage || 0}% match
                                    </span>
                                </div>
                                {showSkillGapDetails ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </button>

                            {showSkillGapDetails && (
                                <div className="mt-4 space-y-6">
                                    {/* Missing Skills Difficulty */}
                                    {result.skill_gap_analysis.missing_difficulty && (
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 mb-3">Missing Skills by Difficulty:</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['beginner', 'intermediate', 'advanced'].map((level) => {
                                                    const data = result.skill_gap_analysis.missing_difficulty[level]
                                                    return data && data.count > 0 ? (
                                                        <div key={level} className="p-3 bg-slate-50 rounded-xl text-center">
                                                            <p className="text-lg font-extrabold text-slate-700">{data.count}</p>
                                                            <p className="text-xs text-slate-400 capitalize">{level}</p>
                                                        </div>
                                                    ) : null
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommended Skills */}
                                    {result.skill_gap_analysis.recommended_skills && result.skill_gap_analysis.recommended_skills.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 mb-3">Recommended Skills to Learn:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.skill_gap_analysis.recommended_skills.map((rec, i) => (
                                                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs">
                                                        <span className="font-semibold text-amber-800">{rec.skill}</span>
                                                        <span className="text-amber-500 ml-1">({rec.difficulty})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Learning Roadmap */}
                                    {result.skill_gap_analysis.roadmap && result.skill_gap_analysis.roadmap.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 mb-3">Learning Roadmap:</p>
                                            <div className="space-y-2">
                                                {result.skill_gap_analysis.roadmap.map((step, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                        <span className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-slate-700">{step.skill}</p>
                                                            <p className="text-xs text-slate-400">{step.difficulty} · {step.estimated_time} · {step.priority} priority</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phase 3: Unified Ranking */}
                    {result.unified_ranking && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <button
                                onClick={() => setShowRankingDetails(!showRankingDetails)}
                                className="w-full flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                    <h3 className="text-lg font-bold text-slate-800">Unified Ranking Score</h3>
                                    <span className={`text-lg font-extrabold ml-2 ${getScoreColor(result.unified_ranking.overall || 0)}`}>
                                        {result.unified_ranking.overall || 0}
                                    </span>
                                </div>
                                {showRankingDetails ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </button>

                            {showRankingDetails && result.unified_ranking.breakdown && (
                                <div className="mt-4 space-y-4">
                                    {Object.entries(result.unified_ranking.breakdown).map(([key, data]) => (
                                        <div key={key}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-semibold text-slate-700 capitalize">{key}</span>
                                                <span className="text-xs text-slate-400">
                                                    {data.score?.toFixed?.(0) || data.score || 0} pts × {((data.weight || 0) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${getProgressColor(data.score || 0)}`}
                                                    style={{ width: `${(data.weighted || 0) * 3}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default JobMatch