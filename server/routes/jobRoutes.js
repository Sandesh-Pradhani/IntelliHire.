const express = require('express')

const Job = require('../models/Job')

const router = express.Router()

router.post('/create', async (req, res) => {

    try {

        const job = await Job.create(req.body)

        res.status(201).json(job)

    } catch (error) {

        console.log(error)

        res.status(500).json({

            message: 'Job creation failed'
        })
    }
})

router.get(

    '/all',

    async (req, res) => {

        try {

            const jobs = await Job.find()

            res.json(jobs)

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Failed'
            })
        }
    }
)

module.exports = router