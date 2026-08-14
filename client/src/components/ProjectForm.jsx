/**
 * ProjectForm - Modal form for creating/editing projects
 *
 * Problem solved: Provides a complete, validated form for project CRUD
 * operations with all required and optional fields.
 *
 * Reason: Extracted from Portfolio.jsx to keep the form logic separate
 * from the page layout. Handles both create and edit modes.
 *
 * Alternative: Inline form in Portfolio page — rejected because it makes
 * the page component too large and harder to maintain.
 */

import { useState } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'AI/ML', 'Data Science',
  'DevOps', 'Backend', 'Frontend', 'Full Stack', 'Other'
]

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'planned', label: 'Planned' },
]

function ProjectForm({ project, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    technologies: project?.technologies?.join(', ') || '',
    githubUrl: project?.githubUrl || '',
    liveDemoUrl: project?.liveDemoUrl || '',
    category: project?.category || 'Other',
    duration: project?.duration || '',
    teamSize: project?.teamSize || 1,
    role: project?.role || '',
    status: project?.status || 'completed',
    isFeatured: project?.isFeatured || false,
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setSaving(true)
    try {
      const payload = {
        ...formData,
        technologies: formData.technologies
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        teamSize: parseInt(formData.teamSize) || 1,
      }
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {project ? 'Edit Project' : 'Add Project'}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title *
            </label>
            <input
              value={formData.title}
              onChange={handleChange('title')}
              placeholder="Project title"
              required
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Describe your project, its features, and technologies used..."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Technologies (comma separated)
            </label>
            <input
              value={formData.technologies}
              onChange={handleChange('technologies')}
              placeholder="React, Node.js, MongoDB, etc."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </label>
              <select
                value={formData.category}
                onChange={handleChange('category')}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                value={formData.status}
                onChange={handleChange('status')}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Duration
              </label>
              <input
                value={formData.duration}
                onChange={handleChange('duration')}
                placeholder="e.g. 3 months"
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Team Size
              </label>
              <input
                type="number"
                min="1"
                value={formData.teamSize}
                onChange={handleChange('teamSize')}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Your Role
            </label>
            <input
              value={formData.role}
              onChange={handleChange('role')}
              placeholder="e.g. Full Stack Developer, Team Lead"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              GitHub URL
            </label>
            <input
              value={formData.githubUrl}
              onChange={handleChange('githubUrl')}
              placeholder="https://github.com/username/repo"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Live Demo URL
            </label>
            <input
              value={formData.liveDemoUrl}
              onChange={handleChange('liveDemoUrl')}
              placeholder="https://your-project.vercel.app"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={handleChange('isFeatured')}
              className="rounded"
            />
            Featured project
          </label>

          <button
            type="submit"
            disabled={saving || !formData.title.trim()}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </span>
            ) : project ? 'Update Project' : 'Add Project'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProjectForm
