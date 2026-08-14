import http from './http.service'

function toPayload(data) {
  if (data.evidence instanceof File) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      formData.append(key, Array.isArray(value) ? value.join(',') : value)
    })
    return formData
  }
  return data
}

const certificateService = {
  async getCertificates(params = {}) {
    const res = await http.get('/api/certificates', params)
    return res.data
  },

  async getStats() {
    const res = await http.get('/api/certificates/stats')
    return res.data
  },

  async createCertificate(data) {
    const payload = toPayload(data)
    const res = payload instanceof FormData
      ? await http.postFormData('/api/certificates', payload)
      : await http.post('/api/certificates', payload)
    return res.data
  },

  async updateCertificate(id, data) {
    const payload = toPayload(data)
    const res = payload instanceof FormData
      ? await http.putFormData(`/api/certificates/${id}`, payload)
      : await http.put(`/api/certificates/${id}`, payload)
    return res.data
  },

  async deleteCertificate(id) {
    const res = await http.delete(`/api/certificates/${id}`)
    return res.data
  },

  async verifyCertificate(id) {
    const res = await http.post(`/api/certificates/${id}/verify`)
    return res.data
  },

  async scoreCertificate(id, jobRequiredSkills = []) {
    const res = await http.post(`/api/certificates/${id}/score`, { jobRequiredSkills })
    return res.data
  },

  async getCandidateCertificates(candidateId, params = {}) {
    const res = await http.get(`/api/certificates/candidate/${candidateId}`, params)
    return res.data
  },
}

export default certificateService
