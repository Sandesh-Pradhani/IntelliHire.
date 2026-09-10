import { useEffect, useState } from 'react'

const CATEGORIES = ['Cloud', 'AI/ML', 'Data Science', 'Web Development', 'Cybersecurity', 'Project Management', 'Other']

function toDateInput(value) {
  return value ? new Date(value).toISOString().split('T')[0] : ''
}

function CertificateForm({ certificate, saving, error, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    issuer: '',
    credentialId: '',
    credentialUrl: '',
    issueDate: '',
    hasExpiry: false,
    expiryDate: '',
    skills: '',
    category: 'Other',
    description: '',
    evidence: null,
  })

  useEffect(() => {
    if (!certificate) return
    setForm({
      name: certificate.name || '',
      issuer: certificate.issuer || '',
      credentialId: certificate.credentialId || '',
      credentialUrl: certificate.credentialUrl || '',
      issueDate: toDateInput(certificate.issueDate),
      hasExpiry: Boolean(certificate.hasExpiry || certificate.expiryDate),
      expiryDate: toDateInput(certificate.expiryDate),
      skills: (certificate.skills || []).join(', '),
      category: certificate.category || 'Other',
      description: certificate.description || '',
      evidence: null,
    })
  }, [certificate])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      expiryDate: form.hasExpiry ? form.expiryDate : '',
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <input required placeholder="Certificate Name" value={form.name} onChange={(e) => update('name', e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
        <input required placeholder="Issuing Organization" value={form.issuer} onChange={(e) => update('issuer', e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
        <input placeholder="Credential ID" value={form.credentialId} onChange={(e) => update('credentialId', e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
        <input placeholder="Credential URL" value={form.credentialUrl} onChange={(e) => update('credentialUrl', e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
        <input required type="date" value={form.issueDate} onChange={(e) => update('issueDate', e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
        <select value={form.category} onChange={(e) => update('category', e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400">
          {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <input type="checkbox" checked={form.hasExpiry} onChange={(e) => update('hasExpiry', e.target.checked)} />
        Has expiry date
      </label>
      {form.hasExpiry && (
        <input type="date" value={form.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
      )}
      <input placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => update('skills', e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
      <textarea placeholder="Description" value={form.description} onChange={(e) => update('description', e.target.value)} className="h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => update('evidence', e.target.files?.[0] || null)} className="w-full rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">Cancel</button>
        <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Certificate'}
        </button>
      </div>
    </form>
  )
}

export default CertificateForm
