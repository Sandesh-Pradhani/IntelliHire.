const express = require('express')
const Certificate = require('../models/Certificate')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const certificate = await Certificate.create({ ...req.body, userId: req.user.id })
    res.status(201).json(certificate)
  } catch (error) {
    console.error('[Certificate Create Error]:', error)
    res.status(500).json({ message: 'Failed to create certificate' })
  }
})

router.get('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(certificates)
  } catch (error) {
    console.error('[Certificates Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch certificates' })
  }
})

router.get('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
    res.json(certificate)
  } catch (error) {
    console.error('[Certificate Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch certificate' })
  }
})

router.put('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
    if (certificate.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    const updated = await Certificate.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    console.error('[Certificate Update Error]:', error)
    res.status(500).json({ message: 'Failed to update certificate' })
  }
})

router.delete('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
    if (certificate.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    await Certificate.findByIdAndDelete(req.params.id)
    res.json({ message: 'Certificate deleted' })
  } catch (error) {
    console.error('[Certificate Delete Error]:', error)
    res.status(500).json({ message: 'Failed to delete certificate' })
  }
})

module.exports = router
