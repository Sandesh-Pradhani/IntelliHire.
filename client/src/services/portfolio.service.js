/**
 * Portfolio Service
 *
 * Endpoints:
 * - Academic: GET/POST/PUT /api/academic
 * - Projects: GET/POST/PUT/DELETE /api/portfolio/projects
 * - Certificates: GET/POST/PUT/DELETE /api/portfolio/certificates
 * - Coding Profiles: GET/POST/PUT/DELETE /api/portfolio/coding-profiles
 * - Experience: GET/POST/PUT/DELETE /api/portfolio/experience
 * - Languages: GET/POST/PUT/DELETE /api/portfolio/languages
 * - Links: GET/POST/PUT/DELETE /api/portfolio/links
 * - Completion: GET /api/portfolio/completion
 */
import http from './http.service'

export const portfolioService = {
  // Academic
  async getAcademicProfile() {
    const res = await http.get('/api/academic')
    return res.data
  },

  async createAcademicProfile(data) {
    const res = await http.post('/api/academic', data)
    return res.data
  },

  async updateAcademicProfile(data) {
    const res = await http.put('/api/academic', data)
    return res.data
  },

  // Projects
  async getProjects() {
    const res = await http.get('/api/portfolio/projects')
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

  // Certificates
  async getCertificates() {
    const res = await http.get('/api/portfolio/certificates')
    return res.data
  },

  async createCertificate(data) {
    const res = await http.post('/api/portfolio/certificates', data)
    return res.data
  },

  async updateCertificate(id, data) {
    const res = await http.put(`/api/portfolio/certificates/${id}`, data)
    return res.data
  },

  async deleteCertificate(id) {
    const res = await http.delete(`/api/portfolio/certificates/${id}`)
    return res.data
  },

  // Coding Profiles
  async getCodingProfiles() {
    const res = await http.get('/api/portfolio/coding-profiles')
    return res.data
  },

  async createCodingProfile(data) {
    const res = await http.post('/api/portfolio/coding-profiles', data)
    return res.data
  },

  async updateCodingProfile(id, data) {
    const res = await http.put(`/api/portfolio/coding-profiles/${id}`, data)
    return res.data
  },

  async deleteCodingProfile(id) {
    const res = await http.delete(`/api/portfolio/coding-profiles/${id}`)
    return res.data
  },

  // Experience
  async getExperience() {
    const res = await http.get('/api/portfolio/experience')
    return res.data
  },

  async createExperience(data) {
    const res = await http.post('/api/portfolio/experience', data)
    return res.data
  },

  async updateExperience(id, data) {
    const res = await http.put(`/api/portfolio/experience/${id}`, data)
    return res.data
  },

  async deleteExperience(id) {
    const res = await http.delete(`/api/portfolio/experience/${id}`)
    return res.data
  },

  // Languages
  async getLanguages() {
    const res = http.get('/api/portfolio/languages')
    return (await res).data
  },

  async createLanguage(data) {
    const res = await http.post('/api/portfolio/languages', data)
    return res.data
  },

  async updateLanguage(id, data) {
    const res = await http.put(`/api/portfolio/languages/${id}`, data)
    return res.data
  },

  async deleteLanguage(id) {
    const res = await http.delete(`/api/portfolio/languages/${id}`)
    return res.data
  },

  // Portfolio Links
  async getLinks() {
    const res = await http.get('/api/portfolio/links')
    return res.data
  },

  async createLink(data) {
    const res = await http.post('/api/portfolio/links', data)
    return res.data
  },

  async updateLink(id, data) {
    const res = await http.put(`/api/portfolio/links/${id}`, data)
    return res.data
  },

  async deleteLink(id) {
    const res = await http.delete(`/api/portfolio/links/${id}`)
    return res.data
  },

  // Portfolio Completion
  async getCompletion() {
    const res = await http.get('/api/portfolio/completion')
    return res.data
  },
}

export default portfolioService
