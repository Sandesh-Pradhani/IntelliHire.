const express = require('express')
const RecruiterNote = require('../models/RecruiterNote')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const { candidateId, applicationId, jobId, rating, notes, interviewFeedback, strengths, weaknesses, privateNotes } = req.body
    const note = await RecruiterNote.create({
      recruiterId: req.user.id,
      candidateId,
      applicationId,
      jobId,
      rating,
      notes,
      interviewFeedback,
      strengths,
      weaknesses,
      privateNotes
    })
    res.status(201).json(note)
  } catch (error) {
    console.error('[Note Create Error]:', error)
    res.status(500).json({ message: 'Failed to create note' })
  }
})

router.get('/', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const notes = await RecruiterNote.find({ recruiterId: req.user.id })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
    res.json(notes)
  } catch (error) {
    console.error('[Notes Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch notes' })
  }
})

router.get('/candidate/:candidateId', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const notes = await RecruiterNote.find({ recruiterId: req.user.id, candidateId: req.params.candidateId })
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
    res.json(notes)
  } catch (error) {
    console.error('[Candidate Notes Error]:', error)
    res.status(500).json({ message: 'Failed to fetch candidate notes' })
  }
})

router.put('/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const note = await RecruiterNote.findById(req.params.id)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    if (note.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    const updated = await RecruiterNote.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    console.error('[Note Update Error]:', error)
    res.status(500).json({ message: 'Failed to update note' })
  }
})

router.delete('/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const note = await RecruiterNote.findById(req.params.id)
    if (!note) return res.status(404).json({ message: 'Note not found' })
    if (note.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    await RecruiterNote.findByIdAndDelete(req.params.id)
    res.json({ message: 'Note deleted' })
  } catch (error) {
    console.error('[Note Delete Error]:', error)
    res.status(500).json({ message: 'Failed to delete note' })
  }
})

module.exports = router
