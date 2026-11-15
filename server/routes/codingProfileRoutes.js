/**
 * CodingProfile Routes - Express routes for the Coding Profile module
 *
 * WHY THIS FILE:
 * Defines the REST API endpoints for creating, fetching, updating, and
 * refreshing a candidate's coding profile. Uses the controller for logic.
 *
 * WHY THIS APPROACH:
 * - Thin routes that delegate to the controller, matching the existing
 *   academicRoutes pattern
 * - Auth middleware protects all routes (candidate only)
 * - Clear endpoint naming for the frontend service layer
 *
 * ALTERNATIVES CONSIDERED:
 * - Inline handlers in routes: would duplicate logic across endpoints
 * - Separate admin routes: not needed, candidates manage their own profiles
 */

const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const {
  createProfile,
  getProfile,
  updateProfile,
  refreshProfile,
} = require('../controllers/codingProfileController')

// All coding profile routes require an authenticated candidate
router.use(authMiddleware, requireRole('candidate'))

// Create a new coding profile
router.post('/', createProfile)

// Get the candidate's coding profile
router.get('/', getProfile)

// Update the candidate's coding profile
router.put('/', updateProfile)

// Refresh coding data from all connected platforms
router.post('/refresh', refreshProfile)

module.exports = router