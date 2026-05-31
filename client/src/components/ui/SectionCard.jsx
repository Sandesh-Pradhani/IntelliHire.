/**
 * Reusable section card with header for dashboard panels
 */
function SectionCard({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export default SectionCard