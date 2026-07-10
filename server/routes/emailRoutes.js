const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/send', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { to, subject, body } = req.body
    if (!to || !subject || !body) return res.status(400).json({ message: 'to, subject, and body are required' })

    console.log(`[Email] To: ${to} | Subject: ${subject} | Body: ${body}`)

    try {
      const nodemailer = require('nodemailer')
      if (process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject,
          html: body
        })
        return res.json({ message: 'Email sent', method: 'smtp' })
      }
    } catch (_) {}

    res.json({ message: 'Email logged (no SMTP configured)', method: 'log' })
  } catch (error) {
    console.error('[Email Error]:', error)
    res.status(500).json({ message: 'Failed to send email' })
  }
})

module.exports = router
