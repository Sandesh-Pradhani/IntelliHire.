const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { matchCandidate } = require('../services/aiService');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/recruiter/candidates
 * List all available candidates with their latest resume info.
 *
 * WHY THIS ENDPOINT:
 * Recruiters need to select from ALL candidates (not just those who
 * already applied to a specific job) to run AI matching.
 *
 * Returns:
 * - Candidate id, name, email
 * - Latest resume id, ATS score, extracted skills
 * - Application count (how many jobs they've applied to)
 */
router.get(
    '/candidates',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const candidates = await User.find({ role: 'candidate' })
                .select('name email createdAt')
                .sort({ createdAt: -1 })
                .lean();

            // Fetch latest resume for each candidate in parallel
            const candidateList = await Promise.all(
                candidates.map(async (candidate) => {
                    const latestResume = await Resume.findOne({ userId: candidate._id })
                        .sort({ uploadedAt: -1 })
                        .lean();

                    const applicationCount = await Application.countDocuments({ candidateId: candidate._id });

                    return {
                        _id: candidate._id,
                        name: candidate.name || 'Candidate',
                        email: candidate.email || '',
                        joinedAt: candidate.createdAt,
                        resumeId: latestResume?._id || null,
                        atsScore: latestResume?.atsScore || 0,
                        skills: latestResume?.extractedSkills || [],
                        hasResume: Boolean(latestResume),
                        applicationCount
                    };
                })
            );

            res.json(candidateList);
        } catch (error) {
            console.error('[Recruiter Candidates Error]:', error.message);
            res.status(500).json({ message: 'Failed to fetch candidates' });
        }
    }
);

/**
 * POST /api/recruiter/match
 * Match a job description against a candidate's resume/skills
 * Automatically creates an Application record after scoring
 *
 * Accepts either:
 *  - { jobId, candidateId }  → resolves job + resume text from DB
 *  - { jobId, resumeId }     → resolves job text from DB, uses resumeId
 *  - { job, resume }         → uses provided text directly
 */
router.post(
    '/match',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { jobId, resumeId, candidateId, job, resume, candidateSkills, requiredSkills } = req.body;

            // Resolve job text from DB if only jobId provided
            let jobText = job;
            let resolvedResumeId = resumeId;
            if (!jobText && jobId) {
                const jobDoc = await Job.findById(jobId).lean();
                if (!jobDoc) {
                    return res.status(404).json({ message: 'Job not found' });
                }
                jobText = `${jobDoc.title || ''} ${jobDoc.description || ''} ${(jobDoc.requiredSkills || []).join(' ')}`.trim();
            }

            // Resolve resume from candidateId if provided
            let resumeText = resume;
            if (!resumeText && candidateId) {
                const resumeDoc = await Resume.findOne({ userId: candidateId })
                    .sort({ uploadedAt: -1 })
                    .lean();
                if (!resumeDoc) {
                    return res.status(404).json({ message: 'No resume found for this candidate' });
                }
                resolvedResumeId = resumeDoc._id;
                resumeText = `${resumeDoc.fileName || ''} ${(resumeDoc.extractedSkills || []).join(' ')}`.trim();
            } else if (!resumeText && resolvedResumeId) {
                const resumeDoc = await Resume.findById(resolvedResumeId).lean();
                if (!resumeDoc) {
                    return res.status(404).json({ message: 'Resume not found' });
                }
                resumeText = `${resumeDoc.fileName || ''} ${(resumeDoc.extractedSkills || []).join(' ')}`.trim();
            }

            // --- Input validation ---
            if (!jobText || !resumeText) {
                return res.status(400).json({
                    message: 'Both job and resume are required. Provide jobId/candidateId or job/resume text.'
                });
            }

            const result = await matchCandidate({
                job: jobText,
                resume: resumeText,
                candidateSkills: candidateSkills || [],
                requiredSkills: requiredSkills || []
            });

            // --- Auto-create Application record if jobId and resolvedResumeId are available ---
            const matchedResumeId = candidateId ? resolvedResumeId : (resumeId || resolvedResumeId);
            if (jobId && matchedResumeId) {
                try {
                    const jobDoc = await Job.findById(jobId);
                    const resumeDoc = await Resume.findById(matchedResumeId);

                    if (jobDoc && resumeDoc) {
                        const candidateUser = await User.findById(resumeDoc.userId);

                        // Check if application already exists for this candidate + job
                        const existingApp = await Application.findOne({
                            candidateId: resumeDoc.userId,
                            jobId: jobId
                        });

                        if (!existingApp) {
                            const applicationData = {
                                candidateId: resumeDoc.userId,
                                resumeId: matchedResumeId,
                                jobId: jobId,
                                candidateName: candidateUser ? candidateUser.name : 'Unknown',
                                candidateEmail: candidateUser ? candidateUser.email : 'Unknown',
                                jobTitle: jobDoc.title || 'Unknown',
                                atsScore: result.atsScore || resumeDoc.atsScore || 0,
                                matchScore: result.finalScore || result.matchScore || 0,
                                matchedSkills: result.matchedSkills || [],
                                missingSkills: result.missingSkills || [],
                                status: 'Applied'
                            };

                            await Application.create(applicationData);
                            console.log(`[Application Engine] Created application for ${applicationData.candidateName} → ${applicationData.jobTitle}`);
                        } else {
                            // Update existing application with new scores
                            existingApp.atsScore = result.atsScore || resumeDoc.atsScore || existingApp.atsScore;
                            existingApp.matchScore = result.finalScore || result.matchScore || existingApp.matchScore;
                            existingApp.matchedSkills = result.matchedSkills || existingApp.matchedSkills;
                            existingApp.missingSkills = result.missingSkills || existingApp.missingSkills;
                            await existingApp.save();
                            console.log(`[Application Engine] Updated application scores for ${existingApp.candidateName}`);
                        }
                    }
                } catch (appErr) {
                    // Log but don't fail the matching response
                    console.error('[Application Engine] Error creating application record:', appErr.message);
                }
            }

            res.json({
                ...result,
                applicationCreated: !!(jobId && matchedResumeId)
            });
        } catch (error) {
            console.error('[Recruiter Match Error]', error.message);
            res.status(500).json({
                message: 'Matching failed. Please try again later.'
            });
        }
    }
);

module.exports = router;
