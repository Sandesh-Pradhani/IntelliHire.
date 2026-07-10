const express = require('express')
const Notification = require('../models/Notification')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router()
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50)
    res.json(notifications)
  } catch (error) {
    console.error('[Notifications Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
})
router.post('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true })
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('[Notifications Mark All Error]:', error)
    res.status(500).json({ message: 'Failed to mark notifications as read' })
  }
})
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    )
    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    res.json(notification)
  } catch (error) {
    console.error('[Notification Read Error]:', error)
    res.status(500).json({ message: 'Failed to mark notification as read' })
  }
})

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, read: false })
    res.json({ count })
  } catch (error) {
    console.error('[Unread Count Error]:', error)
    res.status(500).json({ message: 'Failed to fetch unread count' })
  }
})

module.exports = router
