const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/User')

const router = express.Router()

/*
REGISTER
*/

router.post('/register', async (req, res) => {

    try {

        const { name, email, password, role } = req.body

        /*
        VALIDATE ROLE
        */

        const validRoles = ['candidate', 'recruiter']
        
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                message: 'Role selection is required and must be either "candidate" or "recruiter"'
            })
        }

        /*
        CHECK EXISTING USER
        */

        const existingUser = await User.findOne({ email })

        if (existingUser) {

            return res.status(400).json({
                message: 'User already exists'
            })
        }

        /*
        HASH PASSWORD
        */

        const hashedPassword = await bcrypt.hash(password, 10)

        /*
        CREATE USER
        */

        const user = await User.create({

            name,
            email,
            password: hashedPassword,
            role: role

        })

        res.status(201).json({

            message: 'User Registered',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }

        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: 'Registration Failed'
        })
    }
})

/*
LOGIN
*/

router.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {

            return res.status(400).json({
                message: 'User not found'
            })
        }

        /*
        COMPARE HASHED PASSWORD
        */

        const isMatch = await bcrypt.compare(
            password,
            user.password
        )

        if (!isMatch) {

            return res.status(400).json({
                message: 'Invalid credentials'
            })
        }

        /*
        GENERATE JWT TOKEN
        */

        const token = jwt.sign(

            {
                id: user._id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: '7d'
            }
        )

        res.json({

            token,

            user: {

                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role

            }

        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            message: 'Login Failed'
        })
    }
})

/*
CHANGE PASSWORD
*/
const authMiddleware = require('../middleware/authMiddleware')

router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' })
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' })
        }

        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        res.json({ message: 'Password changed successfully' })
    } catch (error) {
        console.error('[Change Password Error]:', error)
        res.status(500).json({ message: 'Failed to change password' })
    }
})

/*
DELETE ACCOUNT
*/
router.delete('/delete-account', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id
        const mongoose = require('mongoose')

        await Promise.all([
            User.findByIdAndDelete(userId),
            require('../models/Resume').deleteMany({ userId }),
            require('../models/Application').deleteMany({ candidateId: userId }),
            require('../models/AcademicProfile').deleteMany({ candidateId: userId }),
            require('../models/Project').deleteMany({ userId }),
            require('../models/Certificate').deleteMany({ userId }),
            require('../models/CodingProfile').deleteMany({ userId }),
            require('../models/Experience').deleteMany({ userId }),
            require('../models/Language').deleteMany({ userId }),
            require('../models/PortfolioLink').deleteMany({ userId }),
            require('../models/Notification').deleteMany({ userId }),
            require('../models/Feedback').deleteMany({ user: userId }),
            require('../models/SavedJob').deleteMany({ userId }),
        ])

        res.json({ message: 'Account deleted successfully' })
    } catch (error) {
        console.error('[Delete Account Error]:', error)
        res.status(500).json({ message: 'Failed to delete account' })
    }
})

module.exports = router