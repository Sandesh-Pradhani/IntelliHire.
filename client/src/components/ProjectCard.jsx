/**
 * ProjectCard - Displays a project summary in the portfolio grid
 *
 * Problem solved: Provides a consistent, visually appealing card for
 * displaying project information in both candidate and recruiter views.
 *
 * Reason: Reusable card component that handles all project display states
 * including score visualization, technology badges, and action buttons.
 *
 * Alternative: Inline rendering in Portfolio page — rejected because it
 * leads to code duplication and makes the portfolio page too large.
 */

import { ExternalLink, FolderKanban, GitBranch, Star } from 'lucide-react'
import TechnologyBadge from './TechnologyBadge'

function ProjectCard({ project, onSelect, onScore, showCandidate = true }) {
  const score = project.projectScore?.portfolioScore
  const scoreColor = score >= 70 ? 'text-emerald-600 bg-emerald-50' : score >= 50 ? 'text-amber-600 bg-amber-50' : score > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50'

  const categoryColors = {
    'Web Development': 'bg-blue-50 text-blue-600',
    'Mobile Development': 'bg-violet-50 text-violet-600',
    'AI/ML': 'bg-purple-50 text-purple-600',
    'Data Science': 'bg-cyan-50 text-cyan-600',
    'DevOps': 'bg-orange-50 text-orange-600',
    'Backend': 'bg-green-50 text-green-600',
    'Frontend': 'bg-pink-50 text-pink-600',
    'Full Stack': 'bg-indigo-50 text-indigo-600',
    'Other': 'bg-slate-50 text-slate-600',
  }

  return (
    <div
      onClick={() => onSelect?.(project)}
      className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-200"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{project.title}</h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColors[project.category] || categoryColors['Other']}`}>
              {project.category || 'Other'}
            </span>
          </div>
        </div>
        {score != null && score > 0 && (
          <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${scoreColor}`}>
            <Star className="h-3 w-3" />
            <span className="text-xs font-bold">{score}</span>
          </div>
        )}
      </div>

      {project.description && (
        <p className="mb-3 text-xs text-slate-500 line-clamp-2">{project.description}</p>
      )}

      {project.technologies?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {project.technologies.slice(0, 5).map((tech, i) => (
            <TechnologyBadge key={i} name={tech} size="xs" />
          ))}
          {project.technologies.length > 5 && (
            <span className="px-1.5 py-0.5 text-[10px] text-slate-400">+{project.technologies.length - 5}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              <GitBranch className="h-3 w-3" /> GitHub
            </a>
          )}
          {project.liveDemoUrl && (
            <a
              href={project.liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
            >
              <ExternalLink className="h-3 w-3" /> Live Demo
            </a>
          )}
        </div>
        {project.status && (
          <span className={`text-[10px] font-semibold ${project.status === 'completed' ? 'text-emerald-600' : project.status === 'in-progress' ? 'text-amber-600' : 'text-slate-400'}`}>
            {project.status === 'in-progress' ? 'In Progress' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        )}
      </div>

      {showCandidate && project.userId && typeof project.userId === 'object' && (
        <div className="mt-2 border-t border-slate-50 pt-2">
          <p className="text-[10px] text-slate-400">by {project.userId.name || 'Candidate'}</p>
        </div>
      )}
    </div>
  )
}

export default ProjectCard
