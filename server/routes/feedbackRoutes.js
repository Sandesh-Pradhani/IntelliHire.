const express = require('express')

const Feedback = require('../models/Feedback')

const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.post(

    '/submit',

    authMiddleware,

    async (req, res) => {

        try {

            const { message, rating } = req.body

            const feedback = await Feedback.create({

                user: req.user.id,

                message,

                rating
            })

            res.status(201).json(feedback)

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Feedback submission failed'
            })
        }
    }
)

module.exports = router