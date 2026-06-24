const express = require('express')

const Job = require('../models/Job')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post(
    '/create',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {

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

/**
 * PUT /api/jobs/update/:id
 * Update a job — recruiter only
 */
router.put(
    '/update/:id',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const job = await Job.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            )
            if (!job) {
                return res.status(404).json({ message: 'Job not found' })
            }
            res.json(job)
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Job update failed' })
        }
    }
)

/**
 * DELETE /api/jobs/delete/:id
 * Delete a job — recruiter only
 */
router.delete(
    '/delete/:id',
    authMiddleware,
    requireRole('recruiter'),
    async (req, res) => {
        try {
            const job = await Job.findByIdAndDelete(req.params.id)
            if (!job) {
                return res.status(404).json({ message: 'Job not found' })
            }
            res.json({ message: 'Job deleted successfully' })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Job delete failed' })
        }
    }
)

module.exports = router
