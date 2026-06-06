import { useContext, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Layout from '../components/Layout'
import StatCard from '../components/ui/StatCard'
import SectionCard from '../components/ui/SectionCard'
import { StatCardSkeleton, ChartSkeleton, ListSkeleton } from '../components/ui/Skeleton'
import axios from 'axios'
import {
  FileText,
  TrendingUp,
  Award,
  Briefcase,
  UploadCloud,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  MessageSquare,
  ChevronRight,
  Brain,
  ThumbsUp,
  ArrowUpRight
} from 'lucide-react'

// Fallback data for demonstration when API is unavailable
const MOCK_RESUMES = [
  { filename: 'CV_Senior_React_Developer.pdf', atsScore: 92, createdAt: '2026-05-28T14:32:00Z', extractedSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB'] },
  { filename: 'Resume_Technical_Product_Manager.docx', atsScore: 78, createdAt: '2026-05-27T09:15:00Z', extractedSkills: ['Product Strategy', 'Agile', 'Jira', 'SQL'] },
  { filename: 'Data_Scientist_Profile.pdf', atsScore: 88, createdAt: '2026-05-26T18:45:00Z', extractedSkills: ['Python', 'PyTorch', 'SQL', 'Data Pipelines'] },
  { filename: 'UX_UI_Designer_Portfolio.pdf', atsScore: 84, createdAt: '2026-05-25T11:20:00Z', extractedSkills: ['Figma', 'User Research', 'Wireframing', 'CSS'] }
]

const MOCK_JOBS = [
  { title: 'Frontend Developer', company: 'TechCorp', description: 'React, Tailwind, Vite Developer' },
  { title: 'Backend Engineer', company: 'DevStudio', description: 'NodeJS, Express, MongoDB Engineer' },
  { title: 'AI Researcher', company: 'BrainLabs', description: 'Python, PyTorch, LLMs expert' }
]

const MOCK_CANDIDATES = [
  { name: 'Sandesh Pradhani', score: 92, skills: ['Python', 'React', 'MongoDB'] },
  { name: 'Rahul Sharma', score: 84, skills: ['Java', 'NodeJS', 'Express'] },
  { name: 'Aarav Mehta', score: 89, skills: ['Python', 'PyTorch', 'AWS'] }
]

const MOCK_FEEDBACKS = [
  { message: 'The resume parsing was extremely accurate and fast!', rating: 5, _id: 'fb1' },
  { message: 'Loved the skills extraction feature. Made filtering very easy.', rating: 4, _id: 'fb2' }
]

function Dashboard() {
  const { user } = useContext(AuthContext)
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Format current date
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [])

  // Personalized Greeting
  const greeting = useMemo(() => {
    if (!user?.name) return 'Welcome Back'
    const hour = new Date().getHours()
    const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
    return `${prefix}, ${user.name.split(' ')[0]}`
  }, [user?.name])

  // Fetch Dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const [historyRes, jobsRes, feedbackRes] = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_API_URL}/api/ai/history`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/all`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/feedback`, { headers })
        ])

        if (historyRes.status === 'fulfilled') setResumes(historyRes.value.data || [])
        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value.data || [])
        if (feedbackRes.status === 'fulfilled') setFeedbacks(feedbackRes.value.data || [])

        // Set error only if all requests failed
        if (historyRes.status === 'rejected' && jobsRes.status === 'rejected' && feedbackRes.status === 'rejected') {
          setError('Unable to connect to server. Showing sample data.')
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Compute derived data (only when real data changes)
  const activeResumes = resumes.length > 0 ? resumes : MOCK_RESUMES
  const activeJobs = jobs.length > 0 ? jobs : MOCK_JOBS
  const activeFeedbacks = feedbacks.length > 0 ? feedbacks : MOCK_FEEDBACKS
  const activeCandidates = MOCK_CANDIDATES

  const totalResumesCount = activeResumes.length

  const avgAtsScore = useMemo(() => {
    if (activeResumes.length === 0) return 0
    const total = activeResumes.reduce((acc, curr) => {
      const score = typeof curr.atsScore === 'number'
        ? curr.atsScore
        : parseInt(curr.atsScore) || 0
      return acc + score
    }, 0)
    return Math.round(total / activeResumes.length)
  }, [activeResumes])

  const candidatesRankedCount = activeCandidates.length + (resumes.length > 0 ? resumes.filter(r => r.atsScore >= 75).length : 2)

  const activeJobsCount = activeJobs.length

  // Top skills extraction
  const topSkills = useMemo(() => {
    const counts = {}
    activeResumes.forEach(r => {
      if (r.extractedSkills && Array.isArray(r.extractedSkills)) {
        r.extractedSkills.forEach(skill => {
          const s = skill.trim()
          counts[s] = (counts[s] || 0) + 1
        })
      }
    })

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    if (sorted.length === 0) {
      return [
        { name: 'React', count: 8 },
        { name: 'Python', count: 6 },
        { name: 'Node.js', count: 5 },
        { name: 'MongoDB', count: 4 },
        { name: 'TypeScript', count: 3 }
      ]
    }
    return sorted
  }, [activeResumes])

  // Chart data for ATS score trend
  const chartPoints = useMemo(() => {
    const scores = activeResumes.slice(0, 6).map(r => r.atsScore).reverse()
    while (scores.length < 6) {
      scores.unshift(70 + Math.floor(Math.random() * 20))
    }
    return scores
  }, [activeResumes])

  const chartSVGPath = useMemo(() => {
    const xCoords = [40, 120, 200, 280, 360, 440]
    const points = chartPoints.map((score, idx) => {
      const x = xCoords[idx]
      const y = 160 - (score * 1.2)
      return { x, y }
    })

    let linePath = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x},${points[i].y}`
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x},170 L ${points[0].x},170 Z`
    return { linePath, areaPath, points }
  }, [chartPoints])

  return (
    <Layout>
      <main className="space-y-8 animate-fade-in pb-12">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mb-16 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold tracking-wider uppercase mb-1">
                <Sparkles className="h-4 w-4 animate-spin-slow" />
                IntelliHire AI Platform
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {greeting}
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base md:text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                {currentDate}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/resume-upload"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 active:scale-[0.98]"
              >
                <UploadCloud className="h-4.5 w-4.5" />
                Upload Resume
              </Link>
              <Link
                to="/jobs"
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold px-5 py-3 rounded-2xl transition-all duration-200 active:scale-[0.98]"
              >
                <Plus className="h-4.5 w-4.5" />
                New Job Role
              </Link>
            </div>
          </div>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm font-medium flex items-center gap-2">
            <span className="text-amber-500 text-lg">&#9888;</span>
            {error}
          </div>
        )}

        {/* KPI CARDS SECTION */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Key Performance Indicators">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="Resumes Analyzed"
                value={totalResumesCount}
                icon={FileText}
                iconColor="blue"
                trend="+18%"
                trendLabel="from last week"
                trendColor="emerald"
              />
              <StatCard
                label="Avg ATS Score"
                value={`${avgAtsScore}%`}
                icon={TrendingUp}
                iconColor="indigo"
                trend="+2.4%"
                trendLabel="vs last month"
                trendColor="emerald"
              />
              <StatCard
                label="Candidates Ranked"
                value={candidatesRankedCount}
                icon={Award}
                iconColor="violet"
                trend="Stable"
                trendLabel="recruitment active"
                trendColor="violet"
              />
              <StatCard
                label="Active Jobs"
                value={activeJobsCount}
                icon={Briefcase}
                iconColor="emerald"
                trend={activeJobsCount > 1 ? `${activeJobsCount - 1} high-priority` : 'All roles active'}
                trendColor="amber"
              />
            </>
          )}
        </section>

        {/* ANALYTICS SECTION */}
        <section className="grid lg:grid-cols-2 gap-8">
          {/* ATS Score Trend */}
          <SectionCard
            title="ATS Score Trend"
            subtitle="Chronological analysis of recently parsed resumes"
            action={
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                L6 Resumes
              </span>
            }
          >
            {loading ? (
              <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
            ) : (
              <div className="relative h-48 w-full mt-4 flex items-end">
                <svg viewBox="0 0 480 180" className="w-full h-full" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  <line x1="30" y1="160" x2="450" y2="160" stroke="#f1f5f9" strokeWidth="1.5" />
                  <line x1="30" y1="112" x2="450" y2="112" stroke="#f1f5f9" strokeWidth="1.5" />
                  <line x1="30" y1="64" x2="450" y2="64" stroke="#f1f5f9" strokeWidth="1.5" />
                  <line x1="30" y1="16" x2="450" y2="16" stroke="#f1f5f9" strokeWidth="1.5" />

                  <text x="15" y="163" fill="#94a3b8" fontSize="10" textAnchor="end">0</text>
                  <text x="15" y="115" fill="#94a3b8" fontSize="10" textAnchor="end">40</text>
                  <text x="15" y="67" fill="#94a3b8" fontSize="10" textAnchor="end">80</text>
                  <text x="15" y="19" fill="#94a3b8" fontSize="10" textAnchor="end">100</text>

                  <path d={chartSVGPath.areaPath} fill="url(#chartAreaGradient)" />
                  <path
                    d={chartSVGPath.linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {chartSVGPath.points.map((pt, idx) => (
                    <g key={idx} className="group/dot cursor-pointer">
                      <circle cx={pt.x} cy={pt.y} r="7" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" className="transition-all duration-200 hover:r-8 hover:fill-blue-600" />
                      <circle cx={pt.x} cy={pt.y} r="12" fill="#3b82f6" fillOpacity="0" className="transition-all duration-200 hover:fill-opacity-10" />
                      <text x={pt.x} y={pt.y - 12} fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle"
                        className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200">
                        {chartPoints[idx]}
                      </text>
                    </g>
                  ))}

                  {['R6', 'R5', 'R4', 'R3', 'R2', 'R1'].map((lbl, idx) => (
                    <text key={lbl} x={chartSVGPath.points[idx].x} y="178" fill="#64748b" fontSize="10.5" fontWeight="500" textAnchor="middle">
                      {lbl}
                    </text>
                  ))}
                </svg>
              </div>
            )}
          </SectionCard>

          {/* Skills Distribution */}
          <SectionCard
            title="Candidate Skills Distribution"
            subtitle="Most frequent technologies extracted from applicant pool"
            action={
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Top Skills
              </span>
            }
          >
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                      <div className="h-4 bg-slate-200 rounded w-16" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4.5 mt-4">
                {topSkills.map((skill, index) => {
                  const maxCount = Math.max(...topSkills.map(s => s.count)) || 1
                  const percent = (skill.count / maxCount) * 100

                  const colors = [
                    'from-blue-500 to-indigo-600',
                    'from-emerald-500 to-teal-600',
                    'from-violet-500 to-purple-600',
                    'from-sky-400 to-blue-500',
                    'from-amber-400 to-orange-500'
                  ]

                  return (
                    <div key={skill.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-slate-700 font-semibold">{skill.name}</span>
                        <span className="text-slate-500 text-xs bg-slate-50 px-2 py-0.5 rounded-md font-semibold border border-slate-100">
                          {skill.count} {skill.count === 1 ? 'applicant' : 'applicants'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${colors[index % colors.length]} h-full rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </section>

        {/* ACTIVITY & AI INSIGHTS GRID */}
        <section className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Recent Activities */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Applicant Log</h3>
                <p className="text-xs text-slate-400">Real-time status tracking of actions, resumes and evaluations</p>
              </div>
              <Link
                to="/resume-history"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                View all log
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <ListSkeleton rows={3} />
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Recent Resume Evaluations
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {activeResumes.slice(0, 3).length === 0 ? (
                      <p className="text-sm text-slate-400 py-4 text-center">No resumes evaluated yet.</p>
                    ) : (
                      activeResumes.slice(0, 3).map((res, index) => {
                        const score = typeof res.atsScore === 'number' ? res.atsScore : parseInt(res.atsScore) || 0
                        const scoreColor = score >= 85 ? 'text-emerald-600 bg-emerald-50' : score >= 70 ? 'text-blue-600 bg-blue-50' : 'text-slate-500 bg-slate-100'

                        return (
                          <div key={index} className="py-3 flex justify-between items-center first:pt-0 last:pb-0 hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                                <FileText className="h-4.5 w-4.5" />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                  {res.filename}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                  <span>Candidate Application</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor}`}>
                                {score} ATS
                              </span>
                              <Link to="/resume-history" className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Ranked Candidates
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {activeCandidates.map((c, index) => (
                      <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {c.skills.slice(0, 2).map(s => (
                              <span key={s} className="text-[10px] font-semibold bg-white border border-slate-200/80 text-slate-500 px-1.5 py-0.5 rounded-md">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center border-t border-slate-200/60 pt-2">
                          <span className="text-[10px] font-medium text-slate-400">Match Rank</span>
                          <span className="text-xs font-extrabold text-blue-600">{c.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Insights & Feedback */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* AI Insights Panel */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-950 p-6 rounded-3xl text-white shadow-lg space-y-4.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/10">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">AI Insights & Suggestions</h3>
                  <span className="text-[10px] font-semibold text-blue-300 tracking-wide uppercase">Powered by IntelliHire Engine</span>
                </div>
              </div>

              <div className="space-y-3.5 mt-3 text-xs text-slate-300 leading-relaxed font-medium">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-2.5">
                  <div className="h-5 w-5 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">1</div>
                  <p>
                    <strong>Avg ATS Match</strong> increased by <strong>4.2%</strong> this week. Candidates with <strong>Python</strong> and <strong>NodeJS</strong> exhibit high resume scoring alignment.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-start gap-2.5">
                  <div className="h-5 w-5 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">2</div>
                  <p>
                    <strong>Candidate Suggestion:</strong> Aarav Mehta shows a high 89% score with strong compatibility in backend engineering skills. Recommendation: Proceed to screen.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Feedbacks */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">User Feedbacks</h3>
                  <p className="text-[11px] text-slate-400">Recent experience reports and platform ratings</p>
                </div>
                <Link to="/feedback" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline">
                  Feedback Page
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {activeFeedbacks.slice(0, 2).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">No feedback available yet.</p>
                ) : (
                  activeFeedbacks.slice(0, 2).map((fb, index) => (
                    <div key={index} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">Platform Evaluator</span>
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{fb.rating || 5}/5</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 italic font-medium leading-relaxed truncate-2-lines">
                        &ldquo;{fb.message || 'No description added.'}&rdquo;
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default Dashboard