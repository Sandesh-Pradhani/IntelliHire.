const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const Organization = require('../models/Organization')
const User = require('../models/User')
const { getCompanyIntelligence } = require('../services/companyIntelligenceService')

const router = express.Router()
const slugify = (name) => `${name}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
async function membership(userId) { return Organization.findOne({ 'members.userId': userId }) }
function canManage(org, userId) { const member = org.members.find((item) => String(item.userId) === String(userId)); return String(org.ownerId) === String(userId) || ['admin', 'manager'].includes(member?.role) }

router.post('/', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim(); if (!name) return res.status(400).json({ success: false, message: 'Organization name is required.' })
    const base = slugify(name); let slug = base; let suffix = 1
    while (await Organization.exists({ slug })) { suffix += 1; slug = `${base}-${suffix}` }
    const organization = await Organization.create({ name, slug, ownerId: req.user.id, departments: req.body.departments || ['General'], members: [{ userId: req.user.id, role: 'admin', department: 'General' }] })
    res.status(201).json({ success: true, data: organization })
  } catch (error) { res.status(500).json({ success: false, message: 'Unable to create organization.' }) }
})

router.get('/me', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const organization = await membership(req.user.id)
    if (organization) await organization.populate('members.userId', 'name email')
    res.json({ success: true, data: organization || null })
  } catch (_) { res.status(500).json({ success: false, message: 'Unable to load organization.' }) }
})

router.post('/members', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const organization = await membership(req.user.id); if (!organization) return res.status(404).json({ success: false, message: 'Create or join an organization first.' }); if (!canManage(organization, req.user.id)) return res.status(403).json({ success: false, message: 'Only workspace admins or managers can add members.' })
    const user = await User.findOne({ email: String(req.body.email || '').toLowerCase().trim(), role: 'recruiter' }); if (!user) return res.status(404).json({ success: false, message: 'No recruiter account matches that email.' })
    if (organization.members.some((member) => String(member.userId) === String(user._id))) return res.status(409).json({ success: false, message: 'This member is already in the organization.' })
    organization.members.push({ userId: user._id, role: req.body.role || 'recruiter', department: req.body.department || 'General' }); await organization.save(); res.json({ success: true, data: organization })
  } catch (_) { res.status(500).json({ success: false, message: 'Unable to add organization member.' }) }
})

router.get('/intelligence', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try { const organization = await membership(req.user.id); if (!organization) return res.status(404).json({ success: false, message: 'No organization workspace found.' }); res.json({ success: true, data: await getCompanyIntelligence(organization) }) } catch (_) { res.status(500).json({ success: false, message: 'Unable to load company intelligence.' }) }
})

module.exports = router
