/**
 * Reusable stat card component for KPI display
 * Used across Dashboard and other pages
 */
function StatCard({ label, value, icon: Icon, iconColor, trend, trendLabel, trendColor }) {
  const trendColors = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    violet: 'text-violet-600 bg-violet-50',
    amber: 'text-amber-600 bg-amber-50'
  }

  const iconBgColors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  }

  const bgColor = iconBgColors[iconColor] || iconBgColors.blue
  const trendClass = trendColors[trendColor] || ''

  return (
    <article className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl group-hover:scale-105 transition-transform duration-300 ${bgColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className={`mt-4 flex items-center gap-1.5 text-xs font-medium w-fit px-2.5 py-1 rounded-full ${trendClass}`}>
          <span>{trend}</span>
          {trendLabel && <span className="text-slate-400 font-normal">{trendLabel}</span>}
        </div>
      )}
    </article>
  )
}

export default StatCard