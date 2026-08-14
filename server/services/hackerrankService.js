/**
 * HackerRank Service - Fetch public HackerRank profile data
 *
 * WHY THIS FILE:
 * Fetches a candidate's HackerRank statistics (stars, skill badges) using
 * HackerRank's public profile API. HackerRank exposes public profile data
 * without authentication.
 *
 * WHY THIS APPROACH:
 * - Uses HackerRank's public profile endpoint (hackerrank.com/rest/hackers/{username})
 *   which returns JSON for public profiles
 * - Fetches profile and badges in parallel
 * - Returns a normalized structure for the AI scoring engine
 *
 * ALTERNATIVES CONSIDERED:
 * - Scraping the profile page: fragile HTML parsing, against ToS
 * - Third-party APIs: unreliable, may require keys
 */

const BASE_URL = 'https://www.hackerrank.com/rest/hackers'

/**
 * Validate a HackerRank username.
 * HackerRank usernames: alphanumeric + underscore, 1-30 chars.
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'HackerRank username is required' }
  }
  const trimmed = username.trim()
  if (!/^[a-zA-Z0-9_]{1,30}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid HackerRank username. Use 1-30 alphanumeric characters or underscores.' }
  }
  return { valid: true, username: trimmed }
}

/**
 * Fetch HackerRank profile data for a username.
 *
 * Returns:
 * - profile: basic user info (name, avatar, country)
 * - stars: total stars earned across skills
 * - badges: list of skill badges with star counts
 */
async function fetchHackerRankProfile(username) {
  const validation = validateUsername(username)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const user = validation.username

  const response = await fetch(`${BASE_URL}/${user}/profile`, {
    headers: { Accept: 'application/json' },
  })

  if (response.status === 404) {
    throw new Error(`HackerRank user "${user}" not found`)
  }
  if (!response.ok) {
    throw new Error(`HackerRank API error: ${response.status}`)
  }

  const data = await response.json()
  const model = data?.model || {}

  // Extract badges from the profile model
  const badges = []
  const skills = model.skills || {}
  Object.entries(skills).forEach(([skillName, skillData]) => {
    if (skillData && typeof skillData === 'object') {
      const stars = skillData.stars || 0
      if (stars > 0) {
        badges.push({
          name: skillName,
          stars,
          solved: skillData.solved || 0,
          score: skillData.score || 0,
        })
      }
    }
  })

  // Total stars across all skills
  const totalStars = badges.reduce((sum, badge) => sum + badge.stars, 0)

  return {
    username: user,
    profile: {
      name: model.name || user,
      avatarUrl: model.avatar || '',
      country: model.country || '',
      school: model.school || '',
    },
    stars: totalStars,
    badges,
  }
}

module.exports = {
  validateUsername,
  fetchHackerRankProfile,
}