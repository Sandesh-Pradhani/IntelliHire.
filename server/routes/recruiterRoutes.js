const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { matchCandidate } = require('../services/aiService');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/recruiter/match
 * Match a job description against a candidate's resume/skills
 * Automatically creates an Application record after scoring
 */
router.post(
    '/match',
    authMiddleware,
    async (req, res) => {
        try {
            const { jobId, resumeId, job, resume, candidateSkills, requiredSkills } = req.body;

            // --- Input validation ---
            if (!job || !resume) {
                return res.status(400).json({
                    message: 'Both "job" and "resume" fields are required'
                });
            }

            const result = await matchCandidate({
                job,
                resume,
                candidateSkills: candidateSkills || [],
                requiredSkills: requiredSkills || []
            });

            // --- Auto-create Application record if jobId and resumeId are provided ---
            if (jobId && resumeId) {
                try {
                    const jobDoc = await Job.findById(jobId);
                    const resumeDoc = await Resume.findById(resumeId);

                    if (jobDoc && resumeDoc) {
                        const candidateUser = await User.findById(resumeDoc.userId);

                        // Check if application already exists for this candidate + job
                        const existingApp = await Application.findOne({
                            candidate: resumeDoc.userId,
                            job: jobId
                        });

                        if (!existingApp) {
                            const applicationData = {
                                candidate: resumeDoc.userId,
                                resume: resumeId,
                                job: jobId,
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
                applicationCreated: !!(jobId && resumeId)
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
