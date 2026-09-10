/**
 * SectionHeader — Consistent section title, description, and optional action button.
 */
export default function SectionHeader({ title, description, icon: Icon, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
          {description ? <p className="mt-0.5 text-sm text-slate-400">{description}</p> : null}
        </div>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}