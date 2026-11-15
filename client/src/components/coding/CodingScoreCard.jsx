/**
 * CodingScoreCard - Displays the AI-generated coding score
 *
 * WHY THIS FILE:
 * Shows the unified coding score (0-100) with a visual progress ring,
 * the AI recommendation, and a per-platform breakdown.
 *
 * WHY THIS APPROACH:
 * - Visual score ring makes the score immediately understandable
 * - Color-coded score (red/amber/emerald) based on performance
 * - Shows platform breakdown for transparency
 * - Handles loading and empty states
 */
import { Brain, Loader2 } from 'lucide-react'

function CodingScoreCard({ score, recommendation, breakdown, loading }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (score == null) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Coding Score</h3>
        </div>
        <p className="text-sm text-slate-500">
          Sync your coding profiles to get an AI-powered coding score.
        </p>
      </div>
    )
  }

  const scoreColor = score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600'
  const ringColor = score >= 70 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5 text-white">
          <Brain className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Coding Score</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Score ring */}
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 264} 264`}
              className={ringColor}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-extrabold ${scoreColor}`}>{score}</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">AI Recommendation</p>
          <p className="mt-1 text-sm text-slate-500">{recommendation}</p>
        </div>
      </div>

      {breakdown && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {['github', 'leetcode', 'hackerrank'].map((platform) => {
            const item = breakdown[platform]
            if (!item) return null
            return (
              <div key={platform} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </p>
                <p className="mt-1 text-lg font-extrabold text-slate-800">
                  {item.present ? item.score : '--'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {item.present ? `${Math.round(item.weight * 100)}% weight` : 'Not connected'}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CodingScoreCard