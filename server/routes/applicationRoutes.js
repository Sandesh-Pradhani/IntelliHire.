const express = require('express')
const Application = require('../models/Application')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

/**
 * POST /api/applications/apply
 * Submit a job application - candidate only
 */
router.post(
    '/apply',
    authMiddleware,
    requireRole('candidate'),
    async (req, res) => {
        try {
            const { jobId, resumeId } = req.body;
            const candidateId = req.user.id;

            if (!jobId) {
                return res.status(400).json({ message: 'jobId is required' });
            }

            // Check if job exists
            const Job = require('../models/Job');
            const jobDoc = await Job.findById(jobId);
            if (!jobDoc) {
                return res.status(404).json({ message: 'Job not found' });
            }

            // Check if candidate already applied
            const existing = await Application.findOne({ candidateId, jobId });
            if (existing) {
                return res.status(400).json({ message: 'You have already applied to this job' });
            }

            // Find resume
            const Resume = require('../models/Resume');
            let resumeDoc;
            if (resumeId) {
                resumeDoc = await Resume.findById(resumeId);
            } else {
                // Find latest resume for the user
                resumeDoc = await Resume.findOne({ userId: candidateId }).sort({ uploadedAt: -1 });
            }

            if (!resumeDoc) {
                return res.status(400).json({ message: 'Please upload a resume first' });
            }

            // Get user info
            const User = require('../models/User');
            const userDoc = await User.findById(candidateId);
            if (!userDoc) {
                return res.status(404).json({ message: 'User not found' });
            }

            // AI Matching / Skill overlay
            let matchScore = 50;
            let atsScore = resumeDoc.atsScore || 60;
            let matchedSkills = [];
            let missingSkills = [];

            try {
                const { matchCandidate } = require('../services/aiService');
                const result = await matchCandidate({
                    job: jobDoc.description,
                    resume: resumeDoc.extractedSkills.join(', '),
                    candidateSkills: resumeDoc.extractedSkills,
                    requiredSkills: jobDoc.requiredSkills || []
                });
                matchScore = result.finalScore || result.matchScore || matchScore;
                atsScore = result.atsScore || resumeDoc.atsScore || atsScore;
                matchedSkills = result.matchedSkills || [];
                missingSkills = result.missingSkills || [];
            } catch (err) {
                console.log('[Application Engine] AI Match failed, falling back to local intersection:', err.message);
                const jobDescLower = (jobDoc.title + ' ' + jobDoc.description).toLowerCase();
                const resumeSkills = resumeDoc.extractedSkills || [];
                matchedSkills = resumeSkills.filter(skill => jobDescLower.includes(skill.toLowerCase()));
                missingSkills = (jobDoc.requiredSkills || []).filter(skill => !matchedSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase()));
                if (resumeSkills.length > 0) {
                    matchScore = Math.round((matchedSkills.length / resumeSkills.length) * 100);
                } else {
                    matchScore = 40;
                }
                atsScore = resumeDoc.atsScore || 65;
            }

            const application = await Application.create({
                candidateId,
                resumeId: resumeDoc._id,
                jobId: jobDoc._id,
                candidateName: userDoc.name,
                candidateEmail: userDoc.email,
                jobTitle: jobDoc.title,
                atsScore,
                matchScore,
                matchedSkills,
                missingSkills,
                status: 'Applied'
            });

            res.status(201).json(application);
        } catch (error) {
            console.error('[Applications Apply Error]:', error);
            res.status(500).json({ message: 'Failed to submit application' });
        }
    }
);

/**
 * GET /api/applications/candidate
 * Get applications for current candidate - candidate only
 */
router.get(
    '/candidate',
    authMiddleware,
    requireRole('candidate'),
    async (req, res) => {
        try {
            const applications = await Application.find({ candidateId: req.user.id })
                .populate('candidateId', 'name email')
                .populate('jobId', 'title company description requiredSkills')
                .populate('resumeId', 'fileName extractedSkills atsScore')
                .sort({ createdAt: -1 });

            res.json(applications);
        } catch (error) {
            console.error('[Applications Candidate GET Error]:', error);
            res.status(500).json({ message: 'Failed to fetch candidate applications' });
        }
    }
);

/**
 * GET /api/applications/recruiter
 * Get all applications in system - recruiter only
 */
router.get(
    '/recruiter',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const applications = await Application.find()
                .populate('candidateId', 'name email')
                .populate('jobId', 'title company description requiredSkills')
                .populate('resumeId', 'fileName extractedSkills atsScore')
                .sort({ createdAt: -1 });

            res.json(applications);
        } catch (error) {
            console.error('[Applications Recruiter GET Error]:', error);
            res.status(500).json({ message: 'Failed to fetch recruiter applications' });
        }
    }
);

/**
 * PUT /api/applications/status/:id
 * Update application status - recruiter only
 */
router.put(
    '/status/:id',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { status } = req.body;
            const validStatuses = ['Applied', 'Shortlisted', 'Interview', 'Rejected', 'Hired'];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            const application = await Application.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            )
            .populate('candidateId', 'name email')
            .populate('jobId', 'title company')
            .populate('resumeId', 'fileName');

            if (!application) {
                return res.status(404).json({ message: 'Application not found' });
            }

            res.json(application);
        } catch (error) {
            console.error('[Applications Status PUT Error]:', error);
            res.status(500).json({ message: 'Failed to update application status' });
        }
    }
);

/**
 * GET /api/applications (Legacy/Fallback)
 * Returns applications based on user role
 */
router.get(
    '/',
    authMiddleware,
    async (req, res) => {
        try {
            const filter = req.user.role === 'candidate' ? { candidateId: req.user.id } : {};
            const applications = await Application.find(filter)
                .populate('candidateId', 'name email')
                .populate('jobId', 'title company description requiredSkills')
                .populate('resumeId', 'fileName extractedSkills atsScore')
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
 * Returns aggregate stats for the ATS dashboard - recruiter only
 */
router.get(
    '/stats',
    authMiddleware,
    requireRole('recruiter'),
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
 * GET /api/applications/:id (Legacy/Fallback)
 */
router.get(
    '/:id',
    authMiddleware,
    async (req, res) => {
        try {
            const application = await Application.findById(req.params.id)
                .populate('candidateId', 'name email')
                .populate('jobId', 'title company description requiredSkills')
                .populate('resumeId', 'fileName extractedSkills atsScore')

            if (!application) {
                return res.status(404).json({
                    message: 'Application not found'
                })
            }

            // Candidates can only view their own applications
            if (req.user.role === 'candidate' && String(application.candidateId._id) !== req.user.id) {
                return res.status(403).json({ message: 'Access denied' });
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
 * PATCH /api/applications/:id/status (Legacy/Fallback)
 */
router.patch(
    '/:id/status',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { status } = req.body
            const validStatuses = ['Applied', 'Shortlisted', 'Interview', 'Rejected', 'Hired']

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
                .populate('candidateId', 'name email')
                .populate('jobId', 'title company')
                .populate('resumeId', 'fileName')

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
 */
router.delete(
    '/:id',
    authMiddleware,
    requireRole('recruiter'),
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

module.exports = router