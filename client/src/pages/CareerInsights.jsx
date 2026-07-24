import { useEffect, useMemo, useState } from 'react'
import { Award, BookOpen, Brain, ChevronDown, ChevronUp, Lightbulb, Route, Sparkles, Target } from 'lucide-react'
import resumeService from '../services/resume.service'
import aiService from '../services/ai.service'
import { normalizeArray } from '../utils/apiNormalizer'

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
    async function fetchResumes() {
      try {
        const data = await resumeService.getAll()
        setResumes(normalizeArray(data))
      } catch (err) {
        console.log(err)
      }
    }

    fetchResumes()
  }, [])

  const selectedResumeRecord = useMemo(
    () => resumes.find((resume) => String(resume._id) === String(selectedResume)),
    [resumes, selectedResume]
  )

  const generateInsights = async () => {
    const selectedSkills = Array.isArray(selectedResumeRecord?.extractedSkills) ? selectedResumeRecord.extractedSkills : skills

    if (!Array.isArray(selectedSkills) || selectedSkills.length === 0) {
      setError('Please select a resume with skills or enter skills manually.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await aiService.getCareerInsights({
        skills: selectedSkills,
        experience_years: experienceYears ? parseFloat(experienceYears) : null,
        interests: [],
      })

      setSkills(selectedSkills)
      setInsights(data || null)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Failed to generate career insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return 'border-emerald-200 bg-emerald-50 text-emerald-600'
    if (percentage >= 60) return 'border-blue-200 bg-blue-50 text-blue-600'
    if (percentage >= 40) return 'border-amber-200 bg-amber-50 text-amber-600'
    return 'border-slate-200 bg-slate-50 text-slate-500'
  }

  return (
    <div className="pb-12 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Career Insights</h1>
          <p className="mt-0.5 text-sm text-slate-400">Get AI-powered career recommendations based on your skills.</p>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-3 block text-sm font-bold text-slate-700">Select Resume</label>
            <select
              value={selectedResume}
              onChange={(event) => {
                const value = event.target.value
                setSelectedResume(value)
                const resume = resumes.find((item) => String(item._id) === String(value))
                setSkills(Array.isArray(resume?.extractedSkills) ? resume.extractedSkills : [])
              }}
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Choose a resume...</option>
              {resumes.map((resume) => (
                <option key={resume._id} value={resume._id}>{resume.fileName || resume.filename || 'Resume'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-slate-700">Years of Experience (optional)</label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={experienceYears}
              onChange={(event) => setExperienceYears(event.target.value)}
              placeholder="e.g. 3"
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {skills.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-slate-700">Your Skills ({skills.length})</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, index) => (
                <span key={`${skill}-${index}`} className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</div>
        ) : null}

        <button
          type="button"
          onClick={generateInsights}
          disabled={loading || skills.length === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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

      {insights ? (
        <div className="space-y-6">
          {normalizeArray(insights.recommended_roles).length > 0 ? (
            <ExpandableInsight
              title="Recommended Roles"
              icon={Target}
              open={showRoles}
              onToggle={() => setShowRoles((value) => !value)}
              badge={String(normalizeArray(insights.recommended_roles).length)}
            >
              <div className="space-y-3">
                {normalizeArray(insights.recommended_roles).map((role, index) => (
                  <div key={index} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-blue-50">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{role.role}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {normalizeArray(role.matching_skills).map((skill, skillIndex) => (
                          <span key={`${role.role}-${skill}-${skillIndex}`} className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`rounded-xl border px-3 py-1.5 text-lg font-extrabold ${getMatchColor(role.match_percentage || 0)}`}>
                      {role.match_percentage || 0}%
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableInsight>
          ) : null}

          {normalizeArray(insights.skills_to_develop).length > 0 ? (
            <ExpandableInsight
              title="Skills to Develop"
              icon={BookOpen}
              open={showSkillsToDevelop}
              onToggle={() => setShowSkillsToDevelop((value) => !value)}
            >
              <div className="space-y-3">
                {normalizeArray(insights.skills_to_develop).map((skill, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{skill.skill}</p>
                      <p className="text-xs text-slate-500">{skill.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableInsight>
          ) : null}

          {normalizeArray(insights.career_progression).length > 0 ? (
            <ExpandableInsight
              title="Career Progression"
              icon={Route}
              open={showProgression}
              onToggle={() => setShowProgression((value) => !value)}
              className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50"
            >
              <div className="space-y-3">
                {normalizeArray(insights.career_progression).map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-700">
                        {index + 1}
                      </div>
                      {index < normalizeArray(insights.career_progression).length - 1 ? <div className="mt-1 h-full w-0.5 bg-emerald-200" /> : null}
                    </div>
                    <p className="pt-1 text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </ExpandableInsight>
          ) : null}
        </div>
      ) : (
        !loading && skills.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Lightbulb className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-600">No insights yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Select a resume and generate career insights to get role recommendations.
            </p>
          </div>
        ) : null
      )}
    </div>
  )
}

function ExpandableInsight({ title, icon: Icon, open, onToggle, badge, className = 'border-slate-100 bg-white', children }) {
  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${className}`}>
      <button type="button" onClick={onToggle} className="mb-4 flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          {badge ? <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-400">{badge}</span> : null}
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {open ? children : null}
    </div>
  )
}

export default CareerInsights
