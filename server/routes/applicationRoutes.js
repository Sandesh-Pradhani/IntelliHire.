const express = require('express')

const Application = require('../models/Application')

const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.post(

    '/apply',

    authMiddleware,

    async (req, res) => {

        try {

            const {

                jobId,

                resumeId,

                matchScore

            } = req.body

            const application = await Application.create({

                candidate: req.user.id,

                job: jobId,

                resume: resumeId,

                matchScore

            })

            res.status(201).json(application)

        }

        catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Application Failed'
            })
        }
    }
)

router.get(

    '/all',

    async (req, res) => {

        try {

            const applications = await Application.find()

                .populate('candidate')

                .populate('job')

            res.json(applications)

        }

        catch (error) {

            res.status(500).json({

                message: 'Failed'
            })
        }
    }
)

router.put(

    '/status/:id',

    async (req, res) => {

        try {

            const application =

                await Application.findByIdAndUpdate(

                    req.params.id,

                    {

                        status: req.body.status

                    },

                    {

                        new: true
                    }
                )

            res.json(application)

        }

        catch (error) {

            res.status(500).json({

                message: 'Status Update Failed'
            })
        }
    }
)

module.exports = router