const CandidateMemory = require('../models/CandidateMemory')

async function recordCandidateMemory({ candidateId, event, entityType, entityId, summary, metadata = {}, dedupeKey }) {
  try {
    return await CandidateMemory.create({ candidateId, event, entityType, entityId, summary, metadata, dedupeKey })
  } catch (error) {
    // Duplicate events are harmless; memory must never block the source action.
    if (error?.code !== 11000) console.error('candidate memory write error:', error.message)
    return null
  }
}

module.exports = { recordCandidateMemory }
