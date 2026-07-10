const express = require('express')
const Job = require('../models/Job')
const Resume = require('../models/Resume')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/candidates', authMiddleware, async (req, res) => {
  try {
    const { q, skills, experience, education, atsMin, atsMax, status } = req.query
    let userQuery = { role: 'candidate' }

    if (q) {
      userQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }

    const users = await User.find(userQuery).select('-password')
    const userIds = users.map(u => u._id)

    let resumeQuery = { userId: { $in: userIds } }
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim())
      resumeQuery.extractedSkills = { $in: skillList }
    }
    if (atsMin) resumeQuery.atsScore = { ...resumeQuery.atsScore, $gte: Number(atsMin) }
    if (atsMax) resumeQuery.atsScore = { ...resumeQuery.atsScore, $lte: Number(atsMax) }

    const resumes = await Resume.find(resumeQuery)
    const resumeUserIds = resumes.map(r => r.userId.toString())
    const filteredUsers = users.filter(u => resumeUserIds.includes(u._id.toString()))

    const enriched = filteredUsers.map(u => {
      const resume = resumes.find(r => r.userId.toString() === u._id.toString())
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        location: u.location,
        skills: resume ? resume.extractedSkills : [],
        atsScore: resume ? resume.atsScore : 0
      }
    })

    res.json(enriched)
  } catch (error) {
    console.error('[Search Candidates Error]:', error)
    res.status(500).json({ message: 'Failed to search candidates' })
  }
})

router.get('/jobs', async (req, res) => {
  try {
    const { q, location, jobType, experience, salaryMin, salaryMax, status, skills } = req.query
    let query = {}

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }
    if (location) query.location = { $regex: location, $options: 'i' }
    if (jobType) query.jobType = jobType
    if (experience) query.experience = { $lte: Number(experience) }
    if (salaryMin) query.salaryMin = { $gte: Number(salaryMin) }
    if (salaryMax) query.salaryMax = { $lte: Number(salaryMax) }
    if (status) query.status = status
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim())
      query.requiredSkills = { $in: skillList }
    }

    const jobs = await Job.find(query).populate('postedBy', 'name company').sort({ createdAt: -1 })
    res.json(jobs)
  } catch (error) {
    console.error('[Search Jobs Error]:', error)
    res.status(500).json({ message: 'Failed to search jobs' })
  }
})

module.exports = router
