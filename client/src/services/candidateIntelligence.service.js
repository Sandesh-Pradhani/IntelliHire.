/**
 * Candidate Intelligence Frontend Service
 *
 * Provides API helpers for fetching unified candidate intelligence
 * and taking recruiter status actions.
 */

import http from './http.service'

export const candidateIntelligenceService = {
  /**
   * Get unified intelligence for a candidate (optional jobId for job-specific evaluation)
   */
  async getCandidateIntelligence(candidateId, jobId = null) {
    const endpoint = `/api/candidates/${candidateId}/intelligence`
    const params = jobId ? { jobId } : {}
    const response = await http.get(endpoint, params)
    return response.data
  },

  /**
   * Get candidate's own intelligence profile
   */
  async getMyIntelligence(jobId = null) {
    const endpoint = '/api/candidates/me/intelligence'
    const params = jobId ? { jobId } : {}
    const response = await http.get(endpoint, params)
    return response.data
  },

  /**
   * Recruiter action: Shortlist, Interview, Reject, Hire
   */
  async takeRecruiterAction(candidateId, { jobId, status, note, interviewDate, interviewType }) {
    const endpoint = `/api/candidates/${candidateId}/action`
    const response = await http.post(endpoint, {
      jobId,
      status,
      note,
      interviewDate,
      interviewType
    })
    return response.data
  }
}

export default candidateIntelligenceService
