const express = require('express')
const Application = require('../models/Application')
const Job = require('../models/Job')
const Resume = require('../models/Resume')
const User = require('../models/User')
const Interview = require('../models/Interview')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/recruiter', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const recruiterJobs = await Job.find({ postedBy: req.user.id })
    const jobIds = recruiterJobs.map(j => j._id)

    const applications = await Application.find({ jobId: { $in: jobIds } })

    const totalApps = applications.length
    const avgAts = totalApps
      ? Math.round(applications.reduce((sum, a) => sum + (a.atsScore || 0), 0) / totalApps)
      : 0

    const statusCounts = {}
    applications.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1 })

    const hiredCount = (statusCounts['Hired'] || 0) + (statusCounts['Accepted'] || 0)
    const rejectedCount = statusCounts['Rejected'] || 0
    const conversionRate = totalApps ? Math.round(((statusCounts['Interview'] || 0) / totalApps) * 100) : 0
    const offerRate = totalApps ? Math.round((hiredCount / totalApps) * 100) : 0

    const skillFreq = {}
    applications.forEach(a => {
      (a.matchedSkills || []).forEach(s => { skillFreq[s] = (skillFreq[s] || 0) + 1 })
    })
    const topSkills = Object.entries(skillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }))

    const sourceAgg = {}
    applications.forEach(a => {
      const src = a.matchedSkills && a.matchedSkills.length > 0 ? 'resume-match' : 'direct'
      sourceAgg[src] = (sourceAgg[src] || 0) + 1
    })

    const interviews = await Interview.find({ recruiterId: req.user.id })
    const avgInterviewTime = interviews.length
      ? Math.round(interviews.reduce((sum, i) => sum + (i.duration || 60), 0) / interviews.length)
      : 0

    res.json({
      totalJobs: recruiterJobs.length,
      totalApplications: totalApps,
      averageAtsScore: avgAts,
      statusCounts,
      conversionRate,
      offerRate,
      hiredCount,
      rejectedCount,
      topSkills,
      applicationSources: sourceAgg,
      averageInterviewDuration: avgInterviewTime
    })
  } catch (error) {
    console.error('[Recruiter Analytics Error]:', error)
    res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

router.get('/candidate', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.user.id }).populate('jobId', 'title')
    const totalApps = applications.length
    const statuses = {}
    applications.forEach(a => { statuses[a.status] = (statuses[a.status] || 0) + 1 })

    const interviewed = (statuses['Interview'] || 0) + (statuses['Technical Round'] || 0) + (statuses['HR Round'] || 0)
    const hired = (statuses['Hired'] || 0) + (statuses['Accepted'] || 0)
    const successRate = totalApps ? Math.round((hired / totalApps) * 100) : 0
    const interviewRate = totalApps ? Math.round((interviewed / totalApps) * 100) : 0

    const resume = await Resume.findOne({ userId: req.user.id })
    const skills = resume ? resume.extractedSkills : []

    const interviews = await Interview.find({ candidateId: req.user.id })

    res.json({
      totalApplications: totalApps,
      statusCounts: statuses,
      successRate,
      interviewRate,
      skills,
      totalInterviews: interviews.length,
      averageAtsScore: resume ? resume.atsScore : 0
    })
  } catch (error) {
    console.error('[Candidate Analytics Error]:', error)
    res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

router.get('/overview', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalJobs = await Job.countDocuments()
    const totalApps = await Application.countDocuments()
    const totalInterviews = await Interview.countDocuments()
    const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    const appsByStatus = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    const jobsByStatus = await Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    const weeklyUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    const weeklyApps = await Application.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    const avgAts = await Application.aggregate([{ $group: { _id: null, avg: { $avg: '$atsScore' } } }])

    res.json({
      totalUsers,
      totalJobs,
      totalApplications: totalApps,
      totalInterviews,
      usersByRole,
      appsByStatus,
      jobsByStatus,
      weeklyUsers,
      weeklyApplications: weeklyApps,
      averageAtsScore: avgAts.length ? Math.round(avgAts[0].avg) : 0
    })
  } catch (error) {
    console.error('[Overview Analytics Error]:', error)
    res.status(500).json({ message: 'Failed to fetch overview' })
  }
})

module.exports = router
