/**
 * Resume Service
 *
 * Endpoints:
 * - POST /api/ai/upload-resume (candidate)
 * - GET  /api/ai/history (candidate)
 * - GET  /api/resumes/all
 */
import http from './http.service'

export const resumeService = {
  async upload(file) {
    const formData = new FormData()
    formData.append('resume', file)
    const res = await http.postFormData('/api/ai/upload-resume', formData)
    return res.data
  },

  async getHistory() {
    const res = await http.get('/api/ai/history')
    return res.data
  },

  async getAll() {
    const res = await http.get('/api/resumes/all')
    return res.data
  },
}

export default resumeService