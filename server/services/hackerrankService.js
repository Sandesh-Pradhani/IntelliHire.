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
 * - Handles API failures gracefully (profile connected but data unavailable)
 *
 * ALTERNATIVES CONSIDERED:
 * - Scraping the profile page: fragile HTML parsing, against ToS
 * - Third-party APIs: unreliable, may require keys
 *
 * KNOWN LIMITATION:
 * - HackerRank may block automated requests with rate limits or CAPTCHAs
 * - Profile data structure may change without notice
 * - If API is unreachable, the system gracefully degrades to "data unavailable"
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
 * - status: 'connected' | 'data_unavailable' | 'error'
 * - lastSync: timestamp of last successful sync
 *
 * Graceful degradation:
 * If the API is unreachable or returns unexpected data, returns
 * a structured response indicating the profile is connected but
 * data is unavailable, rather than throwing an error.
 */
async function fetchHackerRankProfile(username) {
  const validation = validateUsername(username)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const user = validation.username

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`${BASE_URL}/${user}/profile`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.status === 404) {
      throw new Error(`HackerRank user "${user}" not found`)
    }
    if (!response.ok) {
      throw new Error(`HackerRank API error: ${response.status}`)
    }

    const data = await response.json()
    const model = data?.model || {}

    // Extract badges from the profile model
    // HackerRank API returns skills as an object: { "python": { "stars": 3, ... } }
    // or as an array: [{ "name": "python", "stars": 3, ... }]
    const badges = []
    const skills = model.skills || {}

    if (Array.isArray(skills)) {
      // Array format: [{ "name": "python", "stars": 3, "solved": 100, "score": 500 }]
      skills.forEach((skillData) => {
        if (skillData && typeof skillData === 'object') {
          const stars = skillData.stars || 0
          if (stars > 0) {
            badges.push({
              name: skillData.name || 'unknown',
              stars,
              solved: skillData.solved || 0,
              score: skillData.score || 0,
            })
          }
        }
      })
    } else if (typeof skills === 'object' && skills !== null) {
      // Object format: { "python": { "stars": 3, "solved": 100, "score": 500 } }
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
    }

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
      badgesCount: badges.length,
      totalSolved: badges.reduce((sum, b) => sum + (b.solved || 0), 0),
      status: 'connected',
      lastSync: new Date().toISOString(),
    }
  } catch (fetchError) {
    // Graceful degradation: HackerRank API may be blocked, rate-limited, or unreachable
    // Return a structured response indicating data is unavailable rather than crashing
    console.log(`[HackerRankService] Data unavailable for "${user}": ${fetchError.message}`)

    return {
      username: user,
      profile: {
        name: user,
        avatarUrl: '',
        country: '',
        school: '',
      },
      stars: 0,
      badges: [],
      badgesCount: 0,
      totalSolved: 0,
      status: 'data_unavailable',
      lastSync: new Date().toISOString(),
      error: fetchError.message || 'HackerRank data temporarily unavailable',
    }
  }
}

module.exports = {
  validateUsername,
  fetchHackerRankProfile,
}