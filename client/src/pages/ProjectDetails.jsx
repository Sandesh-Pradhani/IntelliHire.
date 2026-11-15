/**
 * ProjectDetails - Full project detail view with AI scoring
 *
 * Problem solved: Provides a dedicated page for viewing project details
 * with the AI score breakdown, GitHub preview, and technology list.
 *
 * Reason: The portfolio grid shows summaries; this page provides the
 * full detail view needed for deep evaluation by both candidates and recruiters.
 *
 * Alternative: Modal in Portfolio page — rejected because a dedicated route
 * provides better sharing, bookmarking, and deep-linking capability.
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Loader2 } from 'lucide-react'
import projectService from '../services/projectService'
import TechnologyBadge from '../components/TechnologyBadge'
import ProjectScoreCard from '../components/ProjectScoreCard'
import GithubPreview from '../components/GithubPreview'

function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState(null)

  const fetchProject = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await projectService.getProject(id)
      setProject(data)
    } catch (err) {
      setError(err.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleScore = async () => {
    setScoring(true)
    try {
      const updated = await projectService.scoreProject(id)
      setProject(updated)
    } catch (err) {
      setError(err.message || 'Failed to score project')
    } finally {
      setScoring(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Portfolio
      </button>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{project.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {project.category || 'Other'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                project.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                project.status === 'in-progress' ? 'bg-amber-50 text-amber-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {project.status === 'in-progress' ? 'In Progress' : project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
              </span>
              {project.isFeatured && (
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">Featured</span>
              )}
            </div>
          </div>
        </div>

        {project.description && (
          <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {project.duration && (
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Duration</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{project.duration}</p>
            </div>
          )}
          {project.teamSize > 0 && (
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Team Size</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{project.teamSize} member{project.teamSize > 1 ? 's' : ''}</p>
            </div>
          )}
          {project.role && (
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Role</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{project.role}</p>
            </div>
          )}
        </div>

        {project.technologies?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Technologies</p>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.map((tech, i) => (
                <TechnologyBadge key={i} name={tech} size="md" />
              ))}
            </div>
          </div>
        )}
      </div>

      {scoring ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-sm text-slate-600">Analyzing project with AI...</span>
          </div>
        </div>
      ) : (
        <ProjectScoreCard score={project.projectScore} onScore={handleScore} />
      )}

      <GithubPreview url={project.githubUrl} technologies={project.technologies} />
    </div>
  )
}

export default ProjectDetails
