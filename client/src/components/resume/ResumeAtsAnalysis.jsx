/**
 * ResumeAtsAnalysis Component
 *
 * Displays ATS analysis results with scores, coverage, and recommendations.
 */

import { AlertCircle, CheckCircle, TrendingUp, Target, FileText, Lightbulb } from 'lucide-react'

function ScoreRing({ score, size = 80 }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#3b82f6' :
    score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-lg font-bold text-slate-800">{score}</span>
    </div>
  )
}

export default function ResumeAtsAnalysis({ analysis, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <Target className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">Run ATS analysis to see results</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Score Overview */}
      <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl">
        <ScoreRing score={analysis.atsScore || 0} />
        <div>
          <p className="text-sm font-semibold text-slate-600">ATS Score</p>
          <p className="text-xs text-slate-400">
            {(analysis.atsScore || 0) >= 80 ? 'Excellent' :
             (analysis.atsScore || 0) >= 60 ? 'Good' :
             (analysis.atsScore || 0) >= 40 ? 'Needs improvement' : 'Poor'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-semibold text-slate-600">
            {analysis.keywordCoverage || 0}%
          </p>
          <p className="text-xs text-slate-400">Keyword Coverage</p>
        </div>
      </div>

      {/* Matched Keywords */}
      {analysis.matchedKeywords && analysis.matchedKeywords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Matched Keywords</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.matchedKeywords.map((kw, i) => (
              <span key={i} className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold text-slate-700">Missing Keywords</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.missingKeywords.map((kw, i) => (
              <span key={i} className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-medium">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section Completeness */}
      {analysis.sectionCompleteness && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-semibold text-slate-700">Section Completeness</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(analysis.sectionCompleteness).map(([section, filled]) => (
              <div key={section} className="flex items-center gap-2 text-xs">
                {filled ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-slate-300" />
                )}
                <span className={filled ? 'text-slate-700' : 'text-slate-400'}>
                  {section.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-semibold text-slate-700">Recommendations</p>
          </div>
          <div className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600 bg-violet-50 rounded-xl px-3 py-2 border border-violet-100">
                <TrendingUp className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
