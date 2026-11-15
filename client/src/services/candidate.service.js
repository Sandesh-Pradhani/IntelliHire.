/**
 * Candidate Service
 *
 * Aggregates candidate-specific operations.
 */
import applicationsService from './applications.service'
import resumeService from './resume.service'
import dashboardService from './dashboard.service'

export const candidateService = {
  async getDashboard() {
    return dashboardService.getCandidateDashboard()
  },

  async getApplications() {
    return applicationsService.getCandidateApplications()
  },

  async getStats() {
    return applicationsService.getCandidateStats()
  },

  async apply(jobId, resumeId) {
    return applicationsService.apply(jobId, resumeId)
  },

  async withdraw(id) {
    return applicationsService.withdraw(id)
  },

  async getResumeHistory() {
    return resumeService.getHistory()
  },
}

export default candidateService