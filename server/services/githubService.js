/**
 * GitHub Service - Fetch public GitHub profile data
 *
 * WHY THIS FILE:
 * Fetches a candidate's public GitHub statistics (repositories, contributions,
 * languages) using the public GitHub REST API. No authentication token is
 * required for public profile data, keeping the integration simple.
 *
 * WHY THIS APPROACH:
 * - Uses the public GitHub API (api.github.com) which requires no token for
 *   public profiles, avoiding secret management
 * - Fetches user, repos, and languages in parallel for speed
 * - Returns a normalized structure that the AI scoring engine can consume
 *
 * ALTERNATIVES CONSIDERED:
 * - GitHub GraphQL API: more powerful but requires a token
 * - Scraping the profile page: fragile and against ToS
 */

const BASE_URL = 'https://api.github.com'

/**
 * Validate a GitHub username.
 * GitHub usernames: alphanumeric + hyphen, 1-39 chars, cannot start/end with hyphen.
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'GitHub username is required' }
  }
  const trimmed = username.trim()
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(trimmed)) {
    return { valid: false, error: 'Invalid GitHub username. Use 1-39 alphanumeric characters or hyphens.' }
  }
  return { valid: true, username: trimmed }
}

/**
 * Fetch GitHub profile data for a username.
 *
 * Returns:
 * - profile: basic user info (name, bio, followers, following, public repos)
 * - repos: list of repositories (name, description, language, stars, forks)
 * - languages: aggregated language usage across repos
 * - contributionActivity: derived from public repo count and recency
 */
async function fetchGitHubProfile(username) {
  const validation = validateUsername(username)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const user = validation.username

  // Fetch user and repos in parallel
  const [userRes, reposRes] = await Promise.all([
    fetch(`${BASE_URL}/users/${user}`),
    fetch(`${BASE_URL}/users/${user}/repos?per_page=100&sort=updated`),
  ])

  if (userRes.status === 404) {
    throw new Error(`GitHub user "${user}" not found`)
  }
  if (!userRes.ok) {
    throw new Error(`GitHub API error: ${userRes.status}`)
  }

  const userData = await userRes.json()
  const repos = reposRes.ok ? await reposRes.json() : []

  // Aggregate languages across repos
  const languageCounts = {}
  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
    }
  })

  const languages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  return {
    username: user,
    profile: {
      name: userData.name || user,
      bio: userData.bio || '',
      avatarUrl: userData.avatar_url || '',
      followers: userData.followers || 0,
      following: userData.following || 0,
      publicRepos: userData.public_repos || 0,
      createdAt: userData.created_at || null,
    },
    repos: repos.map((repo) => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || '',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      updatedAt: repo.updated_at || null,
    })),
    languages,
    contributionActivity: {
      totalRepos: repos.length,
      recentlyUpdated: repos.filter((r) => {
        const updated = new Date(r.updated_at || 0)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        return updated > sixMonthsAgo
      }).length,
    },
  }
}

module.exports = {
  validateUsername,
  fetchGitHubProfile,
}