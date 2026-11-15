/**
 * Tests for the HackerRank profile adapter.
 */
const test = require('node:test')
const assert = require('node:assert/strict')

const { fetchHackerRankProfile, validateUsername, requestCache } = require('../services/hackerrankService')

const originalFetch = global.fetch

function mockFetchSequence(calls) {
  global.fetch = async (...args) => {
    const next = calls.shift()
    if (!next) {
      throw new Error('Unexpected fetch call')
    }
    const { url, status = 200, jsonBody = null, textBody = '', ok = status >= 200 && status < 300 } = next
    if (url === args[0]) {
      const response = {
        ok,
        status,
        async json() {
          return jsonBody
        },
        async text() {
          return textBody
        },
      }
      return response
    }
    throw new Error(`Unexpected fetch URL: ${args[0]}`)
  }
}

test('validateUsername rejects invalid username values', () => {
  assert.deepEqual(validateUsername(''), { valid: false, error: 'HackerRank username is required' })
  assert.equal(validateUsername('bad-name').valid, false)
  assert.equal(validateUsername('sandesh_pradhani').valid, true)
})

test('fetchHackerRankProfile normalizes a public profile JSON payload', async () => {
  requestCache.clear()
  mockFetchSequence([
    {
      url: 'https://www.hackerrank.com/rest/contests/master/hackers/sandesh_pradhani/profile',
      status: 200,
      jsonBody: {
        model: {
          username: 'sandesh_pradhani',
          name: 'Sandesh Pradhani',
          skills: {
            python: { stars: 3, solved: 42, score: 80 },
            react: { stars: 1, solved: 5, score: 16 },
          },
          totalSolved: 47,
          practiceScore: 540,
        },
      },
    },
  ])

  const result = await fetchHackerRankProfile('sandesh_pradhani')

  assert.equal(result.syncStatus, 'partial')
  assert.equal(result.username, 'sandesh_pradhani')
  assert.equal(result.profile.name, 'Sandesh Pradhani')
  assert.equal(result.stats.challengesSolved, 47)
  assert.equal(result.stats.practiceScore, 540)
  assert.equal(result.badges.length, 2)
  assert.equal(result.stars, 4)
})

test('fetchHackerRankProfile preserves previous data when the public API is rate limited', async () => {
  requestCache.clear()
  const previousData = {
    username: 'sandeshpradhani1',
    stars: 12,
    badges: [{ name: 'python', stars: 3 }],
    badgesCount: 1,
    totalSolved: 10,
    lastSuccessfulSync: '2026-10-13T20:44:59.000Z',
    profile: { name: 'Sandesh Pradhani', avatarUrl: '', country: '', school: '' },
    availableFields: ['badges'],
    unavailableFields: ['challengesSolved'],
  }

  mockFetchSequence([
    {
      url: 'https://www.hackerrank.com/rest/contests/master/hackers/sandeshpradhani1/profile',
      status: 429,
      jsonBody: { error: 'rate limited' },
    },
    {
      url: 'https://www.hackerrank.com/profile/sandeshpradhani1',
      status: 200,
      textBody: '<html><title>HackerRank</title></html>',
    },
  ])

  const result = await fetchHackerRankProfile('sandeshpradhani1', { previousData })

  assert.equal(result.syncStatus, 'partial')
  assert.equal(result.lastSuccessfulSync, previousData.lastSuccessfulSync)
  assert.equal(result.stars, 12)
  assert.equal(result.errorCode, 'public_page_reachable_but_data_unavailable')
})

test('fetchHackerRankProfile uses cached data for repeated requests', async () => {
  requestCache.clear()
  let calls = 0
  global.fetch = async () => {
    calls += 1
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          model: {
            username: 'cached_user',
            name: 'Cached User',
            skills: { python: { stars: 2, solved: 20, score: 60 } },
            totalSolved: 20,
          },
        }
      },
      async text() {
        return '<html><title>HackerRank</title></html>'
      },
    }
  }

  const first = await fetchHackerRankProfile('cached_user')
  const second = await fetchHackerRankProfile('cached_user')

  assert.equal(calls, 1)
  assert.equal(first.username, second.username)
})

test('fetchHackerRankProfile deduplicates concurrent requests for the same username', async () => {
  requestCache.clear()
  let calls = 0
  global.fetch = async () => {
    calls += 1
    await new Promise((resolve) => setTimeout(resolve, 25))
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          model: {
            username: 'java_user',
            skills: { java: { stars: 5, solved: 10, score: 90 } },
            totalSolved: 10,
          },
        }
      },
      async text() {
        return '<html><title>HackerRank</title></html>'
      },
    }
  }

  const [a, b] = await Promise.all([
    fetchHackerRankProfile('java_user'),
    fetchHackerRankProfile('java_user'),
  ])

  assert.equal(calls, 1)
  assert.equal(a.username, 'java_user')
  assert.equal(b.username, 'java_user')
})

test('normalizes the verified real HackerRank profile response', async () => {
  requestCache.clear()

  mockFetchSequence([
    {
      url: 'https://www.hackerrank.com/rest/contests/master/hackers/sandeshpradhani1/profile',
      status: 200,
      jsonBody: {
        model: {
          id: 22625018,
          username: 'sandeshpradhani1',
          country: 'India',
          languages: [],
          created_at: '2023-08-08T09:16:00.000Z',
          level: 5,
          deleted: false,
          name: 'Sandesh Pradhani',
          title: 'O(2<sup>N</sup>)',
          event_count: 0,
          followers_count: 0,
          orchestrate_medals_summary: {
            participated: false,
            has_medals: false,
            tiers: [],
          },
        },
      },
    },
  ])

  const result = await fetchHackerRankProfile('sandeshpradhani1')

  assert.equal(result.profileVerified, true)
  assert.equal(result.username, 'sandeshpradhani1')
  assert.equal(result.profile.name, 'Sandesh Pradhani')
  assert.equal(result.profileDetails.level, 5)
  assert.equal(result.profile.country, 'India')
  assert.equal(result.profileDetails.eventCount, 0)
  assert.equal(result.profileDetails.followersCount, 0)
  assert.equal(result.profileDetails.createdAt, '2023-08-08T09:16:00.000Z')

  assert.equal(result.stats.challengesSolved, null)
  assert.equal(result.stats.practiceScore, null)
  assert.equal(result.totalSolved, null)
  assert.equal(result.syncStatus, 'partial')

  assert.equal(result.errorCode, null)
  assert.equal(result.errorMessage, null)
  assert.equal(result.error, undefined)
})

test('fetchHackerRankProfile clears stale errors after successful verification', async () => {
  requestCache.clear()
  const stalePreviousData = {
    username: 'sandeshpradhani1',
    syncStatus: 'unavailable',
    status: 'data_unavailable',
    errorCode: 'user_not_found',
    errorMessage: 'HackerRank user could not be found',
    error: 'HackerRank user could not be found',
    stars: 0,
    badges: [],
    badgesCount: 0,
    totalSolved: 0,
    lastSuccessfulSync: '2026-10-13T20:44:59.000Z',
  }

  mockFetchSequence([
    {
      url: 'https://www.hackerrank.com/rest/contests/master/hackers/sandeshpradhani1/profile',
      status: 200,
      jsonBody: {
        model: {
          id: 22625018,
          username: 'sandeshpradhani1',
          country: 'India',
          created_at: '2023-08-08T09:16:00.000Z',
          level: 5,
          deleted: false,
          name: 'Sandesh Pradhani',
          event_count: 0,
          followers_count: 0,
        },
      },
    },
  ])

  const result = await fetchHackerRankProfile('sandeshpradhani1', {
    previousData: stalePreviousData,
  })

  assert.equal(result.profileVerified, true)
  assert.equal(result.errorCode, null)
  assert.equal(result.errorMessage, null)
  assert.equal(result.error, undefined)
  assert.equal(result.status, 'connected')
  assert.equal(result.profileDetails.level, 5)
})

test('fetchHackerRankProfile reports unavailable when both endpoints fail', async () => {
  requestCache.clear()

  mockFetchSequence([
    {
      url: 'https://www.hackerrank.com/rest/contests/master/hackers/ghost_user/profile',
      status: 404,
      jsonBody: { error: 'not found' },
    },
    {
      url: 'https://www.hackerrank.com/profile/ghost_user',
      status: 404,
      textBody: 'Not Found',
    },
  ])

  const result = await fetchHackerRankProfile('ghost_user')

  assert.equal(result.syncStatus, 'unavailable')
  assert.equal(result.status, 'data_unavailable')
  assert.equal(result.errorCode, 'public_profile_unavailable')
  assert.equal(result.stats.challengesSolved, null)
  assert.equal(result.stats.practiceScore, null)
})

test.afterEach(() => {
  requestCache.clear()
  global.fetch = originalFetch
})
