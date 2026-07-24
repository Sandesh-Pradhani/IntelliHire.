/**
 * Notification Service
 *
 * Endpoints:
 * - GET  /api/notifications
 * - POST /api/notifications/mark-all-read
 * - PUT  /api/notifications/mark-read/:id
 * - DELETE /api/notifications/:id
 */
import http from './http.service'

export const notificationService = {
  async getNotifications() {
    const res = await http.get('/api/notifications')
    return res.data
  },

  async markAllRead() {
    const res = await http.post('/api/notifications/mark-all-read')
    return res.data
  },

  async markRead(id) {
    const res = await http.put(`/api/notifications/mark-read/${id}`)
    return res.data
  },

  async deleteNotification(id) {
    const res = await http.delete(`/api/notifications/${id}`)
    return res.data
  },
}

export default notificationService
