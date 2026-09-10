const express = require('express')
const SavedJob = require('../models/SavedJob')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const router = express.Router()
router.post('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const { jobId } = req.body
    const existing = await SavedJob.findOne({ userId: req.user.id, jobId })
    if (existing) return res.status(400).json({ message: 'Job already saved' })
    const saved = await SavedJob.create({ userId: req.user.id, jobId })
    res.status(201).json(saved)
  } catch (error) {
    console.error('[SavedJobs Create Error]:', error)
    res.status(500).json({ message: 'Failed to save job' })
  }
})
router.get('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const saved = await SavedJob.find({ userId: req.user.id }).populate('jobId').sort({ createdAt: -1 })
    res.json(saved)
  } catch (error) {
    console.error('[SavedJobs Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch saved jobs' })
  }
})
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const saved = await SavedJob.findById(req.params.id)
    if (!saved) return res.status(404).json({ message: 'Saved job not found' })
    if (saved.userId.toString() !== req.user.id && req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' })
    }
    await SavedJob.findByIdAndDelete(req.params.id)
    res.json({ message: 'Job removed from saved list' })
  } catch (error) {
    console.error('[SavedJobs Delete Error]:', error)
    res.status(500).json({ message: 'Failed to remove saved job' })
  }
})
module.exports = router
