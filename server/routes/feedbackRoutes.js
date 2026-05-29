const express = require('express')

const Feedback = require('../models/Feedback')

const authMiddleware = require('../middleware/authMiddleware')

const router = express.Router()

router.get(

    '/',

    authMiddleware,

    async (req, res) => {

        try {

            const feedbacks = await Feedback.find({ user: req.user.id })
                .sort({ createdAt: -1 })
                .populate('user', 'name email')

            res.json(feedbacks)

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Failed to fetch feedback'
            })
        }
    }
)

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