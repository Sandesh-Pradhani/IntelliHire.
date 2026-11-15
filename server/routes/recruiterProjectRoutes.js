/**
 * Recruiter Project Routes
 *
 * Problem solved: Recruiters need to browse, filter, and evaluate candidate
 * projects without being restricted to their own data.
 *
 * Reason: Separate route file with recruiter auth middleware keeps candidate
 * and recruiter concerns cleanly separated.
 *
 * Alternative: Adding recruiter endpoints to portfolioRoutes — rejected because
 * it would require conditional auth middleware which is harder to maintain.
 */

const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const projectController = require('../controllers/projectController')

const router = express.Router()

router.use(authMiddleware, requireRole('recruiter'))

// Get all candidate projects with filters
router.get('/projects', projectController.getRecruiterProjects)

module.exports = router
