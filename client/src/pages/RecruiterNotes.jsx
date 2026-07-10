import { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import {
  StickyNote,
  Plus,
  Search,
  Star,
  Edit3,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  User,
  Calendar,
  Filter,
  ArrowUpDown,
  FileText,
  MessageSquare,
  Shield,
  ShieldOff,
  Inbox,
  AlertCircle,
  Loader2
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const TAG_COLORS = [
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
]

function StarRating({ rating, onRate, size = 'md', readonly = false }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            } ${!readonly && star <= rating ? 'drop-shadow-sm' : ''}`}
          />
        </button>
      ))}
    </div>
  )
}

function TagInput({ tags, onAdd, onRemove, placeholder, colorClass }) {
  const [value, setValue] = useState('')

  const handleAdd = () => {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!value.trim()}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                colorClass || TAG_COLORS[idx % TAG_COLORS.length]
              }`}
            >
              {tag}
              {!readonly && (
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="hover:opacity-60 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonNoteCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="h-4 bg-slate-100 rounded w-32" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 w-4 bg-slate-100 rounded" />
            ))}
          </div>
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-slate-100 rounded-full w-16" />
            <div className="h-5 bg-slate-100 rounded-full w-20" />
          </div>
        </div>
        <div className="h-8 bg-slate-100 rounded w-8 ml-3" />
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-slate-50 rounded-2xl mb-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
    </div>
  )
}

function NoteCard({ note, onClick, onEdit, onDelete }) {
  const candidateName = note.candidateName || note.candidate?.name || 'Unknown Candidate'
  const preview = (note.notes || note.interviewFeedback || '').slice(0, 120)
  const strengths = note.strengths || []
  const weaknesses = note.weaknesses || []

  return (
    <div
      onClick={() => onClick(note)}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 truncate">{candidateName}</h3>
              {note.jobTitle && (
                <p className="text-xs text-slate-400 truncate">{note.jobTitle}</p>
              )}
            </div>
          </div>

          <StarRating rating={note.rating || 0} readonly size="sm" />

          {preview && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {preview}...
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {strengths.slice(0, 3).map((s, idx) => (
              <span
                key={`s-${idx}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full"
              >
                <Shield className="h-2.5 w-2.5" />
                {s}
              </span>
            ))}
            {weaknesses.slice(0, 3).map((w, idx) => (
              <span
                key={`w-${idx}`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full"
              >
                <ShieldOff className="h-2.5 w-2.5" />
                {w}
              </span>
            ))}
            {(strengths.length + weaknesses.length) > 6 && (
              <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5">
                +{(strengths.length + weaknesses.length) - 6} more
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Calendar className="h-3 w-3 text-slate-300" />
            <span className="text-[11px] text-slate-400">
              {note.createdAt
                ? new Date(note.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No date'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit(note) }}
            className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(note._id) }}
            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function NoteDetail({ note, onClose }) {
  if (!note) return null
  const candidateName = note.candidateName || note.candidate?.name || 'Unknown Candidate'
  const strengths = note.strengths || []
  const weaknesses = note.weaknesses || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-3xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{candidateName}</h2>
              <p className="text-xs text-slate-400">Candidate Note Detail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Rating</p>
              <StarRating rating={note.rating || 0} readonly size="lg" />
            </div>
            {note.createdAt && (
              <div className="ml-auto text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Date</p>
                <p className="text-sm font-medium text-slate-600">
                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {note.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.notes}</p>
              </div>
            </div>
          )}

          {note.interviewFeedback && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Interview Feedback
              </p>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{note.interviewFeedback}</p>
              </div>
            </div>
          )}

          {strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                Strengths
              </p>
              <div className="flex flex-wrap gap-2">
                {strengths.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold"
                  >
                    <Shield className="h-3 w-3" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {weaknesses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ShieldOff className="h-3.5 w-3.5 text-rose-500" />
                Weaknesses
              </p>
              <div className="flex flex-wrap gap-2">
                {weaknesses.map((w, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold"
                  >
                    <ShieldOff className="h-3 w-3" />
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {note.privateNotes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                Private Notes
              </p>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{note.privateNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NoteForm({ candidates, onSubmit, onCancel, initialData, saving }) {
  const [form, setForm] = useState(() => ({
    candidateId: initialData?.candidateId || '',
    rating: initialData?.rating || 3,
    notes: initialData?.notes || '',
    interviewFeedback: initialData?.interviewFeedback || '',
    strengths: initialData?.strengths || [],
    weaknesses: initialData?.weaknesses || [],
    privateNotes: initialData?.privateNotes || '',
  }))

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.candidateId) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Select Candidate *
        </label>
        <select
          value={form.candidateId}
          onChange={e => handleChange('candidateId', e.target.value)}
          required
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white"
        >
          <option value="">Choose a candidate...</option>
          {candidates.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} {c.jobTitle ? `- ${c.jobTitle}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Rating
        </label>
        <StarRating
          rating={form.rating}
          onRate={r => handleChange('rating', r)}
          size="lg"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
          rows={3}
          placeholder="General notes about the candidate..."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          Interview Feedback
        </label>
        <textarea
          value={form.interviewFeedback}
          onChange={e => handleChange('interviewFeedback', e.target.value)}
          rows={3}
          placeholder="Feedback from interviews..."
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          Strengths
        </label>
        <TagInput
          tags={form.strengths}
          onAdd={tag => handleChange('strengths', [...form.strengths, tag])}
          onRemove={tag => handleChange('strengths', form.strengths.filter(s => s !== tag))}
          placeholder="Add a strength..."
          colorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <ShieldOff className="h-3.5 w-3.5 text-rose-500" />
          Weaknesses
        </label>
        <TagInput
          tags={form.weaknesses}
          onAdd={tag => handleChange('weaknesses', [...form.weaknesses, tag])}
          onRemove={tag => handleChange('weaknesses', form.weaknesses.filter(w => w !== tag))}
          placeholder="Add a weakness..."
          colorClass="bg-rose-50 text-rose-700 border-rose-200"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5 text-amber-500" />
          Private Notes
        </label>
        <textarea
          value={form.privateNotes}
          onChange={e => handleChange('privateNotes', e.target.value)}
          rows={2}
          placeholder="Private notes only you can see..."
          className="w-full px-3 py-2.5 text-sm border border-amber-200 bg-amber-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || !form.candidateId}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initialData ? 'Update Note' : 'Save Note'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function RecruiterNotes() {
  const { user } = useContext(AuthContext)
  const [notes, setNotes] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [detailNote, setDetailNote] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [deletingId, setDeletingId] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [notesRes, appsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/api/notes`, { headers }),
        axios.get(`${API_URL}/api/applications/recruiter`, { headers }),
      ])

      if (notesRes.status === 'fulfilled') {
        setNotes(notesRes.value.data || [])
      } else {
        console.error('Notes fetch error:', notesRes.reason)
      }

      if (appsRes.status === 'fulfilled') {
        const apps = appsRes.value.data || []
        const candidateMap = new Map()
        apps.forEach(app => {
          const id = app.candidateId || app.candidate?._id || app.candidate
          const name = app.candidateName || app.candidate?.name || 'Unknown'
          if (id && !candidateMap.has(String(id))) {
            candidateMap.set(String(id), {
              id: String(id),
              name,
              jobTitle: app.jobTitle || app.job?.title || '',
            })
          }
        })
        setCandidates(Array.from(candidateMap.values()))
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load data. Please ensure the server is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredNotes = useMemo(() => {
    let result = [...notes]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n => {
        const name = (n.candidateName || n.candidate?.name || '').toLowerCase()
        const notesText = (n.notes || '').toLowerCase()
        const feedback = (n.interviewFeedback || '').toLowerCase()
        return name.includes(q) || notesText.includes(q) || feedback.includes(q)
      })
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        case 'date-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        case 'rating-desc':
          return (b.rating || 0) - (a.rating || 0)
        case 'rating-asc':
          return (a.rating || 0) - (b.rating || 0)
        default:
          return 0
      }
    })

    return result
  }, [notes, searchQuery, sortBy])

  const handleCreate = async (formData) => {
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.post(`${API_URL}/api/notes`, formData, { headers })
      setShowForm(false)
      await fetchData()
    } catch (err) {
      console.error('Create note error:', err)
      setError(err.response?.data?.message || 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (formData) => {
    if (!editingNote) return
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.put(`${API_URL}/api/notes/${editingNote._id}`, formData, { headers })
      setEditingNote(null)
      setShowForm(false)
      await fetchData()
    } catch (err) {
      console.error('Update note error:', err)
      setError(err.response?.data?.message || 'Failed to update note')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    setDeletingId(id)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      await axios.delete(`${API_URL}/api/notes/${id}`, { headers })
      await fetchData()
    } catch (err) {
      console.error('Delete note error:', err)
      setError('Failed to delete note')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (note) => {
    setEditingNote(note)
    setShowForm(true)
    setDetailNote(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingNote(null)
  }

  return (
    <main className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
            <StickyNote className="h-8 w-8 text-blue-600" />
            Candidate Notes
          </h1>
          <p className="text-slate-500 mt-2">
            Private notes, ratings, and feedback for your candidate evaluations.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingNote(null) }}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
        >
          {showForm ? <X className="h-4.5 w-4.5" /> : <Plus className="h-4.5 w-4.5" />}
          {showForm ? 'Close Form' : 'New Note'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            {editingNote ? (
              <>
                <Edit3 className="h-5 w-5 text-blue-600" />
                Edit Note
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-blue-600" />
                Create New Note
              </>
            )}
          </h3>
          <NoteForm
            candidates={candidates}
            onSubmit={editingNote ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
            initialData={editingNote}
            saving={saving}
          />
        </div>
      )}

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, notes, or feedback..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="pl-10 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white appearance-none cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="rating-desc">Highest Rating</option>
            <option value="rating-asc">Lowest Rating</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonNoteCard key={i} />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={searchQuery ? Search : StickyNote}
            title={searchQuery ? 'No matching notes' : 'No notes yet'}
            description={
              searchQuery
                ? 'Try adjusting your search query'
                : 'Create your first candidate note to get started with your evaluations'
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredNotes.map(note => (
            <NoteCard
              key={note._id}
              note={note}
              onClick={setDetailNote}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailNote && (
        <NoteDetail note={detailNote} onClose={() => setDetailNote(null)} />
      )}
    </main>
  )
}

export default RecruiterNotes
