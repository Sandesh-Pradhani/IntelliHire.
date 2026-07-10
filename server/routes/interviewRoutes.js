const express = require('express')
const Interview = require('../models/Interview')
const Application = require('../models/Application')
const Notification = require('../models/Notification')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/create', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const { applicationId, candidateId, jobId, round, date, time, duration, location, meetLink, notes } = req.body
    const interview = await Interview.create({
      applicationId,
      candidateId,
      recruiterId: req.user.id,
      jobId,
      round,
      date,
      time,
      duration,
      location,
      meetLink,
      notes
    })
    try {
      await Notification.create({
        userId: candidateId,
        type: 'interview',
        title: 'Interview Scheduled',
        message: `You have a ${round} interview scheduled for ${new Date(date).toLocaleDateString()} at ${time}`,
        link: '/candidate/interviews',
        relatedId: interview._id
      })
    } catch (_) {}
    res.status(201).json(interview)
  } catch (error) {
    console.error('[Interview Create Error]:', error)
    res.status(500).json({ message: 'Failed to create interview' })
  }
})

router.get('/recruiter', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiterId: req.user.id })
      .populate('applicationId')
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ date: -1 })
    res.json(interviews)
  } catch (error) {
    console.error('[Interviews Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch interviews' })
  }
})

router.get('/candidate', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const interviews = await Interview.find({ candidateId: req.user.id })
      .populate('recruiterId', 'name')
      .populate('jobId', 'title')
      .sort({ date: -1 })
    res.json(interviews)
  } catch (error) {
    console.error('[Interviews Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch interviews' })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('applicationId')
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email')
      .populate('jobId', 'title company')
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    res.json(interview)
  } catch (error) {
    console.error('[Interview Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch interview' })
  }
})

router.put('/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    if (interview.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    const updated = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    console.error('[Interview Update Error]:', error)
    res.status(500).json({ message: 'Failed to update interview' })
  }
})

router.patch('/:id/status', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body
    const valid = ['Scheduled', 'Completed', 'Cancelled']
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' })
    const interview = await Interview.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    res.json(interview)
  } catch (error) {
    console.error('[Interview Status Error]:', error)
    res.status(500).json({ message: 'Failed to update interview status' })
  }
})

router.patch('/:id/response', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const { candidateResponse } = req.body
    const valid = ['Accepted', 'Rejected', 'Rescheduled']
    if (!valid.includes(candidateResponse)) return res.status(400).json({ message: 'Invalid response' })
    const interview = await Interview.findById(req.params.id)
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    if (interview.candidateId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    interview.candidateResponse = candidateResponse
    if (candidateResponse === 'Rejected') interview.status = 'Cancelled'
    if (candidateResponse === 'Rescheduled') interview.status = 'Rescheduled'
    await interview.save()
    res.json(interview)
  } catch (error) {
    console.error('[Interview Response Error]:', error)
    res.status(500).json({ message: 'Failed to update response' })
  }
})

router.delete('/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
    if (!interview) return res.status(404).json({ message: 'Interview not found' })
    if (interview.recruiterId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    await Interview.findByIdAndDelete(req.params.id)
    res.json({ message: 'Interview deleted' })
  } catch (error) {
    console.error('[Interview Delete Error]:', error)
    res.status(500).json({ message: 'Failed to delete interview' })
  }
})

module.exports = router
