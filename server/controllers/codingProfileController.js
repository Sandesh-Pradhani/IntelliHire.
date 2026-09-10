/**
 * CodingProfile Controller - Handles CRUD and sync for coding profiles
 *
 * WHY THIS FILE:
 * Centralizes all business logic for the Coding Profile module. Keeps routes
 * thin and delegates data fetching to the platform services.
 *
 * WHY THIS APPROACH:
 * - Controller pattern matches the existing academicController style
 * - Platform services (githubService, leetcodeService, hackerrankService)
 *   handle external API calls, keeping this file focused on orchestration
 * - Each method returns proper HTTP status codes and error messages
 *
 * ALTERNATIVES CONSIDERED:
 * - Inline logic in routes: would duplicate validation and error handling
 * - Single monolithic service: harder to test and maintain
 */

const CodingProfile = require('../models/CodingProfile')
const githubService = require('../services/githubService')
const leetcodeService = require('../services/leetcodeService')
const hackerrankService = require('../services/hackerrankService')

/**
 * Create a new coding profile for the authenticated candidate.
 * Only ONE profile per candidate is allowed.
 */
async function createProfile(req, res) {
  try {
    const { githubUsername, leetcodeUsername, hackerrankUsername } = req.body

    // Validate usernames if provided
    const validations = {
      github: githubUsername ? githubService.validateUsername(githubUsername) : null,
      leetcode: leetcodeUsername ? leetcodeService.validateUsername(leetcodeUsername) : null,
      hackerrank: hackerrankUsername ? hackerrankService.validateUsername(hackerrankUsername) : null,
    }

    for (const [platform, validation] of Object.entries(validations)) {
      if (validation && !validation.valid) {
        return res.status(400).json({ message: validation.error })
      }
    }

    // Check if profile already exists
    const existing = await CodingProfile.findOne({ candidateId: req.user.id })
    if (existing) {
      return res.status(400).json({ message: 'Coding profile already exists. Use update instead.' })
    }

    const profile = await CodingProfile.create({
      candidateId: req.user.id,
      githubUsername: githubUsername?.trim() || '',
      leetcodeUsername: leetcodeUsername?.trim() || '',
      hackerrankUsername: hackerrankUsername?.trim() || '',
    })

    res.status(201).json(profile)
  } catch (error) {
    console.error('[CodingProfile Create]:', error)
    res.status(500).json({ message: 'Failed to create coding profile' })
  }
}

/**
 * Get the coding profile for the authenticated candidate.
 */
async function getProfile(req, res) {
  try {
    const profile = await CodingProfile.findOne({ candidateId: req.user.id })
    if (!profile) {
      return res.status(404).json({ message: 'Coding profile not found' })
    }
    res.json(profile)
  } catch (error) {
    console.error('[CodingProfile Fetch]:', error)
    res.status(500).json({ message: 'Failed to fetch coding profile' })
  }
}

/**
 * Update the coding profile for the authenticated candidate.
 * Only updates provided fields.
 */
async function updateProfile(req, res) {
  try {
    const { githubUsername, leetcodeUsername, hackerrankUsername } = req.body

    // Validate usernames if provided
    const validations = {
      github: githubUsername ? githubService.validateUsername(githubUsername) : null,
      leetcode: leetcodeUsername ? leetcodeService.validateUsername(leetcodeUsername) : null,
      hackerrank: hackerrankUsername ? hackerrankService.validateUsername(hackerrankUsername) : null,
    }

    for (const [platform, validation] of Object.entries(validations)) {
      if (validation && !validation.valid) {
        return res.status(400).json({ message: validation.error })
      }
    }

    const updateData = {}
    if (githubUsername !== undefined) updateData.githubUsername = githubUsername.trim()
    if (leetcodeUsername !== undefined) updateData.leetcodeUsername = leetcodeUsername.trim()
    if (hackerrankUsername !== undefined) updateData.hackerrankUsername = hackerrankUsername.trim()

    const profile = await CodingProfile.findOneAndUpdate(
      { candidateId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    )

    if (!profile) {
      return res.status(404).json({ message: 'Coding profile not found' })
    }

    res.json(profile)
  } catch (error) {
    console.error('[CodingProfile Update]:', error)
    res.status(500).json({ message: 'Failed to update coding profile' })
  }
}

/**
 * Refresh the coding profile by fetching fresh data from all connected platforms.
 * Fetches data in parallel for speed and updates lastSynced.
 */
async function refreshProfile(req, res) {
  try {
    const profile = await CodingProfile.findOne({ candidateId: req.user.id })
    if (!profile) {
      return res.status(404).json({ message: 'Coding profile not found' })
    }

    // Fetch data from all connected platforms in parallel
    const results = await Promise.allSettled([
      profile.githubUsername ? githubService.fetchGitHubProfile(profile.githubUsername) : Promise.resolve(null),
      profile.leetcodeUsername ? leetcodeService.fetchLeetCodeProfile(profile.leetcodeUsername) : Promise.resolve(null),
      profile.hackerrankUsername ? hackerrankService.fetchHackerRankProfile(profile.hackerrankUsername) : Promise.resolve(null),
    ])

    const [githubResult, leetcodeResult, hackerrankResult] = results

    // Update profile with fetched data
    const updateData = { lastSynced: new Date() }

    if (githubResult.status === 'fulfilled' && githubResult.value) {
      updateData.githubData = githubResult.value
    }
    if (leetcodeResult.status === 'fulfilled' && leetcodeResult.value) {
      updateData.leetcodeData = leetcodeResult.value
    }
    if (hackerrankResult.status === 'fulfilled' && hackerrankResult.value) {
      updateData.hackerrankData = hackerrankResult.value
    }

    const updated = await CodingProfile.findOneAndUpdate(
      { candidateId: req.user.id },
      updateData,
      { new: true }
    )

    // Collect any errors from failed fetches
    const errors = []
    if (githubResult.status === 'rejected') errors.push(`GitHub: ${githubResult.reason.message}`)
    if (leetcodeResult.status === 'rejected') errors.push(`LeetCode: ${leetcodeResult.reason.message}`)
    if (hackerrankResult.status === 'rejected') errors.push(`HackerRank: ${hackerrankResult.reason.message}`)

    res.json({
      profile: updated,
      errors,
      synced: errors.length === 0,
    })
  } catch (error) {
    console.error('[CodingProfile Refresh]:', error)
    res.status(500).json({ message: 'Failed to refresh coding profile' })
  }
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  refreshProfile,
}