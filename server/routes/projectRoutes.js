const express = require('express')
const Project = require('../models/Project')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, userId: req.user.id })
    res.status(201).json(project)
  } catch (error) {
    console.error('[Project Create Error]:', error)
    res.status(500).json({ message: 'Failed to create project' })
  }
})

router.get('/', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(projects)
  } catch (error) {
    console.error('[Projects Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch projects' })
  }
})

router.get('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.json(project)
  } catch (error) {
    console.error('[Project Fetch Error]:', error)
    res.status(500).json({ message: 'Failed to fetch project' })
  }
})

router.put('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (error) {
    console.error('[Project Update Error]:', error)
    res.status(500).json({ message: 'Failed to update project' })
  }
})

router.delete('/:id', authMiddleware, requireRole('candidate'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })
    if (project.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Access denied' })
    await Project.findByIdAndDelete(req.params.id)
    res.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('[Project Delete Error]:', error)
    res.status(500).json({ message: 'Failed to delete project' })
  }
})

module.exports = router
