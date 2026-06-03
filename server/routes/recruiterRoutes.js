const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { matchCandidate } = require('../services/aiService');

const router = express.Router();

/**
 * POST /api/recruiter/match
 * Match a job description against a candidate's resume/skills
 */
router.post(
    '/match',
    authMiddleware,
    async (req, res) => {
        try {
            const { job, resume, candidateSkills, requiredSkills } = req.body;

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

            res.json(result);
        } catch (error) {
            console.error('[Recruiter Match Error]', error.message);
            res.status(500).json({
                message: 'Matching failed. Please try again later.'
            });
        }
    }
);

module.exports = router;