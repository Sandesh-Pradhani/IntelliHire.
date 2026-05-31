/**
 * Skeleton loading component for consistent loading states
 */
function Skeleton({ className = '', variant = 'rect', width, height }) {
  const baseClasses = 'animate-pulse bg-slate-200 rounded-xl'
  
  if (variant === 'circle') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{ width: width || '2.5rem', height: height || '2.5rem' }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <Skeleton width="100px" height="12px" />
          <Skeleton width="60px" height="32px" />
        </div>
        <Skeleton width="44px" height="44px" variant="circle" />
      </div>
      <div className="mt-4">
        <Skeleton width="120px" height="20px" />
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
      <div className="space-y-3 mb-6">
        <Skeleton width="180px" height="18px" />
        <Skeleton width="280px" height="12px" />
      </div>
      <Skeleton width="100%" height="192px" />
    </div>
  )
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton width="40px" height="40px" variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="14px" />
            <Skeleton width="40%" height="12px" />
          </div>
          <Skeleton width="60px" height="24px" />
        </div>
      ))}
    </div>
  )
}

export default Skeleton