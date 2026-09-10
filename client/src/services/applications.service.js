/**
 * Applications Service
 *
 * Endpoints:
 * - GET  /api/applications/recruiter (recruiter)
 * - GET  /api/applications/candidate (candidate)
 * - POST /api/applications/apply (candidate)
 * - PUT  /api/applications/withdraw/:id (candidate)
 * - PUT  /api/applications/status/:id (recruiter)
 * - GET  /api/applications/stats (recruiter)
 * - GET  /api/applications/candidate/stats (candidate)
 */
import http from './http.service'

export const applicationsService = {
  // Recruiter
  async getRecruiterApplications() {
    const res = await http.get('/api/applications/recruiter')
    return res.data
  },

  async getRecruiterStats() {
    const res = await http.get('/api/applications/stats')
    return res.data
  },

  async updateStatus(id, status, note = '') {
    const res = await http.put(`/api/applications/status/${id}`, { status, note })
    return res.data
  },

  // Candidate
  async getCandidateApplications() {
    const res = await http.get('/api/applications/candidate')
    return res.data
  },

  async getCandidateStats() {
    const res = await http.get('/api/applications/candidate/stats')
    return res.data
  },

  async apply(jobId, resumeId) {
    const res = await http.post('/api/applications/apply', { jobId, resumeId })
    return res.data
  },

  async withdraw(id) {
    const res = await http.put(`/api/applications/withdraw/${id}`)
    return res.data
  },
}

export default applicationsService