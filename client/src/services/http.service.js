/**
 * Centralized HTTP Service Layer
 *
 * Every API request goes through this service.
 * Never use Axios directly inside React pages.
 *
 * Features:
 * - Auth token injection
 * - Error normalization
 * - Loading state tracking
 * - Response envelope parsing
 */
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Get auth token from localStorage.
 */
function getToken() {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

/**
 * Create headers with auth token if available.
 */
function createHeaders(extra = {}) {
  const token = getToken()
  const headers = { ...extra }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * Parse the standard API response envelope.
 * Supports both { success, data, message } and raw data responses.
 */
function parseResponse(response) {
  const body = response.data
  // Standard envelope: { success: true, data: {...}, message: "" }
  if (body && body.success !== undefined) {
    return {
      data: body.data ?? body,
      message: body.message || '',
      success: body.success,
    }
  }
  // Raw response
  return { data: body, message: '', success: true }
}

/**
 * Normalize errors to a standard format.
 */
function parseError(error) {
  if (error.response) {
    const body = error.response.data
    return {
      message: body?.message || body?.error || `Request failed with status ${error.response.status}`,
      status: error.response.status,
      data: body,
    }
  }
  if (error.request) {
    return { message: 'Network error. Server unavailable.', status: 0, data: null }
  }
  return { message: error.message || 'An unexpected error occurred', status: -1, data: null }
}

/**
 * HTTP Service exposing get, post, put, patch, delete methods.
 * Each method returns { data, message, success } or throws ServiceError.
 */
class HttpService {
  constructor() {
    this.baseURL = API_URL
  }

  async get(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: createHeaders(),
        params,
      })
      return parseResponse(response)
    } catch (error) {
      throw parseError(error)
    }
  }

  async post(endpoint, body = {}) {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, body, {
        headers: createHeaders({ 'Content-Type': 'application/json' }),
      })
      return parseResponse(response)
    } catch (error) {
      throw parseError(error)
    }
  }

  async postFormData(endpoint, formData) {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, formData, {
        headers: createHeaders({ 'Content-Type': 'multipart/form-data' }),
      })
      return parseResponse(response)
    } catch (error) {
      throw parseError(error)
    }
  }

  async put(endpoint, body = {}) {
    try {
      const response = await axios.put(`${this.baseURL}${endpoint}`, body, {
        headers: createHeaders({ 'Content-Type': 'application/json' }),
      })
      return parseResponse(response)
    } catch (error) {
      throw parseError(error)
    }
  }

  async patch(endpoint, body = {}) {
    try {
      const response = await axios.patch(`${this.baseURL}${endpoint}`, body, {
        headers: createHeaders({ 'Content-Type': 'application/json' }),
      })
      return parseResponse(response)
    } catch (error) {
      throw parseError(error)
    }
  }

  async delete(endpoint) {
    try {
      const response = await axios.delete(`${this.baseURL}${endpoint}`, {
        headers: createHeaders(),
      })
      return parseResponse(response)
    } catch (error) {
      throw parseError(error)
    }
  }
}

export const http = new HttpService()
export default http