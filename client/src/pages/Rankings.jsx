import { useEffect, useState } from 'react'
import axios from 'axios'
import { Award, Medal, Sparkles, TrendingUp, Users } from 'lucide-react'
import Skeleton from '../components/ui/Skeleton'
import { normalizeArray } from '../utils/apiNormalizer'

function Rankings({ view = 'rankings' }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('')

  useEffect(() => {
    fetchRankings()
  }, [])

  async function fetchRankings() {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const applicationsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/applications/recruiter`, { headers })
      const applications = normalizeArray(applicationsResponse.data)

      if (applications.length > 0) {
        const rankedApplications = applications
          .filter((application) => (application.matchScore || 0) > 0 || (application.atsScore || 0) > 0)
          .sort((left, right) => (right.matchScore || 0) - (left.matchScore || 0))
          .map((application, index) => ({
            _id: application._id,
            rank: index + 1,
            candidateName: application.candidateName || application.candidate?.name || 'Unknown',
            jobTitle: application.jobTitle || application.job?.title || 'Unknown',
            score: application.matchScore || 0,
            atsScore: application.atsScore || 0,
            skills: Array.isArray(application.matchedSkills) ? application.matchedSkills : [],
            status: application.status,
          }))

        setCandidates(rankedApplications)
        setSource('applications')
      } else {
        const rankingsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/ai/rankings`, { headers })
        setCandidates(
          normalizeArray(rankingsResponse.data).map((candidate, index) => ({
            ...candidate,
            rank: index + 1,
            score: candidate.score || candidate.matchScore || 0,
            skills: normalizeArray(candidate.skills || candidate.matchedSkills),
          }))
        )
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

  const heading = view === 'candidates' ? 'Candidates' : 'Candidate Rankings'
  const description = view === 'candidates'
    ? 'Candidate records collected from applications and AI scoring.'
    : 'Ranked by AI match score from highest to lowest compatibility.'

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-800">
            <Award className="h-8 w-8 text-blue-600" />
            {heading}
          </h1>
          <p className="mt-2 text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={fetchRankings}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100"
        >
          <TrendingUp className="h-4 w-4" />
          Refresh Rankings
        </button>
      </div>

      {source && candidates.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Ranked from {source === 'applications' ? 'application database' : 'AI engine'} - {candidates.length} candidates
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>
      ) : null}

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <Skeleton width="200px" height="24px" />
                  <div className="flex gap-2">
                    {[...Array(3)].map((__, skillIndex) => (
                      <Skeleton key={skillIndex} width="80px" height="28px" />
                    ))}
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton width="60px" height="40px" />
                  <Skeleton width="80px" height="12px" />
                </div>
              </div>
            </div>
          ))
        ) : candidates.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-600">No candidates ranked yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Upload resumes, create jobs, and run AI Job Matching to see ranked candidates here.
            </p>
          </div>
        ) : (
          candidates.map((candidate, index) => (
            <div key={candidate._id || index} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-extrabold text-sm ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-600'
                        : index === 1
                          ? 'bg-slate-100 text-slate-500'
                          : index === 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-50 text-slate-400'
                    }`}>
                      {index === 0 ? <Medal className="h-5 w-5" /> : `#${index + 1}`}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-slate-800">{candidate.candidateName || candidate.name || 'Unknown'}</h2>
                      <p className="truncate text-xs text-slate-400">{candidate.jobTitle ? `for ${candidate.jobTitle}` : 'Job title unavailable'}</p>
                    </div>
                  </div>

                  {normalizeArray(candidate.skills).length > 0 ? (
                    <div className="ml-[52px] flex flex-wrap gap-1.5">
                      {normalizeArray(candidate.skills).slice(0, 6).map((skill, skillIndex) => (
                        <span key={`${candidate._id}-${skill}-${skillIndex}`} className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {candidate.status ? (
                    <div className="ml-[52px] mt-3">
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        {candidate.status}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 text-center">
                  <div className="text-4xl font-extrabold text-blue-600">{candidate.score || 0}</div>
                  <p className="mt-1 text-xs font-medium text-slate-400">Match Score</p>
                  {candidate.atsScore > 0 ? (
                    <span className="mt-2 inline-block rounded-lg border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      ATS: {candidate.atsScore}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Rankings
