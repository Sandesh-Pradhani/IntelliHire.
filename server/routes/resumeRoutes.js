const express = require('express')

const Resume = require('../models/Resume')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get(

    '/all',

    authMiddleware,

    async (req, res) => {

        try {

            const resumes = await Resume.find({

                userId: req.user.id

            })

            .sort({

                uploadedAt: -1
            })

            res.json(resumes)

        }

        catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Failed'
            })
        }
    }
)

module.exports = router
