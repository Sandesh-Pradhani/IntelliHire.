const express = require('express')
const axios = require('axios')
const upload = require('../middleware/uploadMiddleware')
const authMiddleware = require('../middleware/authMiddleware')
const Resume = require('../models/Resume')
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

module.exports = router
