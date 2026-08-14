/**
 * Project Service
 *
 * Problem solved: Provides a centralized API layer for all project-related
 * operations, keeping page components free of direct HTTP calls.
 *
 * Reason: Follows the service layer pattern established by portfolio.service.js
 * and codingProfileService.js. All project CRUD, AI scoring, and recruiter
 * browsing goes through this service.
 *
 * Alternative: Direct axios calls in pages — rejected because it violates the
 * service layer rule and makes testing harder.
 */

import http from './http.service'

const projectService = {
  // ── Candidate Project CRUD ──

  async getProjects(params = {}) {
    const res = await http.get('/api/portfolio/projects', params)
    return res.data
  },

  async getProject(id) {
    const res = await http.get(`/api/portfolio/projects/${id}`)
    return res.data
  },

  async createProject(data) {
    const res = await http.post('/api/portfolio/projects', data)
    return res.data
  },

  async updateProject(id, data) {
    const res = await http.put(`/api/portfolio/projects/${id}`, data)
    return res.data
  },

  async deleteProject(id) {
    const res = await http.delete(`/api/portfolio/projects/${id}`)
    return res.data
  },

  // ── AI Scoring ──

  async scoreProject(id) {
    const res = await http.post(`/api/portfolio/projects/${id}/score`)
    return res.data
  },

  // ── Portfolio Stats ──

  async getPortfolioStats() {
    const res = await http.get('/api/portfolio/projects/stats')
    return res.data
  },

  // ── Recruiter View ──

  async getRecruiterProjects(params = {}) {
    const res = await http.get('/api/recruiter/portfolio/projects', params)
    return res.data
  },
}

export default projectService
