/**
 * GithubPreview - Shows GitHub repository info placeholder
 *
 * Problem solved: Displays a preview card for the GitHub repository linked
 * to a project, with a placeholder for future GitHub API integration.
 *
 * Reason: When the GitHub API is integrated, this component will show
 * real-time repo data (stars, commits, contributors). For now, it shows
 * the URL and basic project info.
 *
 * Alternative: Simple link — rejected because a preview card provides
 * better UX and is ready for API integration.
 */

import { GitBranch, ExternalLink, Star, GitFork, Users } from 'lucide-react'

function GithubPreview({ url, technologies }) {
  if (!url) return null

  let owner = ''
  let repo = ''
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean)
    owner = parts[0] || ''
    repo = parts[1] || ''
  } catch {
    // Invalid URL
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-slate-700" />
        <p className="text-sm font-bold text-slate-800">GitHub Repository</p>
      </div>

      {owner && repo && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white p-2 text-center">
            <Star className="mx-auto mb-1 h-3.5 w-3.5 text-amber-500" />
            <p className="text-[10px] text-slate-400">Stars</p>
            <p className="text-xs font-bold text-slate-700">--</p>
          </div>
          <div className="rounded-xl bg-white p-2 text-center">
            <GitFork className="mx-auto mb-1 h-3.5 w-3.5 text-blue-500" />
            <p className="text-[10px] text-slate-400">Forks</p>
            <p className="text-xs font-bold text-slate-700">--</p>
          </div>
          <div className="rounded-xl bg-white p-2 text-center">
            <Users className="mx-auto mb-1 h-3.5 w-3.5 text-violet-500" />
            <p className="text-[10px] text-slate-400">Contributors</p>
            <p className="text-xs font-bold text-slate-700">--</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          {owner && <p className="text-xs text-slate-500">Owner: <span className="font-semibold text-slate-700">{owner}</span></p>}
          {repo && <p className="text-xs text-slate-500">Repo: <span className="font-semibold text-slate-700">{repo}</span></p>}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
        >
          <ExternalLink className="h-3 w-3" /> Open
        </a>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">
        GitHub API integration coming soon for real-time repo analytics.
      </p>
    </div>
  )
}

export default GithubPreview
