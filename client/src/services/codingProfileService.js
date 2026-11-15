/**
 * Coding Profile Service
 *
 * WHY THIS FILE:
 * Centralizes all API calls for the Coding Profile module.
 * Never call axios directly from pages - always use the service layer.
 *
 * WHY THIS APPROACH:
 * - Matches the existing service pattern (portfolio.service.js)
 * - Uses the centralized http.service for auth token injection
 * - Provides a clean API for the frontend components
 *
 * ALTERNATIVES CONSIDERED:
 * - Direct axios in pages: violates the service layer rule
 * - Separate services per platform: over-engineered for 3 platforms
 */
import http from './http.service'

export const codingProfileService = {
  /**
   * Get the candidate's coding profile.
   */
  async getProfile() {
    const res = await http.get('/api/coding-profile')
    return res.data
  },

  /**
   * Create a new coding profile.
   * @param {Object} data - { githubUsername, leetcodeUsername, hackerrankUsername }
   */
  async createProfile(data) {
    const res = await http.post('/api/coding-profile', data)
    return res.data
  },

  /**
   * Update the candidate's coding profile.
   * @param {Object} data - Partial update { githubUsername?, leetcodeUsername?, hackerrankUsername? }
   */
  async updateProfile(data) {
    const res = await http.put('/api/coding-profile', data)
    return res.data
  },

  /**
   * Refresh coding data from all connected platforms.
   */
  async refreshProfile() {
    const res = await http.post('/api/coding-profile/refresh')
    return res.data
  },

  /**
   * Calculate the coding score from the AI engine.
   * @param {Object} profile - The coding profile with githubData, leetcodeData, hackerrankData
   */
  async getCodingScore(profile) {
    const payload = {
      github: profile?.githubData
        ? {
            repositories: profile.githubData.repos?.length || 0,
            followers: profile.githubData.profile?.followers || 0,
            stars: profile.githubData.repos?.reduce((sum, r) => sum + (r.stars || 0), 0) || 0,
            languages: profile.githubData.languages?.map((l) => l.name) || [],
            contributionActivity: profile.githubData.contributionActivity || null,
          }
        : null,
      leetcode: profile?.leetcodeData
        ? {
            problemsSolved: profile.leetcodeData.problemsSolved?.total || 0,
            easy: profile.leetcodeData.problemsSolved?.easy || 0,
            medium: profile.leetcodeData.problemsSolved?.medium || 0,
            hard: profile.leetcodeData.problemsSolved?.hard || 0,
            contestRating: profile.leetcodeData.contestRating?.rating || null,
            topPercentage: profile.leetcodeData.contestRating?.topPercentage || null,
          }
        : null,
      hackerrank: profile?.hackerrankData
        ? {
            stars: profile.hackerrankData.stars || 0,
            badges: profile.hackerrankData.badges || [],
          }
        : null,
    }

    const res = await http.post(`${import.meta.env.VITE_AI_URL || 'http://localhost:8000'}/coding-score`, payload)
    return res.data
  },
}

export default codingProfileService