import { useState } from 'react'
import { AlertTriangle, Award, BarChart3, CheckCircle, FileText, Lightbulb, Sparkles, Upload } from 'lucide-react'
import resumeService from '../services/resume.service'
import { normalizeArray } from '../utils/apiNormalizer'
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]
const MAX_SIZE_MB = 5

function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [atsBreakdown, setAtsBreakdown] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showAtsDetails, setShowAtsDetails] = useState(false)

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]
    setError('')
    setSuccessMessage('')
    setAtsBreakdown(null)
    setSuggestions([])
    setShowAtsDetails(false)

    if (!selectedFile) {
      setFile(null)
      return
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF or Word document.')
      setFile(null)
      return
    }

    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB}MB. Please choose a smaller file.`)
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const data = await resumeService.upload(file)
      const resumeData = data.resume || data
      setSkills(normalizeArray(resumeData.extractedSkills || resumeData.skills))
      setAtsBreakdown(resumeData.atsBreakdown || null)
      setSuggestions(normalizeArray(resumeData.suggestions))
      setFile(null)
      setSuccessMessage('Resume uploaded successfully!')
      setShowAtsDetails(Boolean(resumeData.atsBreakdown))

      const fileInput = document.getElementById('resume-input')
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (err) {
      const message = err?.message || 'Upload failed. Please try again.'
      setError(message)
      console.error('Upload error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="pb-12 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Upload Resume</h1>
          <p className="mt-0.5 text-sm text-slate-400">Upload your resume for AI-powered analysis and ATS scoring.</p>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center transition-colors hover:border-blue-300">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <FileText className="h-7 w-7 text-blue-500" />
            </div>
            <p className="mb-1 text-sm font-semibold text-slate-700">Drag and drop your resume here</p>
            <p className="mb-4 text-xs text-slate-400">or click to browse (PDF, DOC, DOCX - max 10MB)</p>
            <input
              id="resume-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {file ? (
              <p className="mt-3 text-sm text-slate-600">
                Selected: <span className="font-medium text-blue-600">{file.name}</span>
                <span className="ml-2 text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white transition-all duration-200 ${
              !file || loading
                ? 'cursor-not-allowed bg-blue-300'
                : 'bg-blue-600 shadow-lg shadow-blue-200 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing with AI Engine...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload and Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {(skills.length > 0 || atsBreakdown) ? (
        <div className="space-y-6">
          {skills.length > 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800">Extracted Skills</h2>
                <span className="ml-2 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-400">
                  {skills.length} found
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={`${skill}-${index}`} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {atsBreakdown ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-800">ATS Score Breakdown</h2>
                </div>
                <button type="button" onClick={() => setShowAtsDetails((value) => !value)} className="text-xs font-semibold text-blue-600 hover:underline">
                  {showAtsDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className={`text-4xl font-extrabold ${getScoreColor(atsBreakdown.overall || 0).split(' ')[0]}`}>
                  {atsBreakdown.overall || 0}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Overall ATS Score</p>
                  <p className="text-xs text-slate-400">Compatibility rating for applicant tracking systems</p>
                </div>
              </div>

              {showAtsDetails && atsBreakdown.breakdown ? (
                <div className="mb-6 space-y-4">
                  {Object.entries(atsBreakdown.breakdown).map(([key, score]) => (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-sm font-semibold capitalize text-slate-700">{key}</span>
                        <span className={`text-sm font-bold ${getScoreColor(score || 0).split(' ')[0]}`}>
                          {score || 0}/100
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(score || 0)}`} style={{ width: `${score || 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {showAtsDetails && atsBreakdown.metrics ? (
                <div className="grid grid-cols-3 gap-4 rounded-2xl bg-slate-50 p-4">
                  <Metric label="Words" value={atsBreakdown.metrics.word_count || 0} />
                  <Metric label="Skills" value={atsBreakdown.metrics.skill_count || 0} />
                  <Metric label="Characters" value={atsBreakdown.metrics.char_count || 0} />
                </div>
              ) : null}
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-800">Suggestions to Improve</h2>
              </div>
              <ul className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-700">
                      {index + 1}
                    </span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        !file && !loading && !error ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <Sparkles className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">Upload a resume to see AI-powered analysis.</p>
          </div>
        ) : null
      )}
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-lg font-extrabold text-slate-700">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}

export default ResumeUpload
