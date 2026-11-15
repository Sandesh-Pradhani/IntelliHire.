import { useEffect, useMemo, useState } from 'react'
import { Award, CheckCircle2, Clock3, Plus, TrendingUp, X } from 'lucide-react'
import certificateService from '../services/certificateService'
import CertificateCard from '../components/CertificateCard'
import CertificateForm from '../components/CertificateForm'
import StatCard from '../components/common/StatCard'

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Certificates() {
  const [certificates, setCertificates] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [scoringId, setScoringId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [items, summary] = await Promise.all([
        certificateService.getCertificates(),
        certificateService.getStats(),
      ])
      setCertificates(items || [])
      setStats(summary || null)
    } catch (err) {
      setError(err.message || 'Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const derivedStats = useMemo(() => {
    if (stats) return stats
    const scores = certificates.map((cert) => cert.certificateScore?.certificateScore || 0).filter(Boolean)
    return {
      totalCertificates: certificates.length,
      verifiedCertificates: certificates.filter((cert) => cert.verificationStatus === 'verified').length,
      expiringCertificates: certificates.filter((cert) => cert.expiryDate && new Date(cert.expiryDate) > new Date()).length,
      averageCertificateScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
    }
  }, [certificates, stats])

  const openCreate = () => {
    setEditing(null)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (certificate) => {
    setEditing(certificate)
    setFormError('')
    setModalOpen(true)
  }

  const saveCertificate = async (data) => {
    setSaving(true)
    setFormError('')
    try {
      const saved = editing
        ? await certificateService.updateCertificate(editing._id, data)
        : await certificateService.createCertificate(data)
      setCertificates((prev) => editing ? prev.map((item) => item._id === saved._id ? saved : item) : [saved, ...prev])
      setModalOpen(false)
      setEditing(null)
      try { setStats(await certificateService.getStats()) } catch {}
    } catch (err) {
      setFormError(err.message || 'Failed to save certificate')
    } finally {
      setSaving(false)
    }
  }

  const deleteCertificate = async (id) => {
    await certificateService.deleteCertificate(id)
    setCertificates((prev) => prev.filter((item) => item._id !== id))
    try { setStats(await certificateService.getStats()) } catch {}
  }

  const scoreCertificate = async (id) => {
    setScoringId(id)
    try {
      const updated = await certificateService.scoreCertificate(id)
      setCertificates((prev) => prev.map((item) => item._id === id ? updated : item))
      try { setStats(await certificateService.getStats()) } catch {}
    } finally {
      setScoringId(null)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Certificates</h1>
          <p className="mt-2 text-slate-500">Manage credential evidence and profile contribution scoring.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Certificate
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Award} label="Total Certificates" value={derivedStats.totalCertificates} />
        <StatCard icon={CheckCircle2} label="Verified Certificates" value={derivedStats.verifiedCertificates} tone="emerald" />
        <StatCard icon={Clock3} label="Expiring Certificates" value={derivedStats.expiringCertificates} tone="amber" />
        <StatCard icon={TrendingUp} label="Average Score" value={derivedStats.averageCertificateScore} tone="violet" />
      </div>

      {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Award className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="font-semibold text-slate-600">No certificates added yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate._id}
              certificate={certificate}
              scoring={scoringId === certificate._id}
              onEdit={() => openEdit(certificate)}
              onDelete={() => deleteCertificate(certificate._id)}
              onScore={() => scoreCertificate(certificate._id)}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Certificate' : 'Add Certificate'}>
        <CertificateForm
          certificate={editing}
          saving={saving}
          error={formError}
          onCancel={() => setModalOpen(false)}
          onSubmit={saveCertificate}
        />
      </Modal>
    </div>
  )
}

export default Certificates
