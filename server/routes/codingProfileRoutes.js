const express = require('express')
const CodingProfile = require('../models/CodingProfile')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const codingProfile = await CodingProfile.create({ ...req.body, userId: req.user.id })
    res.status(201).json(codingProfile)
  } catch (error) {
    console.error('[CodingProfile Create Error]:', error)
    res.status(500).json({ message: 'Failed to create coding profile' })
  }
})

router.get('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const profiles = await CodingProfile.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(profiles)
  } catch (error) {
    console.error('[CodingProfiles Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch coding profiles' })
  }
})

router.get('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const profile = await CodingProfile.findById(req.params.id)
    if (!profile) return res.status(404).json({ message: 'Coding profile not found' })
    res.json(profile)
  } catch (error) {
    console.error('[CodingProfile Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch coding profile' })
  }
})

router.put('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const profile = await CodingProfile.findById(req.params.id)
    if (!profile) return res.status(404).json({ message: 'Coding profile not found' })
    if (profile.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    const updated = await CodingProfile.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    console.error('[CodingProfile Update Error]:', error)
    res.status(500).json({ message: 'Failed to update coding profile' })
  }
})

router.delete('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const profile = await CodingProfile.findById(req.params.id)
    if (!profile) return res.status(404).json({ message: 'Coding profile not found' })
    if (profile.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    await CodingProfile.findByIdAndDelete(req.params.id)
    res.json({ message: 'Coding profile deleted' })
  } catch (error) {
    console.error('[CodingProfile Delete Error]:', error)
    res.status(500).json({ message: 'Failed to delete coding profile' })
  }
})

module.exports = router
