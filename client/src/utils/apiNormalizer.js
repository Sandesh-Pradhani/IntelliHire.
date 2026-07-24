/**
 * apiNormalizer.js
 *
 * Normalizes API responses to prevent runtime crashes from unexpected data shapes.
 * Every API response must be normalized before use.
 *
 * Problem: Backend sometimes returns { success: true, data: [] } instead of [],
 * returns null, returns {}, or returns undefined.
 *
 * Solution: Normalize every response through these utility functions.
 */

/**
 * normalizeArray — Guarantees an array is returned.
 *
 * Handles:
 *   - response.data (array)
 *   - response.data.data (nested)
 *   - null / undefined / object
 *   - { success: true, data: [...] }
 *
 * @param {any} data - The raw API response data
 * @returns {Array} - Always returns an array
 */
export function normalizeArray(data) {
  if (Array.isArray(data)) return data
  if (data === null || data === undefined) return []
  if (typeof data !== 'object') return []

  // Handle { success: true, data: [...] } pattern
  if (data.success !== undefined && data.data !== undefined) {
    if (Array.isArray(data.data)) return data.data
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.data)) return data.data.data
    return []
  }

  // Handle { data: [...] } pattern
  if (data.data !== undefined) {
    if (Array.isArray(data.data)) return data.data
    if (data.data && typeof data.data === 'object' && Array.isArray(data.data.data)) return data.data.data
    return []
  }

  // Handle object with numeric keys (e.g., { 0: {...}, 1: {...} })
  const keys = Object.keys(data)
  if (keys.length > 0 && keys.every(k => !isNaN(Number(k)))) {
    return Object.values(data)
  }

  return []
}

/**
 * normalizeObject — Guarantees an object is returned.
 *
 * @param {any} data - The raw API response data
 * @param {object} defaults - Default values to merge with
 * @returns {object} - Always returns an object
 */
export function normalizeObject(data, defaults = {}) {
  if (data === null || data === undefined) return { ...defaults }
  if (typeof data !== 'object' || Array.isArray(data)) return { ...defaults }
  return { ...defaults, ...data }
}

/**
 * normalizePagination — Normalizes paginated API responses.
 *
 * Expected shape:
 *   { data: [...], total: number, page: number, limit: number, totalPages: number }
 *
 * @param {any} response - The raw paginated response
 * @returns {{ items: Array, total: number, page: number, limit: number, totalPages: number }}
 */
export function normalizePagination(response) {
  const items = normalizeArray(response?.data || response)
  const total = response?.total ?? items.length
  const page = response?.page ?? 1
  const limit = response?.limit ?? items.length
  const totalPages = response?.totalPages ?? Math.ceil(total / limit)

  return { items, total, page, limit, totalPages }
}

/**
 * safeMap — Safely maps over an array, returning [] if data is not an array.
 *
 * @param {any} data - The data to map over
 * @param {Function} fn - The mapping function
 * @returns {Array}
 */
export function safeMap(data, fn) {
  if (!Array.isArray(data)) return []
  return data.map(fn)
}

/**
 * safeFilter — Safely filters an array, returning [] if data is not an array.
 *
 * @param {any} data - The data to filter
 * @param {Function} fn - The filter function
 * @returns {Array}
 */
export function safeFilter(data, fn) {
  if (!Array.isArray(data)) return []
  return data.filter(fn)
}

/**
 * safeReduce — Safely reduces an array, returning the initial value if data is not an array.
 *
 * @param {any} data - The data to reduce
 * @param {Function} fn - The reducer function
 * @param {any} initialValue - The initial accumulator value
 * @returns {any}
 */
export function safeReduce(data, fn, initialValue) {
  if (!Array.isArray(data)) return initialValue
  return data.reduce(fn, initialValue)
}

/**
 * safeFind — Safely finds an element in an array, returning undefined if not found or data is not an array.
 *
 * @param {any} data - The data to search
 * @param {Function} fn - The find function
 * @returns {any|undefined}
 */
export function safeFind(data, fn) {
  if (!Array.isArray(data)) return undefined
  return data.find(fn)
}

/**
 * safeForEach — Safely iterates over an array.
 *
 * @param {any} data - The data to iterate
 * @param {Function} fn - The callback function
 */
export function safeForEach(data, fn) {
  if (!Array.isArray(data)) return
  data.forEach(fn)
}

/**
 * normalizeResponse — Normalizes an entire axios response object.
 *
 * @param {object} response - The axios response object
 * @returns {{ data: Array|object, success: boolean, message: string }}
 */
export function normalizeResponse(response) {
  if (!response || !response.data) {
    return { data: [], success: false, message: 'No response data' }
  }

  const raw = response.data

  // If response.data is already an array
  if (Array.isArray(raw)) {
    return { data: raw, success: true, message: '' }
  }

  // If response.data is an object with success/data pattern
  if (typeof raw === 'object') {
    const data = raw.data !== undefined ? raw.data : raw
    return {
      data: Array.isArray(data) ? data : [],
      success: raw.success !== false,
      message: raw.message || ''
    }
  }

  return { data: [], success: false, message: 'Unexpected response format' }
}

export default {
  normalizeArray,
  normalizeObject,
  normalizePagination,
  safeMap,
  safeFilter,
  safeReduce,
  safeFind,
  safeForEach,
  normalizeResponse
}