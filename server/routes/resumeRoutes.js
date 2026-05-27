const express = require('express')
const multer = require('multer')

const router = express.Router()
const fs = require('fs')
const pdf = require('pdf-parse')
const skillsList = require('../utils/skills')

/*
MULTER STORAGE
*/

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, 'uploads/')
    },

    filename: (req, file, cb) => {

        cb(

            null,

            Date.now() + '-' + file.originalname
        )
    }
})

const upload = multer({ storage })

/*
UPLOAD ROUTE
*/

router.post(

    '/upload',

    upload.single('resume'),

    async (req, res) => {

        try {

            /*
            READ PDF
            */

            const dataBuffer = fs.readFileSync(req.file.path)

            const pdfData = await pdf(dataBuffer)

            const text = pdfData.text.toLowerCase()

            /*
            SKILL MATCHING
            */

            const extractedSkills = skillsList.filter((skill) =>

                text.includes(skill)
            )

            console.log(extractedSkills)

            res.json({

                message: 'Resume Uploaded',

                extractedSkills
            })

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Upload Failed'
            })
        }
    }
)

module.exports = router