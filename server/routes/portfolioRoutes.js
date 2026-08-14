const express = require('express')
const Project = require('../models/Project')
const Certificate = require('../models/Certificate')
const CodingProfile = require('../models/CodingProfile')
const Experience = require('../models/Experience')
const Language = require('../models/Language')
const PortfolioLink = require('../models/PortfolioLink')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const projectController = require('../controllers/projectController')
const { getProjectScore } = require('../services/projectService')
const router = express.Router()
const { recordCandidateMemory } = require('../services/candidateMemoryService')
router.use(authMiddleware, requireRole('candidate'))

// ── Projects (Enhanced with controller) ──
router.get('/projects', projectController.getProjects)
router.get('/projects/stats', projectController.getPortfolioStats)
router.get('/projects/:id', projectController.getProject)
router.post('/projects', projectController.createProject)
router.put('/projects/:id', projectController.updateProject)
router.delete('/projects/:id', projectController.deleteProject)

// ── Project AI Score ──
router.post('/projects/:id/score', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id })
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const scoreResult = await getProjectScore(project)

    const updated = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { projectScore: scoreResult },
      { new: true }
    )

    res.json(updated)
  } catch (error) {
    console.error('[ProjectScore]:', error)
    res.status(500).json({ message: 'Failed to score project' })
  }
})

// ── Certificates ──
router.get('/certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(certificates)
  } catch (error) {
    console.error('[Certificates Fetch]:', error)
    res.status(500).json({ message: 'Failed to fetch certificates' })
  }
})

router.post('/certificates', async (req, res) => {
  try {
    const certificate = await Certificate.create({ ...req.body, userId: req.user.id })
    await recordCandidateMemory({ candidateId: req.user.id, event: 'certificate_added', entityType: 'certificate', entityId: certificate._id, summary: `Added certificate: ${certificate.name}`, metadata: { issuer: certificate.issuer }, dedupeKey: `certificate_added:${certificate._id}` })
    res.status(201).json(certificate)
  } catch (error) {
    console.error('[Certificate Create]:', error)
    res.status(500).json({ message: 'Failed to create certificate' })
  }
})

router.put('/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    )
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
    res.json(certificate)
  } catch (error) {
    console.error('[Certificate Update]:', error)
    res.status(500).json({ message: 'Failed to update certificate' })
  }
})

router.delete('/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
    res.json({ message: 'Certificate deleted' })
  } catch (error) {
    console.error('[Certificate Delete]:', error)
    res.status(500).json({ message: 'Failed to delete certificate' })
  }
})

// ── Coding Profiles ──
router.get('/coding-profiles', async (req, res) => {
  try {
    const profiles = await CodingProfile.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(profiles)
  } catch (error) {
    console.error('[CodingProfiles Fetch]:', error)
    res.status(500).json({ message: 'Failed to fetch coding profiles' })
  }
})

router.post('/coding-profiles', async (req, res) => {
  try {
    const profile = await CodingProfile.create({ ...req.body, userId: req.user.id })
    await recordCandidateMemory({ candidateId: req.user.id, event: 'coding_profile_added', entityType: 'coding_profile', entityId: profile._id, summary: `Connected ${profile.platform} coding profile`, metadata: { platform: profile.platform, problemsSolved: profile.problemsSolved }, dedupeKey: `coding_profile_added:${profile._id}` })
    res.status(201).json(profile)
  } catch (error) {
    console.error('[CodingProfile Create]:', error)
    res.status(500).json({ message: 'Failed to create coding profile' })
  }
})

router.put('/coding-profiles/:id', async (req, res) => {
  try {
    const profile = await CodingProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    )
    if (!profile) return res.status(404).json({ message: 'Coding profile not found' })
    res.json(profile)
  } catch (error) {
    console.error('[CodingProfile Update]:', error)
    res.status(500).json({ message: 'Failed to update coding profile' })
  }
})

router.delete('/coding-profiles/:id', async (req, res) => {
  try {
    const profile = await CodingProfile.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!profile) return res.status(404).json({ message: 'Coding profile not found' })
    res.json({ message: 'Coding profile deleted' })
  } catch (error) {
    console.error('[CodingProfile Delete]:', error)
    res.status(500).json({ message: 'Failed to delete coding profile' })
  }
})

// ── Experience ──
router.get('/experience', async (req, res) => {
  try {
    const experiences = await Experience.find({ userId: req.user.id }).sort({ startDate: -1 })
    res.json(experiences)
  } catch (error) {
    console.error('[Experience Fetch]:', error)
    res.status(500).json({ message: 'Failed to fetch experience' })
  }
})

router.post('/experience', async (req, res) => {
  try {
    const experience = await Experience.create({ ...req.body, userId: req.user.id })
    await recordCandidateMemory({ candidateId: req.user.id, event: 'experience_added', entityType: 'experience', entityId: experience._id, summary: `Added experience: ${experience.role} at ${experience.company}`, metadata: { technologies: experience.technologies || [] }, dedupeKey: `experience_added:${experience._id}` })
    res.status(201).json(experience)
  } catch (error) {
    console.error('[Experience Create]:', error)
    res.status(500).json({ message: 'Failed to create experience' })
  }
})

router.put('/experience/:id', async (req, res) => {
  try {
    const experience = await Experience.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    )
    if (!experience) return res.status(404).json({ message: 'Experience not found' })
    res.json(experience)
  } catch (error) {
    console.error('[Experience Update]:', error)
    res.status(500).json({ message: 'Failed to update experience' })
  }
})

router.delete('/experience/:id', async (req, res) => {
  try {
    const experience = await Experience.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!experience) return res.status(404).json({ message: 'Experience not found' })
    res.json({ message: 'Experience deleted' })
  } catch (error) {
    console.error('[Experience Delete]:', error)
    res.status(500).json({ message: 'Failed to delete experience' })
  }
})

// ── Languages ──
router.get('/languages', async (req, res) => {
  try {
    const languages = await Language.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(languages)
  } catch (error) {
    console.error('[Languages Fetch]:', error)
    res.status(500).json({ message: 'Failed to fetch languages' })
  }
})

router.post('/languages', async (req, res) => {
  try {
    const language = await Language.create({ ...req.body, userId: req.user.id })
    res.status(201).json(language)
  } catch (error) {
    console.error('[Language Create]:', error)
    res.status(500).json({ message: 'Failed to create language' })
  }
})

router.put('/languages/:id', async (req, res) => {
  try {
    const language = await Language.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    )
    if (!language) return res.status(404).json({ message: 'Language not found' })
    res.json(language)
  } catch (error) {
    console.error('[Language Update]:', error)
    res.status(500).json({ message: 'Failed to update language' })
  }
})

router.delete('/languages/:id', async (req, res) => {
  try {
    const language = await Language.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!language) return res.status(404).json({ message: 'Language not found' })
    res.json({ message: 'Language deleted' })
  } catch (error) {
    console.error('[Language Delete]:', error)
    res.status(500).json({ message: 'Failed to delete language' })
  }
})

// ── Portfolio Links ──
router.get('/links', async (req, res) => {
  try {
    const links = await PortfolioLink.find({ userId: req.user.id }).sort({ createdAt: -1 })
    res.json(links)
  } catch (error) {
    console.error('[Links Fetch]:', error)
    res.status(500).json({ message: 'Failed to fetch portfolio links' })
  }
})

router.post('/links', async (req, res) => {
  try {
    const link = await PortfolioLink.create({ ...req.body, userId: req.user.id })
    await recordCandidateMemory({ candidateId: req.user.id, event: 'profile_linked', entityType: 'profile', entityId: link._id, summary: `Linked ${link.platform} profile`, metadata: { platform: link.platform }, dedupeKey: `profile_linked:${link._id}` })
    res.status(201).json(link)
  } catch (error) {
    console.error('[Link Create]:', error)
    res.status(500).json({ message: 'Failed to create portfolio link' })
  }
})

router.put('/links/:id', async (req, res) => {
  try {
    const link = await PortfolioLink.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    )
    if (!link) return res.status(404).json({ message: 'Portfolio link not found' })
    res.json(link)
  } catch (error) {
    console.error('[Link Update]:', error)
    res.status(500).json({ message: 'Failed to update portfolio link' })
  }
})

router.delete('/links/:id', async (req, res) => {
  try {
    const link = await PortfolioLink.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
    if (!link) return res.status(404).json({ message: 'Portfolio link not found' })
    res.json({ message: 'Portfolio link deleted' })
  } catch (error) {
    console.error('[Link Delete]:', error)
    res.status(500).json({ message: 'Failed to delete portfolio link' })
  }
})

// ── Portfolio Completion ──
router.get('/completion', async (req, res) => {
  try {
    const [projects, certificates, codingProfiles, experience, languages, links] = await Promise.all([
      Project.countDocuments({ userId: req.user.id }),
      Certificate.countDocuments({ userId: req.user.id }),
      CodingProfile.countDocuments({ userId: req.user.id }),
      Experience.countDocuments({ userId: req.user.id }),
      Language.countDocuments({ userId: req.user.id }),
      PortfolioLink.countDocuments({ userId: req.user.id }),
    ])

    const sections = [
      { name: 'Projects', filled: projects > 0, weight: 20 },
      { name: 'Certificates', filled: certificates > 0, weight: 15 },
      { name: 'Coding Profiles', filled: codingProfiles > 0, weight: 15 },
      { name: 'Experience', filled: experience > 0, weight: 20 },
      { name: 'Languages', filled: languages > 0, weight: 10 },
      { name: 'Portfolio Links', filled: links > 0, weight: 20 },
    ]

    const completion = sections.reduce((sum, s) => sum + (s.filled ? s.weight : 0), 0)

    res.json({ completion, sections, counts: { projects, certificates, codingProfiles, experience, languages, links } })
  } catch (error) {
    console.error('[Completion Fetch]:', error)
    res.status(500).json({ message: 'Failed to calculate completion' })
  }
})

module.exports = router
