const express = require('express')
const Application = require('../models/Application')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

/**
 * GET /api/applications
 * Returns all applications with populated candidate, job, resume data
 * Sorted by newest first
 */
router.get(
    '/',
    authMiddleware,
    async (req, res) => {
        try {
            const applications = await Application.find()
                .populate('candidate', 'name email')
                .populate('job', 'title company description requiredSkills')
                .populate('resume', 'fileName extractedSkills atsScore')
                .sort({ createdAt: -1 })

            res.json(applications)
        } catch (error) {
            console.error('[Applications GET Error]:', error)
            res.status(500).json({
                message: 'Failed to fetch applications'
            })
        }
    }
)

/**
 * GET /api/applications/stats
 * Returns aggregate stats for the ATS dashboard
 */
router.get(
    '/stats',
    authMiddleware,
    async (req, res) => {
        try {
            const [
                totalApplications,
                statusCounts,
                avgMatchScore,
                totalJobs,
                totalResumes
            ] = await Promise.all([
                Application.countDocuments(),
                Application.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]),
                Application.aggregate([
                    {
                        $group: {
                            _id: null,
                            averageScore: { $avg: '$matchScore' }
                        }
                    }
                ]),
                // These are separate counts - we import the models
                require('../models/Job').countDocuments(),
                require('../models/Resume').countDocuments()
            ])

            // Build status map with defaults
            const statusMap = {
                Applied: 0,
                Shortlisted: 0,
                Interview: 0,
                Rejected: 0,
                Hired: 0
            }

            statusCounts.forEach(item => {
                statusMap[item._id] = item.count
            })

            res.json({
                totalApplications,
                statusCounts: statusMap,
                averageMatchScore: avgMatchScore.length > 0
                    ? Math.round(avgMatchScore[0].averageScore * 10) / 10
                    : 0,
                totalJobs,
                totalResumes
            })
        } catch (error) {
            console.error('[Applications Stats Error]:', error)
            res.status(500).json({
                message: 'Failed to fetch application stats'
            })
        }
    }
)

/**
 * GET /api/applications/:id
 * Returns a single application by ID
 */
router.get(
    '/:id',
    authMiddleware,
    async (req, res) => {
        try {
            const application = await Application.findById(req.params.id)
                .populate('candidate', 'name email')
                .populate('job', 'title company description requiredSkills')
                .populate('resume', 'fileName extractedSkills atsScore')

            if (!application) {
                return res.status(404).json({
                    message: 'Application not found'
                })
            }

            res.json(application)
        } catch (error) {
            console.error('[Applications GET By ID Error]:', error)
            res.status(500).json({
                message: 'Failed to fetch application'
            })
        }
    }
)

/**
 * PATCH /api/applications/:id/status
 * Update application status
 */
router.patch(
    '/:id/status',
    authMiddleware,
    async (req, res) => {
        try {
            const { status } = req.body

            const validStatuses = [
                'Applied',
                'Shortlisted',
                'Interview',
                'Rejected',
                'Hired'
            ]

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                })
            }

            const application = await Application.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            )
                .populate('candidate', 'name email')
                .populate('job', 'title company')
                .populate('resume', 'fileName')

            if (!application) {
                return res.status(404).json({
                    message: 'Application not found'
                })
            }

            res.json(application)
        } catch (error) {
            console.error('[Applications Status Update Error]:', error)
            res.status(500).json({
                message: 'Status update failed'
            })
        }
    }
)

/**
 * DELETE /api/applications/:id
 * Delete an application
 */
router.delete(
    '/:id',
    authMiddleware,
    async (req, res) => {
        try {
            const application = await Application.findByIdAndDelete(req.params.id)

            if (!application) {
                return res.status(404).json({
                    message: 'Application not found'
                })
            }

            res.json({
                message: 'Application deleted successfully'
            })
        } catch (error) {
            console.error('[Applications DELETE Error]:', error)
            res.status(500).json({
                message: 'Failed to delete application'
            })
        }
    }
)

/**
 * POST /api/applications
 * Manually create an application (for backward compatibility)
 */
router.post(
    '/',
    authMiddleware,
    async (req, res) => {
        try {
            const {
                candidateId,
                resumeId,
                jobId,
                candidateName,
                candidateEmail,
                jobTitle,
                atsScore,
                matchScore,
                matchedSkills,
                missingSkills,
                status
            } = req.body

            if (!candidateId || !jobId) {
                return res.status(400).json({
                    message: 'candidateId and jobId are required'
                })
            }

            // Check for duplicate
            const existing = await Application.findOne({
                candidate: candidateId,
                job: jobId
            })

            if (existing) {
                return res.status(409).json({
                    message: 'Application already exists for this candidate and job',
                    application: existing
                })
            }

            const application = await Application.create({
                candidate: candidateId,
                resume: resumeId,
                job: jobId,
                candidateName: candidateName || 'Unknown',
                candidateEmail: candidateEmail || 'Unknown',
                jobTitle: jobTitle || 'Unknown',
                atsScore: atsScore || 0,
                matchScore: matchScore || 0,
                matchedSkills: matchedSkills || [],
                missingSkills: missingSkills || [],
                status: status || 'Applied'
            })

            const populated = await Application.findById(application._id)
                .populate('candidate', 'name email')
                .populate('job', 'title company')
                .populate('resume', 'fileName')

            res.status(201).json(populated)
        } catch (error) {
            console.error('[Applications POST Error]:', error)
            res.status(500).json({
                message: 'Failed to create application'
            })
        }
    }
)

module.exports = router