const express = require('express')
const axios = require('axios')
const upload = require('../middleware/uploadMiddleware')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const Resume = require('../models/Resume')
const Job = require('../models/Job')
const fs = require('fs')
const pdf = require('pdf-parse')
const { recordCandidateMemory } = require('../services/candidateMemoryService')
const router = express.Router()

/**
 * Helper: Call AI Engine and extract data from standard envelope.
 */
const callAiEngine = async (endpoint, payload) => {
  const aiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000'
  const response = await axios.post(`${aiUrl}${endpoint}`, payload)
  // Phase 3: response.data may have { success, data, message, execution_time, model_used }
  return response.data.data || response.data
}

/*
UPLOAD ROUTE

upload.single('resume')

Means:
accept ONE file
with field name "resume"
*/

router.post(

    '/upload-resume',

    authMiddleware,
    requireRole('candidate'),

    upload.single('resume'),

    async (req, res) => {

        try {

            const filePath = req.file.path

            const aiUrl =
                process.env.AI_ENGINE_URL ||
                'http://localhost:8000'

            let extractedSkills = []

            let atsScore = 0

            let atsBreakdown = null

            let suggestions = []

            try {

                /*
                READ PDF
                */

                const dataBuffer =
                    fs.readFileSync(filePath)

                /*
                EXTRACT TEXT
                */

                const pdfData =
                    await pdf(dataBuffer)

                const resumeText =
                    pdfData.text

                console.log(
                    'PDF TEXT EXTRACTED'
                )

                /*
                SEND TEXT TO AI
                Phase 3: AI Engine now returns standard envelope { success, data, message, execution_time, model_used }
                */

                const response =
                    await axios.post(

                        `${aiUrl}/analyze-resume`,

                        {
                            resumeText
                        }
                    )

                // Phase 3: Extract from standard response envelope
                const aiData = response.data.data || response.data

                extractedSkills =
                    aiData.skills || []

                atsScore =
                    aiData.ats_score || 0

                atsBreakdown =
                    aiData.ats_breakdown || null

                suggestions =
                    aiData.suggestions || []

                console.log(
                    'AI SUCCESS'
                )

            } catch (aiError) {

                console.log(
                    'AI ERROR'
                )

                console.log(
                    aiError.message
                )

                if (aiError.response) {

                    console.log(
                        aiError.response.data
                    )
                }
            }

            const resume =
                await Resume.create({

                    userId: req.user.id,

                    fileName:
                        req.file.originalname,

                    extractedSkills,

                    atsScore
                })

            await recordCandidateMemory({
                candidateId: req.user.id,
                event: 'resume_uploaded',
                entityType: 'resume',
                entityId: resume._id,
                summary: `Uploaded resume: ${resume.fileName}`,
                metadata: { atsScore: resume.atsScore, skills: resume.extractedSkills },
                dedupeKey: `resume_uploaded:${resume._id}`,
            })

            res.json({

                message:
                    'Resume uploaded successfully',

                resume: {

                    _id: resume._id,

                    filename:
                        resume.fileName,

                    atsScore:
                        resume.atsScore,

                    extractedSkills:
                        resume.extractedSkills,

                    atsBreakdown,

                    suggestions
                }
            })

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message:
                    'Resume Upload Failed'
            })
        }
    }
)

/**
 * POST /api/ai/analyze-resume
 * Phase 3: Direct proxy to AI Engine for resume text analysis.
 * Returns skills + ATS score + breakdown + suggestions via standard envelope.
 */
router.post(
    '/analyze-resume',
    authMiddleware,
    async (req, res) => {
        try {
            const { resumeText } = req.body
            if (!resumeText) {
                return res.status(400).json({ message: 'resumeText is required' })
            }

            const data = await callAiEngine('/analyze-resume', { resumeText })

            res.json({
                success: true,
                data: {
                    skills: data.skills || [],
                    ats_score: data.ats_score || 0,
                    ats_breakdown: data.ats_breakdown || null,
                    suggestions: data.suggestions || [],
                    metrics: data.metrics || null,
                },
                message: 'Resume analyzed successfully',
            })
        } catch (error) {
            console.error('analyze-resume proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/ats-breakdown
 * Phase 3: Get detailed ATS breakdown with category scores and suggestions.
 */
router.post(
    '/ats-breakdown',
    authMiddleware,
    async (req, res) => {
        try {
            const { resumeText } = req.body
            if (!resumeText) {
                return res.status(400).json({ message: 'resumeText is required' })
            }

            // Call AI Engine's resume/ats-breakdown endpoint
            const aiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000'
            const response = await axios.post(`${aiUrl}/resume/ats-breakdown`, { resumeText })
            const data = response.data.data || response.data

            res.json({
                success: true,
                data,
                message: 'ATS breakdown generated',
            })
        } catch (error) {
            console.error('ats-breakdown proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/insights/recruiter
 * Phase 3: Get recruiter AI insights (fit assessment, strengths, weaknesses, interview focus).
 */
router.post(
    '/insights/recruiter',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { resumeText, jobDescription } = req.body

            const aiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000'
            const response = await axios.post(`${aiUrl}/insights/recruiter`, {
                resumeText: resumeText || '',
                jobDescription: jobDescription || '',
            })
            const data = response.data.data || response.data

            res.json({
                success: true,
                data,
                message: 'Recruiter insights generated',
            })
        } catch (error) {
            console.error('insights/recruiter proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/insights/career-recommendation
 * Phase 3: Get career recommendations for candidates.
 */
router.post(
    '/insights/career-recommendation',
    authMiddleware,
    async (req, res) => {
        try {
            const { skills, experience_years, interests } = req.body

            const aiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000'
            const response = await axios.post(`${aiUrl}/insights/career-recommendation`, {
                skills: skills || [],
                experience_years: experience_years || null,
                interests: interests || [],
            })
            const data = response.data.data || response.data

            res.json({
                success: true,
                data,
                message: 'Career recommendations generated',
            })
        } catch (error) {
            console.error('insights/career-recommendation proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/insights/interview-questions
 * Phase 3: Generate interview questions based on job description and skills.
 */
router.post(
    '/insights/interview-questions',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { jobDescription, skills, difficulty } = req.body

            const aiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000'
            const response = await axios.post(`${aiUrl}/insights/interview-questions`, {
                jobDescription: jobDescription || '',
                skills: skills || [],
                difficulty: difficulty || 'medium',
            })
            const data = response.data.data || response.data

            res.json({
                success: true,
                data,
                message: 'Interview questions generated',
            })
        } catch (error) {
            console.error('insights/interview-questions proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/*
GET HISTORY ROUTE

Returns all resumes uploaded by the authenticated user
*/

router.get(
    '/history',

    authMiddleware,
    requireRole('candidate'),

    async (req, res) => {

        try {

            const resumes = await Resume.find({ userId: req.user.id })
                .sort({ uploadedAt: -1 })

            const formatted = resumes.map((r) => ({

                _id: r._id,

                filename: r.fileName,

                atsScore: r.atsScore,

                extractedSkills: r.extractedSkills,

                uploadedAt: r.uploadedAt

            }))

            res.json(formatted)

        } catch (error) {

            console.log(error)

            res.status(500).json({
                message: 'Failed to fetch history'
            })
        }
    }
)

/*
GET RANKINGS ROUTE

Returns ranked candidates based on resumes and job matching
Uses real MongoDB data + AI Engine ranking
Phase 3: Uses enhanced ranking with unified formula
*/

router.get(
    '/rankings',

    authMiddleware,
    requireRole('recruiter'),

    async (req, res) => {

        try {

            const aiUrl =
                process.env.AI_ENGINE_URL ||
                'http://localhost:8000'

            // Fetch all resumes with user data for ranking
            const resumes = await Resume.find()
                .populate('userId', 'name email')
                .sort({ atsScore: -1 })

            if (!resumes.length) {
                return res.json([])
            }

            // Get the latest job as the reference job description for ranking
            const latestJob = await Job.findOne().sort({ createdAt: -1 })
            const jobDescription = latestJob ? `${latestJob.title} ${latestJob.description} ${latestJob.requiredSkills ? latestJob.requiredSkills.join(' ') : ''}` : ''

            // Map resumes to candidate format expected by AI Engine
            const candidates = resumes
                .filter(r => r.userId)
                .map(r => ({
                    _id: r._id.toString(),
                    name: r.userId.name || r.fileName,
                    skills: r.extractedSkills || []
                }))

            let rankings = []

            try {
                // Call AI Engine /rank-candidates with proper payload
                // Phase 3: Response is wrapped in standard envelope
                const response = await axios.post(
                    `${aiUrl}/rank-candidates`,
                    {
                        jobDescription,
                        candidates
                    }
                )

                // Phase 3: Extract from standard response envelope
                const aiData = response.data.data || response.data
                rankings = aiData.rankings || []

                console.log('AI Ranking SUCCESS:', rankings.length, 'candidates ranked')

            } catch (aiError) {

                console.log('AI Ranking unavailable:', aiError.message)

                // Fallback: Use ATS scores from MongoDB sorted descending
                rankings = candidates.map((c, index) => {
                    const resume = resumes.find(r => r._id.toString() === c._id)
                    return {
                        candidateId: c._id,
                        candidateName: c.name,
                        score: resume ? resume.atsScore : 0,
                        matchedSkills: c.skills,
                        missingSkills: []
                    }
                }).sort((a, b) => b.score - a.score)
            }

            res.json(rankings)

        } catch (error) {

            console.log(error)

            res.status(500).json({
                message: 'Failed to fetch rankings'
            })
        }
    }
)

/**
 * POST /api/ai/recruiter/rank-candidates-enhanced
 * Phase 4: Enhanced candidate ranking with explanations
 */
router.post(
    '/recruiter/rank-candidates-enhanced',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { jobDescription, candidates } = req.body
            if (!candidates || !candidates.length) {
                return res.status(400).json({ message: 'At least one candidate is required' })
            }

            const data = await callAiEngine('/recruiter/rank-candidates-enhanced', {
                jobDescription: jobDescription || '',
                candidates,
            })

            res.json({
                success: true,
                data,
                message: 'Enhanced ranking generated',
            })
        } catch (error) {
            console.error('rank-candidates-enhanced proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/recruiter/recommendations
 * Phase 4: Get recruiter candidate recommendations (best/backup/reject)
 */
router.post(
    '/recruiter/recommendations',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { jobDescription, candidates, threshold_best, threshold_backup } = req.body
            if (!candidates || !candidates.length) {
                return res.status(400).json({ message: 'At least one candidate is required' })
            }

            const data = await callAiEngine('/recruiter/recommendations', {
                jobDescription: jobDescription || '',
                candidates,
                threshold_best: threshold_best || 70,
                threshold_backup: threshold_backup || 45,
            })

            res.json({
                success: true,
                data,
                message: 'Recruiter recommendations generated',
            })
        } catch (error) {
            console.error('recruiter/recommendations proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/recruiter/dashboard-analytics
 * Phase 4: Get recruiter dashboard analytics
 */
router.post(
    '/recruiter/dashboard-analytics',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const { candidates, jobs, resumes } = req.body

            const data = await callAiEngine('/recruiter/dashboard-analytics', {
                candidates: candidates || [],
                jobs: jobs || [],
                resumes: resumes || [],
            })

            res.json({
                success: true,
                data,
                message: 'Dashboard analytics generated',
            })
        } catch (error) {
            console.error('recruiter/dashboard-analytics proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/resume/suggestions
 * Phase 4: Get resume improvement suggestions
 */
router.post(
    '/resume/suggestions',
    authMiddleware,
    async (req, res) => {
        try {
            const { resumeText, jobDescription } = req.body
            if (!resumeText) {
                return res.status(400).json({ message: 'resumeText is required' })
            }

            const data = await callAiEngine('/resume/suggestions', {
                resumeText,
                jobDescription: jobDescription || null,
            })

            res.json({
                success: true,
                data,
                message: 'Resume suggestions generated',
            })
        } catch (error) {
            console.error('resume/suggestions proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/resume/compare-versions
 * Phase 4: Compare two resume versions
 */
router.post(
    '/resume/compare-versions',
    authMiddleware,
    async (req, res) => {
        try {
            const { version_a_text, version_b_text, version_a_name, version_b_name } = req.body
            if (!version_a_text || !version_b_text) {
                return res.status(400).json({ message: 'Both version texts are required' })
            }

            const data = await callAiEngine('/resume/compare-versions', {
                version_a_text,
                version_b_text,
                version_a_name: version_a_name || 'Version A',
                version_b_name: version_b_name || 'Version B',
            })

            res.json({
                success: true,
                data,
                message: 'Resume versions compared successfully',
            })
        } catch (error) {
            console.error('resume/compare-versions proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/candidate/job-recommendations
 * Phase 4: Get personalized job recommendations for candidates
 */
router.post(
    '/candidate/job-recommendations',
    authMiddleware,
    async (req, res) => {
        try {
            const { candidate_skills, experience_years, interests, jobs } = req.body
            if (!candidate_skills || !candidate_skills.length) {
                return res.status(400).json({ message: 'At least one skill is required' })
            }

            const data = await callAiEngine('/candidate/job-recommendations', {
                candidate_skills,
                experience_years: experience_years || null,
                interests: interests || [],
                jobs: jobs || [],
            })

            res.json({
                success: true,
                data,
                message: 'Job recommendations generated',
            })
        } catch (error) {
            console.error('candidate/job-recommendations proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/skill-gap
 * Phase 4: Enhanced skill gap analysis with learning roadmap
 */
router.post(
    '/skill-gap',
    authMiddleware,
    async (req, res) => {
        try {
            const { candidate_skills, required_skills } = req.body
            if (!candidate_skills || !required_skills) {
                return res.status(400).json({ message: 'candidate_skills and required_skills are required' })
            }

            const data = await callAiEngine('/skill-gap', {
                candidate_skills,
                required_skills,
            })

            res.json({
                success: true,
                data,
                message: 'Skill gap analysis complete',
            })
        } catch (error) {
            console.error('skill-gap proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/job-match-v2
 * Phase 4: Semantic job matching using embeddings and cosine similarity
 */
router.post(
    '/job-match-v2',
    authMiddleware,
    async (req, res) => {
        try {
            const { resume, job } = req.body
            if (!resume || !job) {
                return res.status(400).json({ message: 'resume and job texts are required' })
            }

            const data = await callAiEngine('/job-match-v2', {
                resume,
                job,
            })

            res.json({
                success: true,
                data,
                message: 'Semantic job match complete',
            })
        } catch (error) {
            console.error('job-match-v2 proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

/**
 * POST /api/ai/resume/analyze-comprehensive
 * Phase 4: Comprehensive resume analysis pipeline
 */
router.post(
    '/resume/analyze-comprehensive',
    authMiddleware,
    async (req, res) => {
        try {
            const { resumeText } = req.body
            if (!resumeText) {
                return res.status(400).json({ message: 'resumeText is required' })
            }

            const data = await callAiEngine('/resume/analyze-comprehensive', {
                resumeText,
            })

            res.json({
                success: true,
                data,
                message: 'Comprehensive resume analysis complete',
            })
        } catch (error) {
            console.error('resume/analyze-comprehensive proxy error:', error.message)
            res.status(500).json({ success: false, message: 'AI Engine unavailable' })
        }
    }
)

module.exports = router
