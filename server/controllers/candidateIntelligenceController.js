/**
 * Candidate Intelligence Controller
 *
 * Exposes endpoints for recruiter and candidate access to unified candidate intelligence,
 * profile aggregation, and recruiter hiring actions.
 */

const { getCandidateIntelligence } = require('../services/candidateIntelligenceService')
const Application = require('../models/Application')
const Job = require('../models/Job')
const Resume = require('../models/Resume')
const User = require('../models/User')
const Notification = require('../models/Notification')

/**
 * GET /api/candidates/:candidateId/intelligence
 * GET /api/intelligence/candidate/:candidateId
 *
 * Retrieve unified candidate intelligence for a specific candidate.
 */
async function getCandidateIntelligenceHandler(req, res) {
  try {
    const { candidateId } = req.params
    const { jobId } = req.query

    // Access control: Recruiters can view any candidate. Candidates can only view themselves.
    if (req.user.role === 'candidate' && String(req.user.id) !== String(candidateId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own candidate profile.'
      })
    }

    const data = await getCandidateIntelligence(candidateId, jobId || null)

    res.json({
      success: true,
      data,
      message: 'Candidate intelligence profile loaded successfully'
    })
  } catch (error) {
    console.error('[CandidateIntelligenceController Error]:', error)
    const status = error.status || 500
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to load candidate intelligence'
    })
  }
}

/**
 * GET /api/candidates/me/intelligence
 * GET /api/intelligence/me
 *
 * Retrieve authenticated candidate's own intelligence profile.
 */
async function getMyIntelligenceHandler(req, res) {
  try {
    const candidateId = req.user.id
    const { jobId } = req.query

    const data = await getCandidateIntelligence(candidateId, jobId || null)

    res.json({
      success: true,
      data,
      message: 'Your candidate intelligence profile loaded successfully'
    })
  } catch (error) {
    console.error('[CandidateIntelligenceController Me Error]:', error)
    const status = error.status || 500
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to load candidate intelligence'
    })
  }
}

/**
 * POST /api/candidates/:candidateId/action
 *
 * Take recruiter action (Shortlist, Interview, Reject, Hire) on a candidate for a job.
 * Updates or creates the associated Application model record.
 */
async function takeRecruiterActionHandler(req, res) {
  try {
    const { candidateId } = req.params
    const { jobId, status, note, interviewDate, interviewType } = req.body

    const validStatuses = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Hired']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      })
    }

    const candidateUser = await User.findById(candidateId).select('name email').lean()
    if (!candidateUser) {
      return res.status(404).json({ success: false, message: 'Candidate not found' })
    }

    let application = null

    // If jobId provided, find or create application for this candidate + job
    if (jobId) {
      application = await Application.findOne({ candidateId, jobId })
      if (!application) {
        const job = await Job.findById(jobId).lean()
        const latestResume = await Resume.findOne({ userId: candidateId }).sort({ uploadedAt: -1 }).lean()

        application = new Application({
          candidateId,
          jobId,
          resumeId: latestResume?._id,
          candidateName: candidateUser.name || 'Candidate',
          candidateEmail: candidateUser.email || '',
          jobTitle: job?.title || 'Unknown Position',
          atsScore: latestResume?.atsScore || 0,
          matchScore: 0,
          status,
          timeline: [{
            status,
            changedAt: new Date(),
            changedBy: 'recruiter',
            note: note || `Application created and set to ${status}`
          }]
        })
      } else {
        application.status = status
        application.timeline.push({
          status,
          changedAt: new Date(),
          changedBy: 'recruiter',
          note: note || `Status updated to ${status}`
        })
      }
    } else {
      // If no specific jobId, find candidate's most recent application
      application = await Application.findOne({ candidateId }).sort({ createdAt: -1 })
      if (!application) {
        return res.status(400).json({
          success: false,
          message: 'No active application found for this candidate. Please select a specific Job to take action.'
        })
      }
      application.status = status
      application.timeline.push({
        status,
        changedAt: new Date(),
        changedBy: 'recruiter',
        note: note || `Status updated to ${status}`
      })
    }

    if (note) application.recruiterNotes = note
    if (interviewDate) application.interviewDate = new Date(interviewDate)
    if (interviewType) application.interviewType = interviewType

    await application.save()

    // Notify candidate
    try {
      await Notification.create({
        userId: candidateId,
        type: 'status_update',
        title: `Application Status: ${status}`,
        message: `Your application for ${application.jobTitle} has been updated to "${status}".`,
        link: '/candidate/applications',
        relatedId: application._id
      })
    } catch (_) {}

    res.json({
      success: true,
      data: application,
      message: `Candidate successfully moved to "${status}"`
    })
  } catch (error) {
    console.error('[CandidateAction Error]:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update candidate status'
    })
  }
}

module.exports = {
  getCandidateIntelligenceHandler,
  getMyIntelligenceHandler,
  takeRecruiterActionHandler
}
