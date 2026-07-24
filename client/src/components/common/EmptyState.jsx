/**
 * EmptyState — Consistent empty/placeholder state with icon, message, and optional action.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
      {Icon ? (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
          <Icon className="h-8 w-8 text-slate-300" />
        </div>
      ) : null}
      <h3 className="text-xl font-bold text-slate-600">{title || 'No data available'}</h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}