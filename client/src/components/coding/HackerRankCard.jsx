/**
 * HackerRankCard - Displays HackerRank profile statistics
 *
 * WHY THIS FILE:
 * Reusable card component that shows a candidate's HackerRank stats in the
 * IntelliHire design language (rounded-3xl, blue gradient, professional).
 *
 * WHY THIS APPROACH:
 * - Statistic cards instead of tables for a modern dashboard feel
 * - Verified profile identity takes priority over stale error fields
 * - Shows HackerRank level and skill badges, plus profile details
 * - Unavailable metrics display "Not available" instead of fabricated zeros
 * - Handles empty/loading states gracefully
 */
import { Star, Award, Code2, AlertCircle, Clock, ExternalLink, CheckCircle2 } from 'lucide-react'

function formatLastSync(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
}

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

  const username = data.username || data.profile?.username || 'profile'
  const badges = Array.isArray(data.badges) ? data.badges : data.stats?.badges || []
  const totalBadges = data.badgesCount ?? badges.length
  const status = data.syncStatus || data.status || 'unavailable'
  const profileVerified = data.profileVerified === true
  const isUnavailable = !profileVerified && (
  status === 'unavailable' ||
  status === 'error' ||
  data.status === 'data_unavailable' ||
  Boolean(data.error || data.errorMessage)
)

  // Verified profile details take priority over any stale error fields.
  const details = data.profileDetails || {}
  const profile = data.profile || {}

  const level = details.level ?? null
  const country = profile.country || details.country || null
  const accountCreated = details.createdAt || null

  const challengesSolved = data.stats?.challengesSolved ??
    data.totalSolved ??
    null

  const practiceScore = data.stats?.practiceScore ??
    data.practiceScore ??
    null

  const showPracticeStats =
    challengesSolved !== null || practiceScore !== null

  if (isUnavailable) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">HackerRank</h3>
              <p className="text-xs text-slate-500">@{username}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Profile Connected · Data Unavailable</p>
              <p className="mt-1 text-xs text-amber-700">
                {data.errorMessage || data.error || 'HackerRank profile is linked but automated data retrieval was unavailable.'}
              </p>
              {data.lastSuccessfulSync || data.lastSync ? (
                <p className="mt-2 flex items-center gap-1 text-[10px] text-amber-600">
                  <Clock className="h-3 w-3" /> Last sync: {formatLastSync(data.lastSuccessfulSync || data.lastSync)}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <a
            href={data.profileUrl || `https://www.hackerrank.com/profile/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View Profile
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">HackerRank</h3>
            <p className="text-xs text-slate-500">@{username}</p>
          </div>
        </div>
        {data.profile?.avatarUrl && (
          <img src={data.profile.avatarUrl} alt={data.profile.name || username} className="h-10 w-10 rounded-full" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-1.5 inline-flex rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-extrabold text-slate-800">
            {level !== null ? level : '—'}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            HackerRank Level
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-1.5 inline-flex rounded-lg bg-violet-50 p-1.5 text-violet-600">
            <Award className="h-3.5 w-3.5" />
          </div>
          <p className="text-lg font-extrabold text-slate-800">
            {totalBadges > 0 ? totalBadges : '—'}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Skill Badges
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-700">
          Profile Information
        </p>

        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400">Country</p>
            <p className="font-semibold text-slate-700">
              {country || 'Not available'}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Member Since</p>
            <p className="font-semibold text-slate-700">
              {accountCreated
                ? new Date(accountCreated).toLocaleDateString()
                : 'Not available'}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Public Events</p>
            <p className="font-semibold text-slate-700">
              {details.eventCount ?? 'Not available'}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Followers</p>
            <p className="font-semibold text-slate-700">
              {details.followersCount ?? 'Not available'}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Challenges Solved</p>
            <p className="font-semibold text-slate-700">
              {challengesSolved ?? 'Not available'}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Practice Score</p>
            <p className="font-semibold text-slate-700">
              {practiceScore ?? 'Not available'}
            </p>
          </div>
        </div>
      </div>

      {!showPracticeStats && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
          Profile verified. Detailed practice statistics are not available
          from the retrieved public profile.
        </p>
      )}

      {badges.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 8).map((badge) => {
              const badgeName = badge.name || badge.skill || 'Skill'
              const starCount = badge.stars || 0

              return (
                <span key={`${badgeName}-${starCount}`} className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {badgeName}
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: Math.min(starCount, 5) }).map((_, i) => (
                      <Star key={`${badgeName}-${i}`} className="h-2.5 w-2.5 fill-current" />
                    ))}
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          {profileVerified ? 'Profile verified' : 'Profile connected'}
        </div>
        <a
          href={data.profileUrl || `https://www.hackerrank.com/profile/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          View Profile <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

export default HackerRankCard