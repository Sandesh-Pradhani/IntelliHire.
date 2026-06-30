import { useState, useEffect } from 'react'
import axios from 'axios'
import { Brain, TrendingUp, Award, Lightbulb, Sparkles, ChevronDown, ChevronUp, Target, BookOpen, Route } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function CareerInsights() {
    const [resumes, setResumes] = useState([])
    const [selectedResume, setSelectedResume] = useState('')
    const [skills, setSkills] = useState([])
    const [experienceYears, setExperienceYears] = useState('')
    const [insights, setInsights] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showRoles, setShowRoles] = useState(true)
    const [showSkillsToDevelop, setShowSkillsToDevelop] = useState(true)
    const [showProgression, setShowProgression] = useState(true)

    useEffect(() => {
        fetchResumes()
    }, [])

    const fetchResumes = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(
                `${API_BASE}/api/resumes/all`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setResumes(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const handleResumeSelect = (resumeId) => {
        setSelectedResume(resumeId)
        const resume = resumes.find(r => String(r._id) === String(resumeId))
        if (resume && resume.extractedSkills) {
            setSkills(resume.extractedSkills)
        }
    }

    const generateInsights = async () => {
        if (skills.length === 0) {
            setError('Please select a resume with skills or enter skills manually')
            return
        }

        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('token')

            const response = await axios.post(
                `${API_BASE}/api/ai/insights/career-recommendation`,
                {
                    skills,
                    experience_years: experienceYears ? parseFloat(experienceYears) : null,
                    interests: [],
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            const data = response.data.data || response.data
            setInsights(data)
        } catch (err) {
            console.error(err)
            setError('Failed to generate career insights. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const getMatchColor = (pct) => {
        if (pct >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
        if (pct >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
        if (pct >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
        return 'text-slate-500 bg-slate-50 border-slate-200'
    }

    return (
        <div className="animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Brain className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Career Insights</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Get AI-powered career recommendations based on your skills</p>
                </div>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Resume Select */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 block">Select Resume</label>
                        <select
                            value={selectedResume}
                            onChange={(e) => handleResumeSelect(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                        >
                            <option value="">Choose a resume...</option>
                            {resumes.map((r) => (
                                <option key={r._id} value={r._id}>{r.fileName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Experience Years */}
                    <div>
                        <label className="text-sm font-bold text-slate-700 mb-3 block">Years of Experience (optional)</label>
                        <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            placeholder="e.g. 3"
                            className="w-full border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                        />
                    </div>
                </div>

                {/* Skills Display */}
                {skills.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-semibold text-slate-700">Your Skills ({skills.length})</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map((s, i) => (
                                <span key={i} className="bg-white text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-lg">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={generateInsights}
                    disabled={loading || skills.length === 0}
                    className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generating AI Insights...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5" />
                            Generate Career Insights
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {insights && (
                <div className="space-y-6">
                    {/* Recommended Roles */}
                    {insights.recommended_roles && insights.recommended_roles.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <button
                                onClick={() => setShowRoles(!showRoles)}
                                className="w-full flex items-center justify-between mb-4"
                            >
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-lg font-bold text-slate-800">Recommended Roles</h2>
                                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                        {insights.recommended_roles.length}
                                    </span>
                                </div>
                                {showRoles ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </button>

                            {showRoles && (
                                <div className="space-y-3">
                                    {insights.recommended_roles.map((role, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{role.role}</p>
                                                {role.matching_skills && role.matching_skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {role.matching_skills.map((s, j) => (
                                                            <span key={j} className="bg-blue-100 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-lg">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-lg font-extrabold px-3 py-1.5 rounded-xl border ${getMatchColor(role.match_percentage || 0)}`}>
                                                {role.match_percentage || 0}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skills to Develop */}
                    {insights.skills_to_develop && insights.skills_to_develop.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                            <button
                                onClick={() => setShowSkillsToDevelop(!showSkillsToDevelop)}
                                className="w-full flex items-center justify-between mb-4"
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-amber-500" />
                                    <h2 className="text-lg font-bold text-slate-800">Skills to Develop</h2>
                                </div>
                                {showSkillsToDevelop ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </button>

                            {showSkillsToDevelop && (
                                <div className="space-y-3">
                                    {insights.skills_to_develop.map((skill, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
                                            <div className="h-6 w-6 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{skill.skill}</p>
                                                <p className="text-xs text-slate-500">{skill.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Career Progression */}
                    {insights.career_progression && insights.career_progression.length > 0 && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6">
                            <button
                                onClick={() => setShowProgression(!showProgression)}
                                className="w-full flex items-center justify-between mb-4"
                            >
                                <div className="flex items-center gap-2">
                                    <Route className="h-5 w-5 text-emerald-600" />
                                    <h2 className="text-lg font-bold text-slate-800">Career Progression</h2>
                                </div>
                                {showProgression ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                            </button>

                            {showProgression && (
                                <div className="space-y-3">
                                    {insights.career_progression.map((step, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="h-7 w-7 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                    {i + 1}
                                                </div>
                                                {i < insights.career_progression.length - 1 && (
                                                    <div className="w-0.5 h-full bg-emerald-200 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 pt-1">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!insights && skills.length === 0 && !loading && (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lightbulb className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600">No insights yet</h3>
                    <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                        Select a resume and click "Generate Career Insights" to get AI-powered role recommendations.
                    </p>
                </div>
            )}
        </div>
    )
}

export default CareerInsights