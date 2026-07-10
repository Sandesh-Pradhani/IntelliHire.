const express = require('express')
const Company = require('../models/Company')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const existing = await Company.findOne({ ownerId: req.user.id })
    if (existing) return res.status(400).json({ message: 'You already own a company' })
    const company = await Company.create({ ...req.body, ownerId: req.user.id })
    res.status(201).json(company)
  } catch (error) {
    console.error('[Company Create Error]:', error)
    res.status(500).json({ message: 'Failed to create company' })
  }
})

router.get('/', async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 })
    res.json(companies)
  } catch (error) {
    console.error('[Companies Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch companies' })
  }
})

router.get('/my', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const company = await Company.findOne({ ownerId: req.user.id }).populate('team', 'name email')
    res.json(company)
  } catch (error) {
    console.error('[My Company Error]:', error)
    res.status(500).json({ message: 'Failed to fetch company' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('team', 'name email')
    if (!company) return res.status(404).json({ message: 'Company not found' })
    res.json(company)
  } catch (error) {
    console.error('[Company Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch company' })
  }
})

router.put('/:id', authMiddleware, requireRole('recruiter'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
    if (!company) return res.status(404).json({ message: 'Company not found' })
    if (company.ownerId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    console.error('[Company Update Error]:', error)
    res.status(500).json({ message: 'Failed to update company' })
  }
})

module.exports = router
