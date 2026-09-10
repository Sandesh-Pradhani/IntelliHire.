const express = require('express')

const router = express.Router()

const AcademicProfile = require('../models/AcademicProfile')

const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

/*
CREATE PROFILE
*/

router.post(

    '/',

    authMiddleware,
    requireRole('candidate'),

    async (req, res) => {

        try {

            const {

                cgpa,
                branch,
                college,
                graduationYear,
                currentSemester,
                backlogs

            } = req.body

            if (currentSemester !== undefined && (isNaN(Number(currentSemester)) || !/^\d+$/.test(String(currentSemester).trim()))) {
                return res.status(400).json({
                    message: 'Current Semester must be a number (e.g. 7 instead of 7th)'
                })
            }

            const existingProfile =
                await AcademicProfile.findOne({

                    candidateId: req.user.id
                })

            if (existingProfile) {

                return res.status(400).json({

                    message: 'Profile already exists'
                })
            }

            const profile =
                await AcademicProfile.create({

                    candidateId: req.user.id,

                    cgpa,

                    branch,

                    college,

                    graduationYear,

                    currentSemester,

                    backlogs
                })

            res.status(201).json(profile)

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Failed to create profile'
            })
        }
    }
)

/*
GET PROFILE
*/

router.get(

    '/',

    authMiddleware,
    requireRole('candidate'),

    async (req, res) => {

        try {

            const profile =
                await AcademicProfile.findOne({

                    candidateId: req.user.id
                })

            res.json(profile)

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Failed to fetch profile'
            })
        }
    }
)

/*
UPDATE PROFILE
*/

router.put(

    '/',

    authMiddleware,
    requireRole('candidate'),

    async (req, res) => {

        try {

            const { currentSemester } = req.body
            if (currentSemester !== undefined && (isNaN(Number(currentSemester)) || !/^\d+$/.test(String(currentSemester).trim()))) {
                return res.status(400).json({
                    message: 'Current Semester must be a number (e.g. 7 instead of 7th)'
                })
            }

            const updatedProfile =
                await AcademicProfile.findOneAndUpdate(

                    {

                        candidateId: req.user.id
                    },

                    req.body,

                    {

                        new: true
                    }
                )

            res.json(updatedProfile)

        } catch (error) {

            console.log(error)

            res.status(500).json({

                message: 'Failed to update profile'
            })
        }
    }
)

module.exports = router