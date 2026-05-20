const express = require('express')
const axios = require('axios')
const upload = require('../middleware/uploadMiddleware')

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

    upload.single('resume'),

    async (req, res) => {

        try {

            /*
            MULTER ADDS:

            req.file
            */

            const filePath = req.file.path

            /*
            SEND FILE PATH TO PYTHON AI
            */

            const response = await axios.post(
                '${process.env.AI_ENGINE_URL}/analyze-resume',
                {
                    filePath: filePath
                }
            )

            res.json(response.data)

        } catch (error) {

            console.log(error)

            res.status(500).json({
                message: 'Resume Upload Failed'
            })
        }
    }
)

module.exports = router