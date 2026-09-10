/**
 * Jobs Service
 *
 * Endpoints:
 * - GET  /api/jobs/all (with search, pagination)
 * - GET  /api/jobs/:id
 * - GET  /api/jobs/my-jobs (recruiter)
 * - POST /api/jobs/create (recruiter)
 * - PUT  /api/jobs/update/:id (recruiter)
 * - PATCH /api/jobs/archive/:id (recruiter)
 * - PATCH /api/jobs/close/:id (recruiter)
 * - PATCH /api/jobs/reopen/:id (recruiter)
 * - DELETE /api/jobs/delete/:id (recruiter)
 */
import http from './http.service'

export const jobsService = {
  async getAll(params = {}) {
    const res = await http.get('/api/jobs/all', params)
    return res.data
  },

  async getById(id) {
    const res = await http.get(`/api/jobs/${id}`)
    return res.data
  },

  async getMyJobs() {
    const res = await http.get('/api/jobs/my-jobs')
    return res.data
  },

  async create(jobData) {
    const res = await http.post('/api/jobs/create', jobData)
    return res.data
  },

  async update(id, jobData) {
    const res = await http.put(`/api/jobs/update/${id}`, jobData)
    return res.data
  },

  async archive(id) {
    const res = await http.patch(`/api/jobs/archive/${id}`)
    return res.data
  },

  async close(id) {
    const res = await http.patch(`/api/jobs/close/${id}`)
    return res.data
  },

  async reopen(id) {
    const res = await http.patch(`/api/jobs/reopen/${id}`)
    return res.data
  },

  async delete(id) {
    const res = await http.delete(`/api/jobs/delete/${id}`)
    return res.data
  },
}

export default jobsService