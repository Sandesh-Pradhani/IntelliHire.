/**
 * Dashboard Service
 *
 * Endpoints:
 * - GET /api/dashboard/candidate
 * - GET /api/dashboard/recruiter
 *
 * Note: If backend dashboard endpoints don't exist yet,
 * this service falls back to aggregating data from other services.
 */
import http from './http.service'
import applicationsService from './applications.service'
import resumeService from './resume.service'
import jobsService from './jobs.service'

export const dashboardService = {
  async getCandidateDashboard() {
    try {
      const res = await http.get('/api/dashboard/candidate')
      return res.data
    } catch {
      // Fallback: Aggregate from individual services
      const [apps, stats, resumes] = await Promise.allSettled([
        applicationsService.getCandidateApplications(),
        applicationsService.getCandidateStats(),
        resumeService.getHistory(),
      ])

      const applications = apps.status === 'fulfilled' ? (Array.isArray(apps.value) ? apps.value : []) : []
      const statsData = stats.status === 'fulfilled' ? stats.value : {}
      const resumeList = resumes.status === 'fulfilled' ? (Array.isArray(resumes.value) ? resumes.value : []) : []

      const shortlisted = applications.filter(
        (a) => ['Shortlisted', 'Hired', 'shortlisted', 'accepted'].includes(a.status)
      ).length

      const avgAts = resumeList.length > 0
        ? Math.round(resumeList.reduce((sum, r) => sum + (r.atsScore || 0), 0) / resumeList.length)
        : 0

      return {
        applications: applications.length,
        shortlisted,
        resumes: resumeList.length,
        averageAts: avgAts,
        stats: statsData,
      }
    }
  },

  async getRecruiterDashboard() {
    try {
      const res = await http.get('/api/dashboard/recruiter')
      return res.data
    } catch {
      // Fallback: Aggregate from individual services
      const [apps, stats, myJobs] = await Promise.allSettled([
        applicationsService.getRecruiterApplications(),
        applicationsService.getRecruiterStats(),
        jobsService.getMyJobs(),
      ])

      const applications = apps.status === 'fulfilled' ? (Array.isArray(apps.value) ? apps.value : []) : []
      const statsData = stats.status === 'fulfilled' ? stats.value : {}
      const jobList = myJobs.status === 'fulfilled' ? (Array.isArray(myJobs.value) ? myJobs.value : []) : []

      const shortlisted = applications.filter(
        (a) => ['Shortlisted', 'Hired', 'shortlisted', 'accepted'].includes(a.status)
      ).length

      const avgMatch = applications.length > 0
        ? Math.round(applications.reduce((sum, a) => sum + (a.matchScore || 0), 0) / applications.length)
        : 0

      return {
        jobs: jobList.length,
        applications: applications.length,
        shortlisted,
        averageMatch: avgMatch,
        stats: statsData,
      }
    }
  },
}

export default dashboardService