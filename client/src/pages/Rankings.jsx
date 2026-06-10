import { useState, useEffect } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'
import Skeleton from '../components/ui/Skeleton'

import { Award, Users, TrendingUp, Medal, Sparkles } from 'lucide-react'

const RANK_MEDALS = ['text-yellow-500', 'text-slate-400', 'text-amber-700']

function Rankings() {
    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [source, setSource] = useState('')

    const fetchRankings = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const headers = { Authorization: `Bearer ${token}` }

            // Try fetching from applications first (sorted by matchScore)
            const appsRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/applications`,
                { headers }
            )

            const apps = appsRes.data || []

            if (apps.length > 0) {
                // Sort by matchScore descending and map to ranking format
                const ranked = apps
                    .filter(app => app.matchScore > 0 || app.atsScore > 0)
                    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
                    .map((app, index) => ({
                        _id: app._id,
                        rank: index + 1,
                        candidateName: app.candidateName || app.candidate?.name || 'Unknown',
                        candidateId: app.candidate?._id || app.candidate,
                        jobTitle: app.jobTitle || app.job?.title || 'Unknown',
                        score: app.matchScore || 0,
                        atsScore: app.atsScore || 0,
                        matchedSkills: app.matchedSkills || [],
                        missingSkills: app.missingSkills || [],
                        status: app.status,
                        applicationId: app._id
                    }))

                setCandidates(ranked)
                setSource('applications')
            } else {
                // Fallback to AI rankings if no applications exist
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/ai/rankings`,
                    { headers }
                )

                const data = response.data || []
                const ranked = data.map((c, index) => ({
                    ...c,
                    rank: index + 1
                }))

                setCandidates(ranked)
                setSource('ai')
            }
        } catch (err) {
            console.log('Rankings API error:', err)
            setError('Unable to load rankings. Please ensure the server is running.')
            setCandidates([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRankings()
    }, [])

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600'
        if (score >= 60) return 'text-blue-600'
        if (score >= 40) return 'text-amber-600'
        return 'text-slate-500'
    }

    const getBadgeColor = (score) => {
        if (score >= 80) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
        if (score >= 60) return 'bg-blue-100 text-blue-700 border-blue-200'
        if (score >= 40) return 'bg-amber-100 text-amber-700 border-amber-200'
        return 'bg-slate-100 text-slate-500 border-slate-200'
    }

    return (
        <Layout>
            <div className="pb-12 space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                            <Award className="h-8 w-8 text-blue-600" />
                            Candidate Rankings
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Ranked by AI match score — from highest to lowest compatibility.
                        </p>
                    </div>
                    <button
                        onClick={fetchRankings}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-colors"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Refresh Rankings
                    </button>
                </div>

                {source && candidates.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        Ranked from {source === 'applications' ? 'application database' : 'AI engine'} — {candidates.length} candidates
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-3">
                                        <Skeleton width="200px" height="24px" />
                                        <div className="flex gap-2">
                                            {[...Array(3)].map((_, j) => (
                                                <Skeleton key={j} width="80px" height="28px" />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right space-y-2">
                                        <Skeleton width="60px" height="40px" />
                                        <Skeleton width="80px" height="12px" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : candidates.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600">No candidates ranked yet</h3>
                            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                                Upload resumes, create jobs, and run AI Job Matching to see ranked candidates here.
                            </p>
                        </div>
                    ) : (
                        candidates.map((candidate, index) => {
                            const name = candidate.candidateName || candidate.name || 'Unknown'
                            const jobInfo = candidate.jobTitle ? `for ${candidate.jobTitle}` : ''
                            const score = candidate.score || 0
                            const skills = candidate.matchedSkills || candidate.skills || []

                            return (
                                <div
                                    key={candidate._id || index}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        {/* Left: Rank + Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                {/* Rank Badge */}
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-extrabold text-sm ${
                                                    index === 0
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : index === 1
                                                        ? 'bg-slate-100 text-slate-500'
                                                        : index === 2
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                    {index === 0 ? (
                                                        <Medal className="h-5 w-5" />
                                                    ) : (
                                                        `#${index + 1}`
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <h2 className="text-lg font-bold text-slate-800 truncate">
                                                        {name}
                                                    </h2>
                                                    {jobInfo && (
                                                        <p className="text-xs text-slate-400 truncate">{jobInfo}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Skills */}
                                            {skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 ml-[52px]">
                                                    {skills.slice(0, 6).map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg text-xs font-medium"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {skills.length > 6 && (
                                                        <span className="text-xs text-slate-400 font-medium px-2 py-1">
                                                            +{skills.length - 6} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            {candidate.status && (
                                                <div className="mt-3 ml-[52px]">
                                                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                                        {candidate.status}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Score */}
                                        <div className="text-center shrink-0">
                                            <div className={`text-4xl font-extrabold ${getScoreColor(score)}`}>
                                                {score}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 font-medium">Match Score</p>
                                            {candidate.atsScore > 0 && (
                                                <span className={`inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getBadgeColor(candidate.atsScore)}`}>
                                                    ATS: {candidate.atsScore}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default Rankings