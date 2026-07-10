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
GET CURRENT USER
*/

router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' })
        }
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.id).select('-password')
        if (!user) return res.status(404).json({ message: 'User not found' })
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: 'Invalid token' })
    }
})

/*
UPDATE PROFILE
*/

router.put('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' })
        }
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const { name, phone, location, bio, avatar } = req.body
        const user = await User.findByIdAndUpdate(decoded.id, { name, phone, location, bio, avatar }, { new: true }).select('-password')
        if (!user) return res.status(404).json({ message: 'User not found' })
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Failed to update profile' })
    }
})

/*
CHANGE PASSWORD
*/

router.put('/password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' })
        }
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const { currentPassword, newPassword } = req.body
        const user = await User.findById(decoded.id)
        if (!user) return res.status(404).json({ message: 'User not found' })
        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })
        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()
        res.json({ message: 'Password updated' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Failed to change password' })
    }
})

module.exports = router