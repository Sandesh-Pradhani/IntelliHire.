const express = require('express')
const User = require('../models/User')
const Job = require('../models/Job')
const Application = require('../models/Application')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query
    let query = {}
    if (role) query.role = role
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
    const total = await User.countDocuments(query)
    res.json({ users, total, page: Number(page), limit: Number(limit) })
  } catch (error) {
    console.error('[Admin Users Error]:', error)
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

router.put('/users/:id/role', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body
    const valid = ['candidate', 'recruiter', 'admin']
    if (!valid.includes(role)) return res.status(400).json({ message: 'Invalid role' })
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (error) {
    console.error('[Admin Role Error]:', error)
    res.status(500).json({ message: 'Failed to update role' })
  }
})

router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: 'User deleted' })
  } catch (error) {
    console.error('[Admin Delete User Error]:', error)
    res.status(500).json({ message: 'Failed to delete user' })
  }
})

router.get('/jobs', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name email').sort({ createdAt: -1 })
    res.json(jobs)
  } catch (error) {
    console.error('[Admin Jobs Error]:', error)
    res.status(500).json({ message: 'Failed to fetch jobs' })
  }
})

router.delete('/jobs/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })
    res.json({ message: 'Job deleted' })
  } catch (error) {
    console.error('[Admin Delete Job Error]:', error)
    res.status(500).json({ message: 'Failed to delete job' })
  }
})

router.get('/applications', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('candidateId', 'name email')
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 })
    res.json(applications)
  } catch (error) {
    console.error('[Admin Applications Error]:', error)
    res.status(500).json({ message: 'Failed to fetch applications' })
  }
})

router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalJobs = await Job.countDocuments()
    const totalApplications = await Application.countDocuments()
    const totalCandidates = await User.countDocuments({ role: 'candidate' })
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' })
    const activeJobs = await Job.countDocuments({ status: 'active' })
    const statusAgg = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    const statusCounts = {}
    statusAgg.forEach(s => { statusCounts[s._id] = s.count })
    res.json({ totalUsers, totalJobs, totalApplications, totalCandidates, totalRecruiters, activeJobs, statusCounts })
  } catch (error) {
    console.error('[Admin Stats Error]:', error)
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

router.get('/analytics', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const usersByRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    const jobsByStatus = await Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    const appsByStatus = await Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    const avgAts = await Application.aggregate([{ $group: { _id: null, avg: { $avg: '$atsScore' } } }])
    const recentApplications = await Application.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    const recentUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    res.json({
      usersByRole,
      jobsByStatus,
      appsByStatus,
      averageAtsScore: avgAts.length ? Math.round(avgAts[0].avg) : 0,
      recentApplications,
      recentUsers
    })
  } catch (error) {
    console.error('[Admin Analytics Error]:', error)
    res.status(500).json({ message: 'Failed to fetch analytics' })
  }
})

router.post('/users/:id/toggle-status', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.isActive = !user.isActive
    await user.save()
    res.json({ message: user.isActive ? 'User activated' : 'User banned', isActive: user.isActive })
  } catch (error) {
    console.error('[Admin Toggle Status Error]:', error)
    res.status(500).json({ message: 'Failed to toggle status' })
  }
})

module.exports = router
