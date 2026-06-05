const express = require('express')

const Resume = require('../models/Resume')
const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get(

    '/latest',

    authMiddleware,

    async (req, res) => {

        try {

            const resume = await Resume.findOne({

                userId: req.user._id || req.user.id

            })

            .sort({

                uploadedAt: -1
            })

            if (!resume) {

                return res.status(404).json({

                    message: 'No Resume Found'
                })
            }

            res.json(resume)

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Failed'
            })
        }
    }
)

module.exports = router
