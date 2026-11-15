/**
 * HackerRank Service - resilient public profile integration
 *
 * HackerRank's official public REST profile endpoints are not consistently
 * available for user profiles. Some profiles load in the HTML UI but the JSON
 * API returns 404/403/429 or returns no usable stats. This adapter therefore:
 * - validates username input
 * - tries the public JSON endpoint first
 * - falls back to the public HTML profile page only as a signal that the profile
 *   exists, without assuming the page contains usable data
 * - normalizes successful or partial payloads into a single canonical structure
 * - preserves prior successful data when a refresh fails temporarily
 */

const BASE_URL = 'https://www.hackerrank.com/rest/contests/master/hackers'
const PROFILE_URL = 'https://www.hackerrank.com/profile'
const CACHE_TTL_MS = 5 * 60 * 1000
const requestCache = new Map()
const inFlightRequests = new Map()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function getLastSuccessfulSync(previousData) {
  if (!previousData) return null
  return previousData.lastSuccessfulSync || previousData.lastSync || null
}

function buildEmptyStats() {
  return {
    challengesSolved: null,
    practiceScore: null,
    badges: [],
    certificates: [],
    contests: [],
    submissionCalendar: null,
  }
}

function buildUnavailablePayload(username, error, previousData = null) {
  const lastSuccessfulSync = getLastSuccessfulSync(previousData) || new Date().toISOString()
  const previousLegacy = previousData || {}

  return {
    platform: 'hackerrank',
    username,
    profileUrl: `${PROFILE_URL}/${username}`,
    connected: true,
    syncStatus: 'unavailable',
    stats: buildEmptyStats(),
    availableFields: previousLegacy.availableFields || [],
    unavailableFields: previousLegacy.unavailableFields || [
      'challengesSolved',
      'practiceScore',
      'badges',
      'certificates',
      'contests',
      'submissionCalendar',
    ],
    lastAttemptedSync: new Date().toISOString(),
    lastSuccessfulSync,
    errorCode: error?.code || 'hackerrank_unavailable',
    errorMessage: error?.message || 'HackerRank data temporarily unavailable',
    source: error?.source || null,

    // Legacy compatibility fields used by the existing frontend and scoring logic.
    profile: previousLegacy.profile || {
      name: username,
      avatarUrl: '',
      country: '',
      school: '',
    },
    stars: previousLegacy.stars ?? 0,
    badges: previousLegacy.badges || [],
    badgesCount: previousLegacy.badgesCount || 0,
    totalSolved: previousLegacy.totalSolved ?? 0,
    status: 'data_unavailable',
    lastSync: lastSuccessfulSync || new Date().toISOString(),
    error: error?.message || 'HackerRank data temporarily unavailable',
  }
}

function normalizeBadgeEntry(badgeLike, fallbackName = 'skill') {
  if (!badgeLike || typeof badgeLike !== 'object') {
    return null
  }

  const name = badgeLike.name || badgeLike.skill || badgeLike.title || fallbackName
  const stars = safeNumber(badgeLike.stars ?? badgeLike.starCount ?? badgeLike.points, 0)
  const score = safeNumber(badgeLike.score ?? badgeLike.points, null)
  const solved = safeNumber(badgeLike.solved ?? badgeLike.challengesSolved, 0)

  if (!name && stars === 0 && score === null && solved === 0) {
    return null
  }

  return {
    name,
    stars: Math.max(0, stars || 0),
    score,
    solved: Math.max(0, solved || 0),
  }
}

function normalizeSkillCollection(skills) {
  const badges = []

  if (Array.isArray(skills)) {
    for (const entry of skills) {
      const normalized = normalizeBadgeEntry(entry)
      if (normalized) {
        badges.push(normalized)
      }
    }
    return badges
  }

  if (skills && typeof skills === 'object') {
    for (const [skillName, entry] of Object.entries(skills)) {
      const normalized = normalizeBadgeEntry(entry, skillName)
      if (normalized) {
        badges.push(normalized)
      }
    }
  }

  return badges
}

function normalizeFromPayload(rawPayload, username, previousData = null) {
  const model = rawPayload?.model

  if (
    !model ||
    typeof model !== 'object' ||
    typeof model.username !== 'string' ||
    model.username.toLowerCase() !== username.toLowerCase() ||
    model.deleted === true
  ) {
    throw new Error('Invalid or mismatched HackerRank profile response')
  }

  const badges = normalizeSkillCollection(
    model.skills || model.badges || []
  ).filter(
    badge =>
      badge.stars > 0 ||
      badge.score !== null ||
      badge.solved > 0
  )

  const totalStars = badges.reduce(
    (sum, badge) => sum + badge.stars,
    0
  )

  const stats = {
    challengesSolved: safeNumber(
      model.totalSolved ?? model.challengesSolved,
      null
    ),
    practiceScore: safeNumber(
      model.practiceScore ?? model.score,
      null
    ),
    badges,
    certificates: Array.isArray(model.certificates)
      ? model.certificates
      : [],
    contests: Array.isArray(model.contests)
      ? model.contests
      : [],
    submissionCalendar: model.submissionCalendar || null,
  }

  const availableFields = []
  const unavailableFields = []

  for (const [key, value] of Object.entries(stats)) {
    if (
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    ) {
      unavailableFields.push(key)
    } else {
      availableFields.push(key)
    }
  }

  // Sync is only fully successful when every stat field could be retrieved.
  // A verified profile with missing practice stats reports 'partial'.
  const totalStatFields = Object.keys(stats).length
  const syncStatus = availableFields.length === totalStatFields ? 'success' : 'partial'

  const now = new Date().toISOString()

  return {
    platform: 'hackerrank',
    username: model.username,
    profileUrl: `${PROFILE_URL}/${model.username}`,

    connected: true,
    profileVerified: true,
    syncStatus,

    profile: {
      name: model.name || model.username,
      avatarUrl: model.avatar || '',
      country: model.country || '',
      school: model.school || '',
    },

    profileDetails: {
      hackerRankId: model.id ?? null,
      level: safeNumber(model.level),
      title: model.title || null,
      createdAt: model.created_at || null,
      eventCount: safeNumber(model.event_count),
      followersCount: safeNumber(model.followers_count),
      languages: Array.isArray(model.languages)
        ? model.languages
        : [],
      medals: model.orchestrate_medals_summary || null,
    },

    stats,
    availableFields,
    unavailableFields,

    lastAttemptedSync: now,
    lastSuccessfulSync: now,

    errorCode: null,
    errorMessage: null,
    source: 'hackerrank_public_profile',

    // Preserve compatibility with existing consumers.
    stars: totalStars,
    badges,
    badgesCount: badges.length,

    // Do not misrepresent missing statistics as zero.
    totalSolved: stats.challengesSolved,
    practiceScore: stats.practiceScore,

    status: 'connected',
    lastSync: now,
  }
}

async function fetchWithRetry(url, init, retries = 2, backoffMs = 400) {
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(url, { ...init, signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok && response.status >= 500 && attempt < retries) {
        lastError = new Error(`HackerRank service returned ${response.status}`)
        lastError.code = 'service_unavailable'
        lastError.statusCode = response.status
        await sleep(backoffMs * (attempt + 1))
        continue
      }
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error
      if (attempt < retries) {
        await sleep(backoffMs * (attempt + 1))
        continue
      }
      throw error
    }
  }

  throw lastError || new Error('HackerRank fetch failed')
}

async function fetchPublicHtmlProfile(username) {
  const pageUrl = `${PROFILE_URL}/${username}`
  const response = await fetchWithRetry(pageUrl, {
    method: 'GET',
    headers: { Accept: 'text/html' },
  })

  if (!response.ok) {
    const error = new Error(`HackerRank profile page returned ${response.status}`)
    error.code = response.status === 404 ? 'profile_not_found' : response.status === 429 ? 'rate_limited' : 'profile_unavailable'
    error.statusCode = response.status
    throw error
  }

  return response.text()
}

async function fetchPublicJsonProfile(username) {
  const response = await fetchWithRetry(
    `${BASE_URL}/${username}/profile`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  )

  if (response.status === 404) {
    const error = new Error('HackerRank public profile unavailable')
    error.code = 'public_profile_unavailable'
    error.statusCode = 404
    throw error
  }

  if (response.status === 403) {
    const error = new Error('HackerRank profile access forbidden')
    error.code = 'forbidden'
    error.statusCode = 403
    throw error
  }

  if (response.status === 429) {
    const error = new Error('HackerRank rate limit reached')
    error.code = 'rate_limited'
    error.statusCode = 429
    throw error
  }

  if (!response.ok) {
    const error = new Error(`HackerRank API error: ${response.status}`)
    error.code = 'api_error'
    error.statusCode = response.status
    throw error
  }

  return response.json()
}

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
 * Important: the public profile JSON endpoint is not reliably available for all
 * users. When it is blocked or malformed, we preserve the previous successful
 * snapshot instead of replacing it with fabricated defaults.
 */
async function fetchHackerRankProfile(username, options = {}) {
  const validation = validateUsername(username)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const user = validation.username
  const previousData = options.previousData || null
  const cacheKey = `hackerrank:${user.toLowerCase()}`
  const cached = requestCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.payload
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)
  }

  const requestPromise = (async () => {
    try {
      const json = await fetchPublicJsonProfile(user)
      const normalized = normalizeFromPayload(json, user, previousData)
      const canonical = {
        ...normalized,
        lastSuccessfulSync: normalized.lastSuccessfulSync || new Date().toISOString(),
      }
      requestCache.set(cacheKey, { fetchedAt: Date.now(), payload: canonical })
      return canonical
    } catch (jsonError) {
      try {
        const html = await fetchPublicHtmlProfile(user)
        if (typeof html === 'string' && html.length > 0 && /HackerRank/.test(html)) {
          const partial = {
            platform: 'hackerrank',
            username: user,
            profileUrl: `${PROFILE_URL}/${user}`,
            connected: true,
            syncStatus: 'partial',
            stats: buildEmptyStats(),
            availableFields: [],
            unavailableFields: ['challengesSolved', 'practiceScore', 'badges', 'certificates', 'contests', 'submissionCalendar'],
            lastAttemptedSync: new Date().toISOString(),
            lastSuccessfulSync: getLastSuccessfulSync(previousData),
            errorCode: 'public_page_reachable_but_data_unavailable',
            errorMessage: 'HackerRank profile page loads without a public data payload for automated sync.',
            source: 'hackerrank_public_html',
            profile: previousData?.profile || { name: user, avatarUrl: '', country: '', school: '' },
            stars: previousData?.stars ?? 0,
            badges: previousData?.badges || [],
            badgesCount: previousData?.badgesCount || 0,
            totalSolved: previousData?.totalSolved ?? 0,
            status: 'data_unavailable',
            lastSync: getLastSuccessfulSync(previousData) || new Date().toISOString(),
            error: 'HackerRank profile page loads without a public data payload for automated sync.',
          }
          requestCache.set(cacheKey, { fetchedAt: Date.now(), payload: partial })
          return partial
        }
      } catch (pageError) {
        // Fall through to the structured unavailable payload below.
      }

      const unavailablePayload = buildUnavailablePayload(user, jsonError, previousData)
      requestCache.set(cacheKey, { fetchedAt: Date.now(), payload: unavailablePayload })
      return unavailablePayload
    }
  })()

  inFlightRequests.set(cacheKey, requestPromise)
  try {
    return await requestPromise
  } finally {
    inFlightRequests.delete(cacheKey)
  }
}

module.exports = {
  validateUsername,
  fetchHackerRankProfile,
  requestCache,
}