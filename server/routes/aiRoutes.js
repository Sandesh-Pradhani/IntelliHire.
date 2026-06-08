const express = require('express')
const axios = require('axios')
const upload = require('../middleware/uploadMiddleware')
const authMiddleware = require('../middleware/authMiddleware')
const Resume = require('../models/Resume')
const Job = require('../models/Job')
const fs = require('fs')
const pdf = require('pdf-parse')
const router = express.Router()

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

    upload.single('resume'),

    async (req, res) => {

        try {

            const filePath = req.file.path

            const aiUrl =
                process.env.AI_ENGINE_URL ||
                'http://localhost:8000'

            let extractedSkills = []

            let atsScore = 0

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
                */

                const response =
                    await axios.post(

                        `${aiUrl}/analyze-resume`,

                        {
                            resumeText
                        }
                    )

                extractedSkills =
                    response.data.skills || []

                atsScore =
                    response.data.ats_score || 0

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
                        resume.extractedSkills
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

/*
GET HISTORY ROUTE

Returns all resumes uploaded by the authenticated user
*/

router.get(
    '/history',

    authMiddleware,

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
*/

router.get(
    '/rankings',

    authMiddleware,

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
                const response = await axios.post(
                    `${aiUrl}/rank-candidates`,
                    {
                        jobDescription,
                        candidates
                    }
                )

                rankings = response.data.rankings || []

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

module.exports = router