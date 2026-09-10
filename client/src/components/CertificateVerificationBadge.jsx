const STATUS_STYLES = {
  verified: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  expired: 'bg-rose-50 text-rose-700',
  unverified: 'bg-slate-100 text-slate-600',
}

function CertificateVerificationBadge({ status = 'unverified' }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.unverified}`}>
      {label}
    </span>
  )
}

export default CertificateVerificationBadge
