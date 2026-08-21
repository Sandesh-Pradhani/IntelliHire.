import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight,
  Award,
  Filter,
  Medal,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import Skeleton from '../components/ui/Skeleton'
import { normalizeArray } from '../utils/apiNormalizer'
import ROUTES from '../constants/routes'

function getRecommendation(score) {
  if (score >= 90) return { label: 'Strongly Recommended', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  if (score >= 80) return { label: 'Recommended', color: 'bg-blue-100 text-blue-800 border-blue-200' }
  if (score >= 70) return { label: 'Consider', color: 'bg-amber-100 text-amber-800 border-amber-200' }
  if (score >= 60) return { label: 'Needs Review', color: 'bg-orange-100 text-orange-800 border-orange-200' }
  return { label: 'Low Match', color: 'bg-red-100 text-red-800 border-red-200' }
}

function Rankings({ view = 'rankings' }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')

  // Filters and Sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [recommendationFilter, setRecommendationFilter] = useState('All')
  const [sortBy, setSortBy] = useState('score') // 'score' | 'ats' | 'name'

  useEffect(() => {
    fetchRankings()
  }, [])

  async function fetchRankings() {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const applicationsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/applications/recruiter`,
        { headers }
      )
      const applications = normalizeArray(applicationsResponse.data)

      if (applications.length > 0) {
        const rankedApplications = applications
          .map((application) => {
            const score = application.matchScore || application.atsScore || 0
            const candidateId = application.candidateId?._id || application.candidateId || application.candidate?._id
            const jobId = application.jobId?._id || application.jobId

            return {
              _id: application._id,
              candidateId: String(candidateId || application._id),
              jobId: jobId ? String(jobId) : '',
              candidateName: application.candidateName || application.candidate?.name || 'Unknown Candidate',
              candidateEmail: application.candidateEmail || application.candidate?.email || '',
              jobTitle: application.jobTitle || application.jobId?.title || application.job?.title || 'Unknown Position',
              score,
              atsScore: application.atsScore || 0,
              matchScore: application.matchScore || score,
              skills: Array.isArray(application.matchedSkills) ? application.matchedSkills : [],
              status: application.status || 'Applied',
              recommendation: getRecommendation(score),
            }
          })
          .sort((left, right) => (right.score || 0) - (left.score || 0))
          .map((item, index) => ({ ...item, rank: index + 1 }))

        setCandidates(rankedApplications)
        setSource('applications')
      } else {
        const rankingsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/rankings`,
          { headers }
        )
        const parsed = normalizeArray(rankingsResponse.data).map((candidate, index) => {
          const score = candidate.score || candidate.matchScore || 0
          return {
            ...candidate,
            candidateId: String(candidate.candidateId || candidate._id || ''),
            rank: index + 1,
            score,
            atsScore: candidate.atsScore || 0,
            matchScore: score,
            skills: normalizeArray(candidate.skills || candidate.matchedSkills),
            status: 'Applied',
            recommendation: getRecommendation(score),
          }
        })
        setCandidates(parsed)
        setSource('ai')
      }
    } catch (requestError) {
      console.log('Rankings API error:', requestError)
      setError('Unable to load rankings. Please ensure the server is running.')
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

  // Filter & Sort candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => {
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          const nameMatches = (candidate.candidateName || '').toLowerCase().includes(query)
          const jobMatches = (candidate.jobTitle || '').toLowerCase().includes(query)
          const skillMatches = (candidate.skills || []).some((s) => s.toLowerCase().includes(query))
          if (!nameMatches && !jobMatches && !skillMatches) return false
        }

        // Status filter
        if (statusFilter !== 'All' && candidate.status !== statusFilter) {
          return false
        }

        // Recommendation filter
        if (recommendationFilter !== 'All' && candidate.recommendation?.label !== recommendationFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'score') return (b.score || 0) - (a.score || 0)
        if (sortBy === 'ats') return (b.atsScore || 0) - (a.atsScore || 0)
        if (sortBy === 'name') return (a.candidateName || '').localeCompare(b.candidateName || '')
        return 0
      })
  }, [candidates, searchQuery, statusFilter, recommendationFilter, sortBy])

  const heading = view === 'candidates' ? 'Candidates' : 'Candidate Rankings & Intelligence'
  const description = view === 'candidates'
    ? 'Candidate records collected from applications, portfolios, and AI scoring.'
    : 'Ranked by AI match score with unified candidate intelligence and evidence.'

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl sm:text-4xl font-extrabold text-slate-800">
            <Award className="h-8 w-8 text-blue-600" />
            {heading}
          </h1>
          <p className="mt-2 text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={fetchRankings}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 w-fit"
        >
          <TrendingUp className="h-4 w-4" />
          Refresh Rankings
        </button>
      </div>

      {source && candidates.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Ranked from {source === 'applications' ? 'application intelligence database' : 'FastAPI AI engine'} · {candidates.length} total candidates
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, job, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Selected">Selected</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Recommendation Filter */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <select
            value={recommendationFilter}
            onChange={(e) => setRecommendationFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="All">All Recommendations</option>
            <option value="Strongly Recommended">Strongly Recommended</option>
            <option value="Recommended">Recommended</option>
            <option value="Consider">Consider</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Low Match">Low Match</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="score">Sort by Final AI Score</option>
            <option value="ats">Sort by ATS Score</option>
            <option value="name">Sort by Candidate Name</option>
          </select>
        </div>
      </div>

      {/* Candidate List Cards */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton width="220px" height="24px" />
                  <div className="flex gap-2">
                    {[...Array(3)].map((__, skillIndex) => (
                      <Skeleton key={skillIndex} width="80px" height="28px" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton width="70px" height="40px" />
                  <Skeleton width="100px" height="14px" />
                </div>
              </div>
            </div>
          ))
        ) : filteredCandidates.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-600">No candidates match the filter</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Try adjusting your search query, status, or recommendation filters.
            </p>
          </div>
        ) : (
          filteredCandidates.map((candidate, index) => {
            const intelligenceUrl = `/recruiter/candidates/${candidate.candidateId}/intelligence${
              candidate.jobId ? `?jobId=${candidate.jobId}` : ''
            }`

            return (
              <div
                key={candidate._id || index}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-100"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Candidate Info & Skills */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                              ? 'bg-slate-100 text-slate-600'
                              : index === 2
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {index === 0 ? <Medal className="h-5 w-5" /> : `#${index + 1}`}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-bold text-slate-800">
                            {candidate.candidateName || 'Unknown Candidate'}
                          </h2>
                          <span
                            className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold ${candidate.recommendation?.color}`}
                          >
                            {candidate.recommendation?.label}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-400 mt-0.5">
                          {candidate.jobTitle ? `Targeting: ${candidate.jobTitle}` : 'General profile'}
                        </p>
                      </div>
                    </div>

                    {normalizeArray(candidate.skills).length > 0 ? (
                      <div className="ml-[52px] flex flex-wrap gap-1.5 mt-2">
                        {normalizeArray(candidate.skills).slice(0, 6).map((skill, skillIndex) => (
                          <span
                            key={`${candidate._id}-${skill}-${skillIndex}`}
                            className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {candidate.status ? (
                      <div className="ml-[52px] mt-3 flex items-center gap-3">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          Status: <strong>{candidate.status}</strong>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Scores & Intelligence CTA Link */}
                  <div className="flex items-center gap-6 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="text-center">
                      <div className="text-3xl font-extrabold text-blue-600">{candidate.score || 0}</div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Score</p>
                      {candidate.atsScore > 0 ? (
                        <span className="mt-1 inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          ATS: {candidate.atsScore}%
                        </span>
                      ) : null}
                    </div>

                    <Link
                      to={intelligenceUrl}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition-colors"
                    >
                      View Intelligence <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Rankings
