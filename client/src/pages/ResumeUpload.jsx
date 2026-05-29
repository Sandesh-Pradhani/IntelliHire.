import { useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ResumeUpload = () => {
  const [file, setFile] = useState(null)
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
  const MAX_SIZE_MB = 10

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setError('')
    setSuccessMessage('')

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
      setFile(null)
      setSuccessMessage('Resume uploaded successfully!')

      // Reset file input by clearing the value
      const fileInput = document.getElementById('resume-input')
      if (fileInput) fileInput.value = ''
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Upload failed. Please try again.'
      setError(message)
      console.error('Upload error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-bold mb-10">IntelliHire AI</h1>

        {/* File Input */}
        <div className="w-full max-w-md mb-6">
          <input
            id="resume-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Selected file name */}
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-md mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="w-full max-w-md mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
            {successMessage}
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`px-6 py-2 rounded text-white font-medium transition-colors ${
            !file || loading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </span>
          ) : (
            'Upload Resume'
          )}
        </button>

        {/* Extracted Skills */}
        {skills.length > 0 && (
          <div className="mt-10 w-full max-w-md">
            <h2 className="text-3xl font-bold mb-4">Extracted Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ResumeUpload