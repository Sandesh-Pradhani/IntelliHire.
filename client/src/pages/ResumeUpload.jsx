import { useState } from 'react'
import axios from 'axios'

function ResumeUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)

  const ACCEPTED_TYPES = ['application/pdf']
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

  const handleFileSelect = (e) => {
    const selected = e.target.files[0]

    setError('')
    setSuccess('')
    setUploadedFile(null)

    if (!selected) {
      setFile(null)
      return
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Only PDF files are accepted.')
      setFile(null)
      return
    }

    if (selected.size > MAX_SIZE) {
      setError('File size must be under 5 MB.')
      setFile(null)
      return
    }

    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const token = localStorage.getItem('token')

      const response = await axios.post(
        'http://localhost:5000/api/resumes/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setSuccess(response.data.message || 'Resume uploaded successfully!')
      setUploadedFile(response.data.file)
      setFile(null)

      // Reset the file input
      document.getElementById('resume-input').value = ''
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Upload failed. Please try again.'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-slate-800">Upload Resume</h1>
        <p className="text-slate-500 mt-2">
          Upload your resume in PDF format for AI-powered analysis.
        </p>

        <div className="mt-8 space-y-5">
          {/* File Input */}
          <div>
            <label
              htmlFor="resume-input"
              className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-300 rounded-xl px-4 py-8 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <svg
                className="w-10 h-10 text-slate-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              {file ? (
                <p className="text-sm text-blue-600 font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-slate-500">
                    <span className="text-blue-600 font-medium">
                      Click to select
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF only, up to 5 MB</p>
                </>
              )}

              <input
                id="resume-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              {success}
            </div>
          )}

          {/* Uploaded File Info */}
          {uploadedFile && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-3 space-y-1">
              <p>
                <span className="font-medium">File:</span> {uploadedFile.originalname}
              </p>
              <p>
                <span className="font-medium">Size:</span>{' '}
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Uploading…
              </>
            ) : (
              'Upload'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResumeUpload