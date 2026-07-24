/**
 * Recruiter Service
 *
 * Aggregates recruiter-specific operations.
 */
import applicationsService from './applications.service'
import jobsService from './jobs.service'
import dashboardService from './dashboard.service'
import aiService from './ai.service'

export const recruiterService = {
  async getDashboard() {
    return dashboardService.getRecruiterDashboard()
  },

  async getApplications() {
    return applicationsService.getRecruiterApplications()
  },

  async getStats() {
    return applicationsService.getRecruiterStats()
  },

  async updateStatus(id, status, note = '') {
    return applicationsService.updateStatus(id, status, note)
  },

  async getMyJobs() {
    return jobsService.getMyJobs()
  },

  async getRankings() {
    return aiService.getRankings()
  },
}

export default recruiterService