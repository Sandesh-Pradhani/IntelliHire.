const express = require('express')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    console.error('[Settings Profile Error]:', error)
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, location, bio, avatar } = req.body
    const updated = await User.findByIdAndUpdate(req.user.id, { name, phone, location, bio, avatar }, { new: true }).select('-password')
    res.json(updated)
  } catch (error) {
    console.error('[Settings Update Error]:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (error) {
    console.error('[Settings Password Error]:', error)
    res.status(500).json({ message: 'Failed to update password' })
  }
})

router.put('/theme', authMiddleware, async (req, res) => {
  try {
    const { theme } = req.body
    const valid = ['light', 'dark', 'system']
    if (!valid.includes(theme)) return res.status(400).json({ message: 'Invalid theme' })
    const user = await User.findByIdAndUpdate(req.user.id, { theme }, { new: true }).select('-password')
    res.json(user)
  } catch (error) {
    console.error('[Settings Theme Error]:', error)
    res.status(500).json({ message: 'Failed to update theme' })
  }
})

router.put('/notifications', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { notificationPrefs: req.body }, { new: true }).select('-password')
    res.json(user)
  } catch (error) {
    console.error('[Settings Notifications Error]:', error)
    res.status(500).json({ message: 'Failed to update notifications' })
  }
})

router.put('/privacy', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, { privacy: req.body }, { new: true }).select('-password')
    res.json(user)
  } catch (error) {
    console.error('[Settings Privacy Error]:', error)
    res.status(500).json({ message: 'Failed to update privacy' })
  }
})

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id)
    res.json({ message: 'Account deleted' })
  } catch (error) {
    console.error('[Settings Delete Error]:', error)
    res.status(500).json({ message: 'Failed to delete account' })
  }
})

module.exports = router
