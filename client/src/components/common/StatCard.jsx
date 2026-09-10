/**
 * StatCard — Reusable statistic display card.
 * Used in dashboards, portfolio, and settings.
 */
export default function StatCard({ label, value, icon: Icon, tone = 'blue', onClick, href }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  const content = (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }

  if (onClick) {
    return <button type="button" onClick={onClick} className="w-full text-left">{content}</button>
  }

  return content
}