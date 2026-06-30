import { useState } from 'react'
import axios from 'axios'

import { Upload, FileText, CheckCircle, AlertTriangle, Lightbulb, BarChart3, TrendingUp, Award, Sparkles } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ResumeUpload = () => {
  const [file, setFile] = useState(null)
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [atsBreakdown, setAtsBreakdown] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showAtsDetails, setShowAtsDetails] = useState(false)

  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
  const MAX_SIZE_MB = 10

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
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
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMessage('')

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const token = localStorage.getItem('token')

      const res = await axios.post(`${API_BASE}/api/ai/upload-resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      })

      const data = res.data.resume || res.data
      setSkills(data.extractedSkills || data.skills || [])
      setAtsBreakdown(data.atsBreakdown || null)
      setSuggestions(data.suggestions || [])
      setFile(null)
      setSuccessMessage('Resume uploaded successfully!')

      // If ATS breakdown is available, show details automatically
      if (data.atsBreakdown) {
        setShowAtsDetails(true)
      }

      const fileInput = document.getElementById('resume-input')
      if (fileInput) fileInput.value = ''
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Upload failed. Please try again.'
      setError(message)
      console.error('Upload error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * ATS score badge color based on score
   */
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
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Upload Resume</h1>
          <p className="text-sm text-slate-400 mt-0.5">Upload your resume for AI-powered analysis and ATS scoring</p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-8">
        <div className="w-full max-w-lg mx-auto">
          {/* File Input */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-300 transition-colors">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Drag and drop your resume here</p>
            <p className="text-xs text-slate-400 mb-4">or click to browse (PDF, DOC, DOCX — max 10MB)</p>
            <input
              id="resume-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            {file && (
              <p className="mt-3 text-sm text-slate-600">
                Selected: <span className="font-medium text-blue-600">{file.name}</span>
                <span className="text-slate-400 ml-2">({(file.size / 1024).toFixed(0)} KB)</span>
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`mt-6 w-full px-6 py-3.5 rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              !file || loading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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

      {/* Results Section */}
      {(skills.length > 0 || atsBreakdown) && (
        <div className="space-y-6">
          {/* Skills Badges */}
          {skills.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800">Extracted Skills</h2>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full ml-2">
                  {skills.length} found
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium px-3 py-1.5 rounded-xl">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ATS Breakdown */}
          {atsBreakdown && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-800">ATS Score Breakdown</h2>
                </div>
                <button
                  onClick={() => setShowAtsDetails(!showAtsDetails)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  {showAtsDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {/* Overall Score */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
                <div className={`text-4xl font-extrabold ${getScoreColor(atsBreakdown.overall || 0).split(' ')[0]}`}>
                  {atsBreakdown.overall || 0}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Overall ATS Score</p>
                  <p className="text-xs text-slate-400">Compatibility rating for applicant tracking systems</p>
                </div>
              </div>

              {/* Category Breakdown */}
              {showAtsDetails && atsBreakdown.breakdown && (
                <div className="space-y-4 mb-6">
                  {Object.entries(atsBreakdown.breakdown).map(([key, score]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-slate-700 capitalize">{key}</span>
                        <span className={`text-sm font-bold ${getScoreColor(score || 0).split(' ')[0]}`}>
                          {score || 0}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(score || 0)}`}
                          style={{ width: `${score || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Metrics */}
              {showAtsDetails && atsBreakdown.metrics && (
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl">
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-slate-700">{atsBreakdown.metrics.word_count || 0}</p>
                    <p className="text-xs text-slate-400">Words</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-slate-700">{atsBreakdown.metrics.skill_count || 0}</p>
                    <p className="text-xs text-slate-400">Skills</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-extrabold text-slate-700">{atsBreakdown.metrics.char_count || 0}</p>
                    <p className="text-xs text-slate-400">Characters</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-800">Suggestions to Improve</h2>
              </div>
              <ul className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="h-5 w-5 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                      {index + 1}
                    </span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!file && skills.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">Upload a resume to see AI-powered analysis</p>
        </div>
      )}
    </div>
  )
}

export default ResumeUpload