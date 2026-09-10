import { Sparkles } from 'lucide-react'

function CertificateScoreCard({ score, loading = false, onScore }) {
  const value = score?.certificateScore || 0
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Sparkles className="h-4 w-4" /></div>
          <div>
            <p className="text-sm font-bold text-slate-800">Certificate Score</p>
            <p className="text-xs text-slate-400">Relevance and evidence scoring</p>
          </div>
        </div>
        {onScore && (
          <button type="button" onClick={onScore} disabled={loading} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Scoring...' : 'Score'}
          </button>
        )}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        <span className="pb-1 text-xs font-semibold text-slate-400">/ 100</span>
      </div>
      {score?.recommendation && <p className="mt-3 text-xs text-slate-500">{score.recommendation}</p>}
    </div>
  )
}

export default CertificateScoreCard
