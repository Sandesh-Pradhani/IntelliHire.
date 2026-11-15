const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const User = require('../models/User')
const { getJobForRecruiter, rankForJob, buildInterviewPlan, buildLearningRoadmap } = require('../services/phaseThreeService')
const { recordCandidateMemory } = require('../services/candidateMemoryService')

const router = express.Router()

router.post('/recruiter/rank-job', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const job = await getJobForRecruiter(req.body.jobId, req.user.id)
    const rankings = await rankForJob(job, req.body.limit || 10)
    res.json({ success: true, data: { job: { id: String(job._id), title: job.title, company: job.company }, rankings, explanation: 'Ranking is decision support only. Review evidence and interview results before making any employment decision.' } })
  } catch (error) { res.status(error.message === 'Job not found' ? 404 : 500).json({ success: false, message: error.message === 'Job not found' ? error.message : 'Unable to rank candidates for this job.' }) }
})

router.post('/recruiter/interview-plan', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const job = await getJobForRecruiter(req.body.jobId, req.user.id)
    const data = await buildInterviewPlan(req.body.candidateId, job)
    res.json({ success: true, data })
  } catch (error) { res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, message: error.message || 'Unable to create interview plan.' }) }
})

router.post('/candidate/learning-roadmap', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const candidate = await User.findById(req.user.id).select('name email').lean()
    const data = await buildLearningRoadmap(candidate, req.body.targetRole, req.body.requiredSkills)
    await recordCandidateMemory({ candidateId: req.user.id, event: 'learning_roadmap_generated', entityType: 'learning_roadmap', summary: `Generated learning roadmap for ${data.targetRole}`, metadata: { missingSkills: data.missingSkills } })
    res.json({ success: true, data })
  } catch (error) { res.status(500).json({ success: false, message: 'Unable to generate learning roadmap.' }) }
})

module.exports = router
