/**
 * AcademicForm — Reusable form for creating/editing academic profiles.
 *
 * Problem: Academic profile data entry needs a consistent, validated form.
 * Why this approach: Centralizes field definitions, validation, and submission logic.
 * Alternatives considered: Inline inputs on the page (duplicates logic across views).
 */
import { useState } from 'react'
import { Save, Loader2 } from 'lucide-react'

const INITIAL_STATE = {
  cgpa: '',
  branch: '',
  college: '',
  graduationYear: '',
  currentSemester: '',
  backlogs: 0,
}

const FIELDS = [
  { name: 'cgpa', label: 'CGPA', type: 'number', placeholder: 'e.g. 8.5', step: 0.01, min: 0, max: 10 },
  { name: 'branch', label: 'Branch', type: 'text', placeholder: 'e.g. Computer Science' },
  { name: 'college', label: 'College / University', type: 'text', placeholder: 'e.g. IIT Bombay' },
  { name: 'graduationYear', label: 'Graduation Year', type: 'number', placeholder: 'e.g. 2026', min: 2000, max: 2100 },
  { name: 'currentSemester', label: 'Current Semester', type: 'number', placeholder: 'e.g. 6', min: 1, max: 12 },
  { name: 'backlogs', label: 'Active Backlogs', type: 'number', placeholder: 'e.g. 0', min: 0 },
]

export default function AcademicForm({ initialData, onSubmit, loading }) {
  const [form, setForm] = useState(initialData || INITIAL_STATE)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`academic-${field.name}`}
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              {field.label}
            </label>
            <input
              id={`academic-${field.name}`}
              name={field.name}
              type={field.type}
              value={form[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              step={field.step}
              min={field.min}
              max={field.max}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Profile
          </>
        )}
      </button>
    </form>
  )
}