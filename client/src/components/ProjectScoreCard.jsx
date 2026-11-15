/**
 * ProjectScoreCard - Displays AI-generated project score
 *
 * Problem solved: Visualizes the AI project scoring breakdown with a
 * progress ring and dimension scores, making it easy to understand
 * project quality at a glance.
 *
 * Reason: Follows the same pattern as CodingScoreCard for consistency.
 * Shows the 4 scoring dimensions and overall portfolio score.
 *
 * Alternative: Inline score display — rejected because a dedicated card
 * provides better visual hierarchy and reusability.
 */

import { Brain, Loader2, Star } from 'lucide-react'

function ProjectScoreCard({ score, loading, onScore }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  const portfolioScore = score?.portfolioScore

  if (portfolioScore == null) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">AI Project Score</h3>
        </div>
        <p className="text-sm text-slate-500">
          Click "Get AI Score" to analyze this project with our AI engine.
        </p>
        {onScore && (
          <button
            type="button"
            onClick={onScore}
            className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Brain className="h-4 w-4" />
            Get AI Score
          </button>
        )}
      </div>
    )
  }

  const scoreColor = portfolioScore >= 70 ? 'text-emerald-600' : portfolioScore >= 50 ? 'text-amber-600' : 'text-rose-600'
  const ringColor = portfolioScore >= 70 ? 'stroke-emerald-500' : portfolioScore >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'

  const dimensions = [
    { label: 'Technology', score: score.technologyScore, weight: '30%', color: 'bg-blue-500' },
    { label: 'Complexity', score: score.complexityScore, weight: '30%', color: 'bg-violet-500' },
    { label: 'Documentation', score: score.documentationScore, weight: '20%', color: 'bg-amber-500' },
    { label: 'Repository', score: score.repositoryScore || 0, weight: '20%', color: 'bg-emerald-500' },
  ]

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5 text-white">
          <Brain className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">AI Project Score</h3>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(portfolioScore / 100) * 264} 264`}
              className={ringColor}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-extrabold ${scoreColor}`}>{portfolioScore}</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">AI Recommendation</p>
          <p className="mt-1 text-sm text-slate-500">{score.recommendation}</p>
          {onScore && (
            <button
              type="button"
              onClick={onScore}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              <Star className="h-3 w-3" /> Re-score
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {dimensions.map((dim) => (
          <div key={dim.label} className="rounded-2xl bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${dim.color}`} />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{dim.label}</p>
            </div>
            <p className="text-lg font-extrabold text-slate-800">{dim.score ?? '--'}</p>
            <p className="text-[10px] text-slate-400">{dim.weight} weight</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectScoreCard
