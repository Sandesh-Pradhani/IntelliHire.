/**
 * Authentication Service
 *
 * Endpoints:
 * - POST /api/auth/register
 * - POST /api/auth/login
 */
import http from './http.service'

export const authService = {
  async register({ name, email, password, role }) {
    const res = await http.post('/api/auth/register', { name, email, password, role })
    return res.data
  },

  async login({ email, password }) {
    const res = await http.post('/api/auth/login', { email, password })
    if (res.data?.token) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
    return res.data
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('sidebar_collapsed')
  },

  getToken() {
    try {
      return localStorage.getItem('token')
    } catch {
      return null
    }
  },

  getStoredUser() {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  isAuthenticated() {
    return !!this.getToken()
  },
}

export default authService