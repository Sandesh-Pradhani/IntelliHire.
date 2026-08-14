/**
 * GithubCard - Displays GitHub profile statistics
 *
 * WHY THIS FILE:
 * Reusable card component that shows a candidate's GitHub stats in the
 * IntelliHire design language (rounded-3xl, blue gradient, professional).
 *
 * WHY THIS APPROACH:
 * - Statistic cards instead of tables for a modern dashboard feel
 * - Handles empty/loading states gracefully
 * - Responsive grid layout for all screen sizes
 */
import { GitBranch, Star, GitFork, Users, FolderGit2, Code2 } from 'lucide-react'

function GithubCard({ data, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-40 rounded-lg bg-slate-100" />
        <div className="mt-4 space-y-3">
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5 text-white">
            <GitBranch className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">GitHub</h3>
        </div>
        <p className="text-sm text-slate-500">No GitHub profile connected yet.</p>
      </div>
    )
  }

  const profile = data.profile || {}
  const repos = data.repos || []
  const languages = data.languages || []
  const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0)
  const totalForks = repos.reduce((sum, r) => sum + (r.forks || 0), 0)

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5 text-white">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">GitHub</h3>
            <p className="text-xs text-slate-500">@{data.username}</p>
          </div>
        </div>
        {profile.avatarUrl && (
          <img src={profile.avatarUrl} alt={profile.name} className="h-10 w-10 rounded-full" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={FolderGit2} label="Repos" value={repos.length} tone="blue" />
        <Stat icon={Star} label="Stars" value={totalStars} tone="amber" />
        <Stat icon={GitFork} label="Forks" value={totalForks} tone="emerald" />
        <Stat icon={Users} label="Followers" value={profile.followers || 0} tone="violet" />
      </div>

      {languages.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Code2 className="h-3.5 w-3.5" /> Top Languages
          </p>
          <div className="flex flex-wrap gap-1.5">
            {languages.slice(0, 5).map((lang) => (
              <span key={lang.name} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {lang.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className={`mb-1.5 inline-flex rounded-lg p-1.5 ${tones[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="text-lg font-extrabold text-slate-800">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}

export default GithubCard