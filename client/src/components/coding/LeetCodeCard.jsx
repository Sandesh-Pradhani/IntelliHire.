/**
 * LeetCodeCard - Displays LeetCode profile statistics
 *
 * WHY THIS FILE:
 * Reusable card component that shows a candidate's LeetCode stats in the
 * IntelliHire design language (rounded-3xl, blue gradient, professional).
 *
 * WHY THIS APPROACH:
 * - Statistic cards instead of tables for a modern dashboard feel
 * - Shows problems solved by difficulty with color coding
 * - Handles empty/loading states gracefully
 */
import { Code2, Trophy, Target } from 'lucide-react'

function LeetCodeCard({ data, loading }) {
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
          <div className="rounded-xl bg-amber-500 p-2.5 text-white">
            <Code2 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">LeetCode</h3>
        </div>
        <p className="text-sm text-slate-500">No LeetCode profile connected yet.</p>
      </div>
    )
  }

  const problems = data.problemsSolved || {}
  const contest = data.contestRating

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500 p-2.5 text-white">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">LeetCode</h3>
            <p className="text-xs text-slate-500">@{data.username}</p>
          </div>
        </div>
        {data.profile?.avatarUrl && (
          <img src={data.profile.avatarUrl} alt={data.profile.name} className="h-10 w-10 rounded-full" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Target} label="Solved" value={problems.total || 0} tone="blue" />
        <Stat icon={Code2} label="Easy" value={problems.easy || 0} tone="emerald" />
        <Stat icon={Code2} label="Medium" value={problems.medium || 0} tone="amber" />
        <Stat icon={Code2} label="Hard" value={problems.hard || 0} tone="rose" />
      </div>

      {contest && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Trophy className="h-3.5 w-3.5" /> Contest Performance
          </p>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xl font-extrabold text-slate-800">{contest.rating || '--'}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Rating</p>
            </div>
            {contest.topPercentage != null && (
              <div>
                <p className="text-xl font-extrabold text-slate-800">Top {contest.topPercentage}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Percentile</p>
              </div>
            )}
            <div>
              <p className="text-xl font-extrabold text-slate-800">{contest.attendedContests || 0}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Contests</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
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

export default LeetCodeCard