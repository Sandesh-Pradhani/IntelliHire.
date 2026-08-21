/**
 * ResumeBuilder Page
 *
 * Two-panel layout: Editor (left) + Live Preview (right).
 * Desktop: side-by-side. Mobile: toggle between editor and preview.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Eye,
  FileEdit,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import ROUTES from '../constants/routes'
import { resumeBuilderService } from '../services/resumeBuilder.service'
import ResumePreview from '../components/resume/ResumePreview'
import ResumeAtsAnalysis from '../components/resume/ResumeAtsAnalysis'

const INITIAL_STATE = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedIn: '', github: '', portfolio: '' },
  summary: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certificates: [],
  codingProfiles: { github: '', leetcode: '', hackerrank: '', problemsSolved: 0, ratings: {} },
  achievements: [],
  languages: [],
  links: [],
  templateId: 'classic-ats',
}

export default function ResumeBuilder() {
  const [resumeData, setResumeData] = useState(INITIAL_STATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [atsLoading, setAtsLoading] = useState(false)
  const [atsAnalysis, setAtsAnalysis] = useState(null)
  const [activeSection, setActiveSection] = useState('personalInfo')
  const [showPreview, setShowPreview] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [showJobModal, setShowJobModal] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [versions, setVersions] = useState([])
  const [alert, setAlert] = useState(null)

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 4000)
  }

  // Load resume data and versions
  useEffect(() => {
    async function load() {
      try {
        const [res, versionsRes] = await Promise.all([
          resumeBuilderService.getResumeBuilder(),
          resumeBuilderService.getVersions(),
        ])
        if (res) {
          setResumeData((prev) => ({ ...prev, ...res }))
        }
        if (versionsRes?.versions) {
          setVersions(versionsRes.versions)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Save
  const handleSave = async () => {
    setSaving(true)
    try {
      await resumeBuilderService.save(resumeData)
      showAlert('Resume saved successfully')
    } catch {
      showAlert('Failed to save resume', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Generate summary
  const handleGenerateSummary = async () => {
    setGenerating(true)
    try {
      const res = await resumeBuilderService.generateSummary({
        resumeData,
        jobDescription: jobDescription || null,
      })
      if (res?.summary) {
        setResumeData((prev) => ({ ...prev, summary: res.summary }))
        showAlert('Summary generated')
      }
    } catch {
      showAlert('Failed to generate summary', 'error')
    } finally {
      setGenerating(false)
    }
  }

  // ATS analysis
  const handleAtsAnalyze = async () => {
    setAtsLoading(true)
    try {
      const res = await resumeBuilderService.atsAnalyze({
        resumeData,
        jobDescription: jobDescription || null,
      })
      if (res) setAtsAnalysis(res)
    } catch {
      showAlert('Failed to run ATS analysis', 'error')
    } finally {
      setAtsLoading(false)
    }
  }

  // Export PDF
  const handleExportPdf = async () => {
    try {
      const blob = await resumeBuilderService.exportPdf(resumeData)
      if (!blob || blob.size === 0) {
        showAlert('PDF generation returned empty', 'error')
        return
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeData.personalInfo?.fullName || 'resume'}_resume.pdf`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      showAlert('PDF exported successfully')
    } catch {
      showAlert('Failed to export PDF', 'error')
    }
  }

  // Save version
  const handleSaveVersion = async () => {
    try {
      await resumeBuilderService.saveVersion(versionName || `Version ${versions.length + 1}`)
      setVersionName('')
      setShowVersionModal(false)
      const versionsRes = await resumeBuilderService.getVersions()
      if (versionsRes?.versions) setVersions(versionsRes.versions)
      showAlert('Version saved')
    } catch {
      showAlert('Failed to save version', 'error')
    }
  }

  // Restore version
  const handleRestoreVersion = async (id) => {
    try {
      const res = await resumeBuilderService.restoreVersion(id)
      if (res) {
        setResumeData((prev) => ({ ...prev, ...res }))
        showAlert('Version restored')
      }
    } catch {
      showAlert('Failed to restore version', 'error')
    }
  }

  // Re-init from profile
  const handleReinit = async () => {
    if (!window.confirm('Re-initialize from profile? This will reset your resume to profile defaults.')) return
    try {
      const res = await resumeBuilderService.initFromProfile()
      if (res) {
        setResumeData((prev) => ({ ...prev, ...res }))
        showAlert('Re-initialized from profile')
      }
    } catch {
      showAlert('Failed to re-initialize', 'error')
    }
  }

  // Update nested field
  const updateField = (path, value) => {
    setResumeData((prev) => {
      const copy = { ...prev }
      const keys = path.split('.')
      let obj = copy
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] }
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
      return copy
    })
  }

  // Add item to array
  const addArrayItem = (path, template) => {
    setResumeData((prev) => {
      const copy = { ...prev }
      const keys = path.split('.')
      let obj = copy
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] }
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = [...(obj[keys[keys.length - 1]] || []), template]
      return copy
    })
  }

  // Remove item from array
  const removeArrayItem = (path, index) => {
    setResumeData((prev) => {
      const copy = { ...prev }
      const keys = path.split('.')
      let obj = copy
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] }
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = obj[keys[keys.length - 1]].filter((_, i) => i !== index)
      return copy
    })
  }

  // Update array item
  const updateArrayItem = (path, index, field, value) => {
    setResumeData((prev) => {
      const copy = { ...prev }
      const keys = path.split('.')
      let obj = copy
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] }
        obj = obj[keys[i]]
      }
      const arr = [...obj[keys[keys.length - 1]]]
      arr[index] = { ...arr[index], [field]: value }
      obj[keys[keys.length - 1]] = arr
      return copy
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const sections = [
    { id: 'personalInfo', label: 'Personal Info' },
    { id: 'summary', label: 'Summary' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'codingProfiles', label: 'Coding Profiles' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'languages', label: 'Languages' },
    { id: 'links', label: 'Links' },
  ]

  return (
    <main className="space-y-6 animate-fade-in pb-12">
      {/* Alert */}
      {alert && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
          alert.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.CANDIDATE.DASHBOARD} className="rounded-xl p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <FileEdit className="h-6 w-6 text-blue-600" />
                Resume Builder
              </h1>
              <p className="text-sm text-slate-400">Build an ATS-friendly resume from your profile</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={handleReinit} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              Re-init
            </button>
            <button onClick={() => setShowVersionModal(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              <Save className="h-3.5 w-3.5" />
              Versions ({versions.length})
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
            <button onClick={handleExportPdf} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition-colors">
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Preview Toggle */}
      <div className="flex sm:hidden gap-2">
        <button
          onClick={() => setShowPreview(false)}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            !showPreview ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <FileEdit className="h-4 w-4" />
          Editor
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            showPreview ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* Main Content: Editor + Preview */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Editor */}
        <div className={`w-full sm:w-1/2 space-y-4 ${showPreview ? 'hidden sm:block' : ''}`}>
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-50 p-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeSection === s.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white hover:text-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Editor Panels */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            {activeSection === 'personalInfo' && (
              <PersonalInfoEditor data={resumeData.personalInfo} onChange={(field, val) => updateField(`personalInfo.${field}`, val)} />
            )}
            {activeSection === 'summary' && (
              <SummaryEditor
                data={resumeData.summary}
                onChange={(val) => updateField('summary', val)}
                onGenerate={handleGenerateSummary}
                generating={generating}
              />
            )}
            {activeSection === 'skills' && (
              <SkillsEditor data={resumeData.skills} onChange={(val) => updateField('skills', val)} />
            )}
            {activeSection === 'education' && (
              <ArrayEditor
                title="Education"
                items={resumeData.education}
                path="education"
                template={{ degree: '', institution: '', graduationYear: '', cgpa: '', branch: '' }}
                onAdd={() => addArrayItem('education', { degree: '', institution: '', graduationYear: '', cgpa: '', branch: '' })}
                onRemove={(i) => removeArrayItem('education', i)}
                onUpdate={(i, field, val) => updateArrayItem('education', i, field, val)}
                renderItem={(item, i) => (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Degree" value={item.degree} onChange={(v) => updateArrayItem('education', i, 'degree', v)} />
                    <Input label="Institution" value={item.institution} onChange={(v) => updateArrayItem('education', i, 'institution', v)} />
                    <Input label="Graduation Year" type="number" value={item.graduationYear} onChange={(v) => updateArrayItem('education', i, 'graduationYear', v)} />
                    <Input label="CGPA" type="number" value={item.cgpa} onChange={(v) => updateArrayItem('education', i, 'cgpa', v)} />
                    <Input label="Branch" value={item.branch} onChange={(v) => updateArrayItem('education', i, 'branch', v)} />
                  </div>
                )}
              />
            )}
            {activeSection === 'experience' && (
              <ArrayEditor
                title="Experience"
                items={resumeData.experience}
                path="experience"
                template={{ company: '', role: '', description: '', startDate: '', endDate: '', isCurrent: false, technologies: [] }}
                onAdd={() => addArrayItem('experience', { company: '', role: '', description: '', startDate: '', endDate: '', isCurrent: false, technologies: [] })}
                onRemove={(i) => removeArrayItem('experience', i)}
                onUpdate={(i, field, val) => updateArrayItem('experience', i, field, val)}
                renderItem={(item, i) => (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Company" value={item.company} onChange={(v) => updateArrayItem('experience', i, 'company', v)} />
                      <Input label="Role" value={item.role} onChange={(v) => updateArrayItem('experience', i, 'role', v)} />
                    </div>
                    <Textarea label="Description" value={item.description} onChange={(v) => updateArrayItem('experience', i, 'description', v)} rows={3} />
                    <Input label="Technologies (comma-separated)" value={(item.technologies || []).join(', ')} onChange={(v) => updateArrayItem('experience', i, 'technologies', v.split(',').map(s => s.trim()).filter(Boolean))} />
                  </div>
                )}
              />
            )}
            {activeSection === 'projects' && (
              <ArrayEditor
                title="Projects"
                items={resumeData.projects}
                path="projects"
                template={{ title: '', description: '', technologies: [], githubUrl: '', liveDemoUrl: '', role: '', duration: '' }}
                onAdd={() => addArrayItem('projects', { title: '', description: '', technologies: [], githubUrl: '', liveDemoUrl: '', role: '', duration: '' })}
                onRemove={(i) => removeArrayItem('projects', i)}
                onUpdate={(i, field, val) => updateArrayItem('projects', i, field, val)}
                renderItem={(item, i) => (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Title" value={item.title} onChange={(v) => updateArrayItem('projects', i, 'title', v)} />
                      <Input label="Role" value={item.role} onChange={(v) => updateArrayItem('projects', i, 'role', v)} />
                    </div>
                    <Textarea label="Description" value={item.description} onChange={(v) => updateArrayItem('projects', i, 'description', v)} rows={3} />
                    <Input label="Technologies (comma-separated)" value={(item.technologies || []).join(', ')} onChange={(v) => updateArrayItem('projects', i, 'technologies', v.split(',').map(s => s.trim()).filter(Boolean))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="GitHub URL" value={item.githubUrl} onChange={(v) => updateArrayItem('projects', i, 'githubUrl', v)} />
                      <Input label="Live Demo URL" value={item.liveDemoUrl} onChange={(v) => updateArrayItem('projects', i, 'liveDemoUrl', v)} />
                    </div>
                  </div>
                )}
              />
            )}
            {activeSection === 'certificates' && (
              <ArrayEditor
                title="Certificates"
                items={resumeData.certificates}
                path="certificates"
                template={{ name: '', issuer: '', issueDate: '', credentialUrl: '' }}
                onAdd={() => addArrayItem('certificates', { name: '', issuer: '', issueDate: '', credentialUrl: '' })}
                onRemove={(i) => removeArrayItem('certificates', i)}
                onUpdate={(i, field, val) => updateArrayItem('certificates', i, field, val)}
                renderItem={(item, i) => (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Name" value={item.name} onChange={(v) => updateArrayItem('certificates', i, 'name', v)} />
                    <Input label="Issuer" value={item.issuer} onChange={(v) => updateArrayItem('certificates', i, 'issuer', v)} />
                  </div>
                )}
              />
            )}
            {activeSection === 'codingProfiles' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Coding Profiles</h3>
                <Input label="GitHub Username" value={resumeData.codingProfiles?.github || ''} onChange={(v) => updateField('codingProfiles.github', v)} />
                <Input label="LeetCode Username" value={resumeData.codingProfiles?.leetcode || ''} onChange={(v) => updateField('codingProfiles.leetcode', v)} />
                <Input label="HackerRank Username" value={resumeData.codingProfiles?.hackerrank || ''} onChange={(v) => updateField('codingProfiles.hackerrank', v)} />
              </div>
            )}
            {activeSection === 'achievements' && (
              <ListEditor
                title="Achievements"
                items={resumeData.achievements || []}
                onAdd={() => updateField('achievements', [...(resumeData.achievements || []), ''])}
                onUpdate={(i, val) => {
                  const arr = [...(resumeData.achievements || [])]
                  arr[i] = val
                  updateField('achievements', arr)
                }}
                onRemove={(i) => updateField('achievements', (resumeData.achievements || []).filter((_, idx) => idx !== i))}
              />
            )}
            {activeSection === 'languages' && (
              <ArrayEditor
                title="Languages"
                items={resumeData.languages}
                path="languages"
                template={{ name: '', proficiency: 'Basic' }}
                onAdd={() => addArrayItem('languages', { name: '', proficiency: 'Basic' })}
                onRemove={(i) => removeArrayItem('languages', i)}
                onUpdate={(i, field, val) => updateArrayItem('languages', i, field, val)}
                renderItem={(item, i) => (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Language" value={item.name} onChange={(v) => updateArrayItem('languages', i, 'name', v)} />
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Proficiency</label>
                      <select
                        value={item.proficiency || 'Basic'}
                        onChange={(e) => updateArrayItem('languages', i, 'proficiency', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
                      >
                        <option>Basic</option>
                        <option>Conversational</option>
                        <option>Professional</option>
                        <option>Native</option>
                      </select>
                    </div>
                  </div>
                )}
              />
            )}
            {activeSection === 'links' && (
              <ArrayEditor
                title="Links"
                items={resumeData.links}
                path="links"
                template={{ title: '', url: '', platform: 'Other' }}
                onAdd={() => addArrayItem('links', { title: '', url: '', platform: 'Other' })}
                onRemove={(i) => removeArrayItem('links', i)}
                onUpdate={(i, field, val) => updateArrayItem('links', i, field, val)}
                renderItem={(item, i) => (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Title" value={item.title} onChange={(v) => updateArrayItem('links', i, 'title', v)} />
                    <Input label="URL" value={item.url} onChange={(v) => updateArrayItem('links', i, 'url', v)} />
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Platform</label>
                      <select
                        value={item.platform || 'Other'}
                        onChange={(e) => updateArrayItem('links', i, 'platform', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
                      >
                        <option>GitHub</option>
                        <option>LinkedIn</option>
                        <option>Portfolio</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                )}
              />
            )}
          </div>

          {/* AI Actions */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI Tools
            </h3>

            <button
              onClick={handleGenerateSummary}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Professional Summary
            </button>

            <button
              onClick={handleAtsAnalyze}
              disabled={atsLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              {atsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              Run ATS Analysis
            </button>

            <button
              onClick={() => setShowJobModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
            >
              <Target className="h-4 w-4" />
              Job-Specific Optimization
            </button>
          </div>
        </div>

        {/* Right: Preview + ATS */}
        <div className={`w-full sm:w-1/2 space-y-4 ${!showPreview ? 'hidden sm:block' : ''}`}>
          <div className="sticky top-4 space-y-4">
            <ResumePreview data={resumeData} />
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                ATS Analysis
              </h3>
              <ResumeAtsAnalysis analysis={atsAnalysis} loading={atsLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* Job Description Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Job-Specific Optimization</h3>
              <button onClick={() => setShowJobModal(false)} className="rounded-xl p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Paste a job description to optimize your resume for this role.</p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste job description here..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowJobModal(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => { setShowJobModal(false); handleAtsAnalyze() }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Analyze</button>
            </div>
          </div>
        </div>
      )}

      {/* Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Resume Versions</h3>
              <button onClick={() => setShowVersionModal(false)} className="rounded-xl p-1 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No versions saved yet</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                      <p className="text-xs text-slate-400">v{v.versionNumber} • {new Date(v.savedAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => { handleRestoreVersion(v.id); setShowVersionModal(false) }} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="Version name (optional)"
                className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
              />
              <button onClick={handleSaveVersion} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

// ── Editor Sub-Components ──

function PersonalInfoEditor({ data, onChange }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Personal Information</h3>
      <Input label="Full Name" value={data.fullName} onChange={(v) => onChange('fullName', v)} />
      <Input label="Email" type="email" value={data.email} onChange={(v) => onChange('email', v)} />
      <Input label="Phone" value={data.phone} onChange={(v) => onChange('phone', v)} />
      <Input label="Location" value={data.location} onChange={(v) => onChange('location', v)} />
      <Input label="LinkedIn URL" value={data.linkedIn} onChange={(v) => onChange('linkedIn', v)} />
      <Input label="GitHub URL" value={data.github} onChange={(v) => onChange('github', v)} />
      <Input label="Portfolio URL" value={data.portfolio} onChange={(v) => onChange('portfolio', v)} />
    </div>
  )
}

function SummaryEditor({ data, onChange, onGenerate, generating }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Professional Summary</h3>
        <button onClick={onGenerate} disabled={generating} className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 disabled:opacity-50">
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          AI Generate
        </button>
      </div>
      <textarea
        value={data}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Write a professional summary or use AI to generate one..."
        className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 resize-none"
      />
      <p className="text-xs text-slate-400">{(data || '').length}/600 characters</p>
    </div>
  )
}

function SkillsEditor({ data, onChange }) {
  const [input, setInput] = useState('')

  const addSkill = () => {
    if (input.trim() && !(data || []).includes(input.trim())) {
      onChange([...(data || []), input.trim()])
      setInput('')
    }
  }

  const removeSkill = (skill) => {
    onChange((data || []).filter((s) => s !== skill))
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">Skills</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          placeholder="Add a skill..."
          className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
        />
        <button onClick={addSkill} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(data || []).map((skill) => (
          <span key={skill} className="flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-medium">
            {skill}
            <button onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-blue-900">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function ArrayEditor({ title, items, onAdd, onRemove, renderItem }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <button onClick={onAdd} className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100">
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {(items || []).length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No {title.toLowerCase()} added yet</p>
      ) : (
        (items || []).map((item, i) => (
          <div key={i} className="rounded-xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">#{i + 1}</span>
              <button onClick={() => onRemove(i)} className="rounded-lg p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {renderItem(item, i)}
          </div>
        ))
      )}
    </div>
  )
}

function ListEditor({ title, items, onAdd, onUpdate, onRemove }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <button onClick={onAdd} className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100">
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No {title.toLowerCase()} added yet</p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(i, e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
            />
            <button onClick={() => onRemove(i)} className="rounded-lg p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))
      )}
    </div>
  )
}

function Input({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-400 resize-none"
      />
    </div>
  )
}
