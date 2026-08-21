/**
 * Resume Builder Routes
 *
 * All endpoints require candidate authentication.
 * Routes follow the existing Express architecture pattern.
 */

const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const controller = require('../controllers/resumeBuilderController')

const router = express.Router()

router.use(authMiddleware, requireRole('candidate'))

// ── Resume Builder CRUD ──
router.get('/', controller.getResumeBuilder)
router.post('/init', controller.initFromProfile)
router.put('/', controller.saveResumeBuilder)

// ── AI Operations ──
router.post('/generate-summary', controller.generateSummary)
router.post('/optimize', controller.optimizeSection)
router.post('/ats-analyze', controller.atsAnalyze)
router.post('/analyze-job', controller.analyzeJob)

// ── Version Management ──
router.get('/versions', controller.getVersions)
router.post('/versions/save', controller.saveVersion)
router.post('/versions/:id/restore', controller.restoreVersion)

// ── Export ──
router.post('/export-pdf', controller.exportPdf)

module.exports = router
