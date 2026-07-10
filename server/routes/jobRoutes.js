const express = require('express')

const Job = require('../models/Job')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post(
    '/create',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
    try {
        const job = await Job.create({
            ...req.body,
            postedBy: req.user.id
        })
        res.status(201).json(job)
    } catch (error) {
        console.error('[Job Create Error]:', error)
        res.status(500).json({ message: 'Job creation failed' })
    }
})

router.get('/all', async (req, res) => {
    try {
        const { search, location, jobType, status, page = 1, limit = 10, sortBy = 'newest' } = req.query
        let query = {}

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }
        if (location && location !== 'All') query.location = location
        if (jobType && jobType !== 'All') query.jobType = jobType
        if (status && status !== 'All') query.status = status

        let sort = {}
        if (sortBy === 'newest') sort.createdAt = -1
        else if (sortBy === 'oldest') sort.createdAt = 1
        else if (sortBy === 'highestMatch') sort.applicantsCount = -1

        const jobs = await Job.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(Number(limit))

        const total = await Job.countDocuments(query)

        res.json({ jobs, total, page: Number(page), limit: Number(limit) })
    } catch (error) {
        console.error('[Jobs Fetch Error]:', error)
        res.status(500).json({ message: 'Failed to fetch jobs' })
    }
})

router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
        if (!job) return res.status(404).json({ message: 'Job not found' })
        res.json(job)
    } catch (error) {
        console.error('[Job Fetch Error]:', error)
        res.status(500).json({ message: 'Failed to fetch job' })
    }
})

router.get('/my-jobs', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 })
        res.json(jobs)
    } catch (error) {
        console.error('[My Jobs Fetch Error]:', error)
        res.status(500).json({ message: 'Failed to fetch your jobs' })
    }
})

router.put('/update/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true })
        if (!job) return res.status(404).json({ message: 'Job not found' })
        res.json(job)
    } catch (error) {
        console.error('[Job Update Error]:', error)
        res.status(500).json({ message: 'Job update failed' })
    }
})

router.patch('/archive/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, { status: 'archived' }, { new: true })
        if (!job) return res.status(404).json({ message: 'Job not found' })
        res.json(job)
    } catch (error) {
        console.error('[Job Archive Error]:', error)
        res.status(500).json({ message: 'Job archive failed' })
    }
})

router.patch('/close/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, { status: 'closed', closedAt: new Date() }, { new: true })
        if (!job) return res.status(404).json({ message: 'Job not found' })
        res.json(job)
    } catch (error) {
        console.error('[Job Close Error]:', error)
        res.status(500).json({ message: 'Job close failed' })
    }
})

router.patch('/reopen/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, { status: 'active', closedAt: null }, { new: true })
        if (!job) return res.status(404).json({ message: 'Job not found' })
        res.json(job)
    } catch (error) {
        console.error('[Job Reopen Error]:', error)
        res.status(500).json({ message: 'Job reopen failed' })
    }
})

router.delete('/delete/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id)
        if (!job) return res.status(404).json({ message: 'Job not found' })
        res.json({ message: 'Job deleted successfully' })
    } catch (error) {
        console.error('[Job Delete Error]:', error)
        res.status(500).json({ message: 'Job delete failed' })
    }
})

router.post('/clone/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const original = await Job.findById(req.params.id)
        if (!original) return res.status(404).json({ message: 'Job not found' })
        const cloned = await Job.create({
            title: original.title,
            company: original.company,
            description: original.description,
            requiredSkills: original.requiredSkills,
            experience: original.experience,
            location: original.location,
            jobType: original.jobType,
            salaryMin: original.salaryMin,
            salaryMax: original.salaryMax,
            postedBy: req.user.id,
            status: 'draft',
            applicantsCount: 0
        })
        res.status(201).json(cloned)
    } catch (error) {
        console.error('[Job Clone Error]:', error)
        res.status(500).json({ message: 'Failed to clone job' })
    }
})

router.patch('/publish/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
        if (!job) return res.status(404).json({ message: 'Job not found' })
        if (job.postedBy.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
        job.status = 'active'
        await job.save()
        res.json(job)
    } catch (error) {
        console.error('[Job Publish Error]:', error)
        res.status(500).json({ message: 'Failed to publish job' })
    }
})

module.exports = router