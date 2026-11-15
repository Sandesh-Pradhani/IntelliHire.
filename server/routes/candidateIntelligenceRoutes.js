const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const User = require('../models/User')
const CandidateMemory = require('../models/CandidateMemory')
const { buildCandidateTwin } = require('../services/candidateTwinService')
const {
  getCandidateIntelligenceHandler,
  getMyIntelligenceHandler,
  takeRecruiterActionHandler
} = require('../controllers/candidateIntelligenceController')

const router = express.Router()

// Candidate: Self intelligence
router.get('/me', authMiddleware, requireRole('candidate'), getMyIntelligenceHandler)
router.get('/me/intelligence', authMiddleware, requireRole('candidate'), getMyIntelligenceHandler)

// Candidate: Knowledge Graph & Memory
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

// Recruiter / Self: Unified Candidate Intelligence
router.get('/candidate/:candidateId', authMiddleware, getCandidateIntelligenceHandler)
router.get('/:candidateId/intelligence', authMiddleware, getCandidateIntelligenceHandler)
router.get('/:candidateId', authMiddleware, getCandidateIntelligenceHandler)

// Recruiter: Take Hiring Action (Shortlist, Interview, Reject, Hire)
router.post('/:candidateId/action', authMiddleware, requireRole('recruiter'), takeRecruiterActionHandler)

module.exports = router