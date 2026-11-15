/**
 * Resume Builder Service
 *
 * All resume builder API calls go through this service.
 * Frontend never knows backend URL directly.
 *
 * Endpoints:
 * - GET  /api/resume-builder           - Load resume data
 * - POST /api/resume-builder/init      - Initialize from profile
 * - PUT  /api/resume-builder           - Save resume data
 * - POST /api/resume-builder/generate-summary  - AI summary
 * - POST /api/resume-builder/optimize   - AI optimize section
 * - POST /api/resume-builder/ats-analyze - ATS analysis
 * - POST /api/resume-builder/analyze-job - Job match analysis
 * - POST /api/resume-builder/export-pdf  - PDF export
 * - GET  /api/resume-builder/versions   - List versions
 * - POST /api/resume-builder/versions/save - Save version
 * - POST /api/resume-builder/versions/:id/restore - Restore version
 */
import axios from 'axios'
import http from './http.service'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const resumeBuilderService = {
  // ── Load ──
  async getResumeBuilder() {
    const res = await http.get('/api/resume-builder')
    return res.data
  },

  // ── Initialize from profile ──
  async initFromProfile() {
    const res = await http.post('/api/resume-builder/init')
    return res.data
  },

  // ── Save ──
  async save(data) {
    const res = await http.put('/api/resume-builder', data)
    return res.data
  },

  // ── AI: Generate Summary ──
  async generateSummary({ resumeData, jobDescription }) {
    const res = await http.post('/api/resume-builder/generate-summary', {
      resumeData,
      jobDescription: jobDescription || null,
    })
    return res.data
  },

  // ── AI: Optimize Section ──
  async optimizeSection({ section, content, resumeData, jobDescription }) {
    const res = await http.post('/api/resume-builder/optimize', {
      section,
      content,
      resumeData: resumeData || null,
      jobDescription: jobDescription || null,
    })
    return res.data
  },

  // ── AI: ATS Analysis ──
  async atsAnalyze({ resumeData, jobDescription }) {
    const res = await http.post('/api/resume-builder/ats-analyze', {
      resumeData,
      jobDescription: jobDescription || null,
    })
    return res.data
  },

  // ── AI: Job Match ──
  async analyzeJob({ resumeData, jobDescription }) {
    const res = await http.post('/api/resume-builder/analyze-job', {
      resumeData,
      jobDescription,
    })
    return res.data
  },

  // ── Export PDF (uses axios directly for blob response) ──
  async exportPdf(resumeData) {
    const response = await axios.post(`${API_URL}/api/resume-builder/export-pdf`, resumeData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      responseType: 'blob',
    })
    return response.data
  },

  // ── Versions ──
  async getVersions() {
    const res = await http.get('/api/resume-builder/versions')
    return res.data
  },

  async saveVersion(name) {
    const res = await http.post('/api/resume-builder/versions/save', { name })
    return res.data
  },

  async restoreVersion(versionId) {
    const res = await http.post(`/api/resume-builder/versions/${versionId}/restore`)
    return res.data
  },
}

export default resumeBuilderService
