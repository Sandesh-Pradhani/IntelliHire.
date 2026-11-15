/**
 * LeetCode Service - Fetch public LeetCode profile data
 *
 * WHY THIS FILE:
 * Fetches a candidate's LeetCode statistics (problems solved, contest rating)
 * using LeetCode's public GraphQL API. LeetCode does not require authentication
 * for public user stats.
 *
 * WHY THIS APPROACH:
 * - Uses LeetCode's public GraphQL endpoint (leetcode.com/graphql) which is
 *   the official way to query public user data
 * - Fetches user profile and contest rating in parallel
 * - Returns a normalized structure for the AI scoring engine
 *
 * ALTERNATIVES CONSIDERED:
 * - Scraping the profile page: fragile HTML parsing, against ToS
 * - Third-party APIs: unreliable, rate-limited, may require keys
 */

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql'

/**
 * Validate a LeetCode username.
 * LeetCode usernames: alphanumeric + underscore, 1-25 chars.
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'LeetCode username is required' }
  }
  const trimmed = username.trim()
  if (!/^[a-zA-Z0-9_]{1,25}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid LeetCode username. Use 1-25 alphanumeric characters or underscores.' }
  }
  return { valid: true, username: trimmed }
}

/**
 * Fetch LeetCode profile data for a username.
 *
 * Returns:
 * - profile: basic user info (name, avatar, ranking)
 * - problemsSolved: total and by difficulty
 * - contestRating: current contest rating and top percentage
 */
async function fetchLeetCodeProfile(username) {
  const validation = validateUsername(username)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const user = validation.username

  // Query user public profile and problems solved
  const userQuery = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `

  // Query contest rating
  const contestQuery = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        rating
        topPercentage
        attendedContestsCount
      }
    }
  `

  const [userRes, contestRes] = await Promise.all([
    fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQuery, variables: { username: user } }),
    }),
    fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: contestQuery, variables: { username: user } }),
    }),
  ])

  const userData = await userRes.json()
  const contestData = await contestRes.json()

  const matchedUser = userData?.data?.matchedUser
  if (!matchedUser) {
    throw new Error(`LeetCode user "${user}" not found`)
  }

  const acSubmission = matchedUser.submitStatsGlobal?.acSubmissionNum || []
  const difficultyMap = {}
  acSubmission.forEach((item) => {
    difficultyMap[item.difficulty.toLowerCase()] = item.count || 0
  })

  const contestRanking = contestData?.data?.userContestRanking

  return {
    username: user,
    profile: {
      name: matchedUser.profile?.realName || user,
      avatarUrl: matchedUser.profile?.userAvatar || '',
      ranking: matchedUser.profile?.ranking || null,
    },
    problemsSolved: {
      total: difficultyMap.all || 0,
      easy: difficultyMap.easy || 0,
      medium: difficultyMap.medium || 0,
      hard: difficultyMap.hard || 0,
    },
    contestRating: contestRanking
      ? {
          rating: Math.round(contestRanking.rating || 0),
          topPercentage: contestRanking.topPercentage || null,
          attendedContests: contestRanking.attendedContestsCount || 0,
        }
      : null,
  }
}

module.exports = {
  validateUsername,
  fetchLeetCodeProfile,
}