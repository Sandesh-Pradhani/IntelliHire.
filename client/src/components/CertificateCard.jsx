import { ExternalLink, FileText, Pencil, Trash2 } from 'lucide-react'
import CertificateScoreCard from './CertificateScoreCard'
import CertificateVerificationBadge from './CertificateVerificationBadge'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not set'
}

function CertificateCard({ certificate, onEdit, onDelete, onScore, scoring }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">{certificate.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{certificate.issuer}</p>
        </div>
        <CertificateVerificationBadge status={certificate.verificationStatus} />
      </div>
      <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
        <span>Issued: {formatDate(certificate.issueDate)}</span>
        <span>Expires: {certificate.hasExpiry ? formatDate(certificate.expiryDate) : 'No expiry'}</span>
        <span>Credential: {certificate.credentialId || 'Not provided'}</span>
        <span>Category: {certificate.category || 'Other'}</span>
      </div>
      {certificate.skills?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {certificate.skills.map((skill) => (
            <span key={skill} className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{skill}</span>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {certificate.credentialUrl && (
          <a href={certificate.credentialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            <ExternalLink className="h-3.5 w-3.5" /> Credential
          </a>
        )}
        {certificate.evidenceUrl && (
          <a href={certificate.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            <FileText className="h-3.5 w-3.5" /> Evidence
          </a>
        )}
        <button type="button" onClick={onEdit} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Edit certificate">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete certificate">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">
        <CertificateScoreCard score={certificate.certificateScore} loading={scoring} onScore={onScore} />
      </div>
    </article>
  )
}

export default CertificateCard
