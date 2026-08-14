/**
 * HackerRankCard - Displays HackerRank profile statistics
 *
 * WHY THIS FILE:
 * Reusable card component that shows a candidate's HackerRank stats in the
 * IntelliHire design language (rounded-3xl, blue gradient, professional).
 *
 * WHY THIS APPROACH:
 * - Statistic cards instead of tables for a modern dashboard feel
 * - Shows stars and skill badges with star counts
 * - Handles empty/loading states gracefully
 */
import { Star, Award, Code2 } from 'lucide-react'

function HackerRankCard({ data, loading }) {
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
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
            <Code2 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">HackerRank</h3>
        </div>
        <p className="text-sm text-slate-500">No HackerRank profile connected yet.</p>
      </div>
    )
  }

  const badges = data.badges || []

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">HackerRank</h3>
            <p className="text-xs text-slate-500">@{data.username}</p>
          </div>
        </div>
        {data.profile?.avatarUrl && (
          <img src={data.profile.avatarUrl} alt={data.profile.name} className="h-10 w-10 rounded-full" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-1.5 inline-flex rounded-lg bg-amber-50 p-1.5 text-amber-600">
            <Star className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-extrabold text-slate-800">{data.stars || 0}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total Stars</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-1.5 inline-flex rounded-lg bg-violet-50 p-1.5 text-violet-600">
            <Award className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-extrabold text-slate-800">{badges.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Skill Badges</p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span key={badge.name} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {badge.name}
                <span className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: Math.min(badge.stars, 5) }).map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 fill-current" />
                  ))}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default HackerRankCard