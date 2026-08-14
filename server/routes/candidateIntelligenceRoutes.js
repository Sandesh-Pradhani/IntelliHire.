const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const User = require('../models/User')
const { buildCandidateTwin } = require('../services/candidateTwinService')
const CandidateMemory = require('../models/CandidateMemory')

const router = express.Router()

router.get('/me', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email').lean()
    if (!user) return res.status(404).json({ success: false, message: 'Candidate not found' })
    res.json({ success: true, data: await buildCandidateTwin(user) })
  } catch (error) {
    console.error('candidate twin error:', error)
    res.status(500).json({ success: false, message: 'Unable to build candidate intelligence profile' })
  }
})

router.get('/me/graph', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email').lean()
    if (!user) return res.status(404).json({ success: false, message: 'Candidate not found' })
    const twin = await buildCandidateTwin(user)
    res.json({ success: true, data: twin.knowledgeGraph })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to build knowledge graph' })
  }
})

router.get('/me/memory', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const memories = await CandidateMemory.find({ candidateId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean()
    res.json({ success: true, data: memories })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load candidate memory' })
  }
})

router.get('/candidate/:candidateId', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.candidateId, role: 'candidate' }).select('name email').lean()
    if (!user) return res.status(404).json({ success: false, message: 'Candidate not found' })
    res.json({ success: true, data: await buildCandidateTwin(user) })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to build candidate intelligence profile' })
  }
})

module.exports = router
