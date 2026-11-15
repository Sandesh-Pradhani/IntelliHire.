const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const User = require('../models/User')
const { searchCandidates, answerCandidateQuestion } = require('../services/copilotService')
const { recordCandidateMemory } = require('../services/candidateMemoryService')

const router = express.Router()

router.post('/recruiter/query', authMiddleware, requireRole('recruiter'), async (req, res) => {
  const query = String(req.body.query || '').trim()
  if (query.length < 2) return res.status(400).json({ success: false, message: 'Ask the Copilot about a candidate skill, role, or requirement.' })
  try {
    const results = await searchCandidates(query, req.body.limit || 8)
    res.json({ success: true, data: { query, results, explanation: `Ranked by matching evidence from skills, projects, experience, certificates, and resumes. ${results[0]?.method === 'sbert-semantic' ? 'SBERT semantic similarity was used.' : 'Local evidence matching was used because the AI engine was unavailable.'}` } })
  } catch (error) {
    console.error('recruiter copilot error:', error.message)
    res.status(500).json({ success: false, message: 'Recruiter Copilot could not complete this search.' })
  }
})

router.post('/candidate/query', authMiddleware, requireRole('candidate'), async (req, res) => {
  const question = String(req.body.question || '').trim()
  if (question.length < 2) return res.status(400).json({ success: false, message: 'Ask your career coach a question.' })
  try {
    const candidate = await User.findById(req.user.id).select('name email').lean()
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' })
    const data = await answerCandidateQuestion(candidate, question)
    await recordCandidateMemory({ candidateId: req.user.id, event: 'copilot_question', entityType: 'copilot', summary: `Asked AI Coach: ${question.slice(0, 180)}`, metadata: { topic: question.slice(0, 80) } })
    res.json({ success: true, data })
  } catch (error) {
    console.error('candidate copilot error:', error.message)
    res.status(500).json({ success: false, message: 'AI Coach could not answer this question.' })
  }
})

module.exports = router
