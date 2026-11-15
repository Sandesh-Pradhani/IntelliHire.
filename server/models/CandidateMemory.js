const mongoose = require('mongoose')

// Immutable candidate activity log. This becomes the context layer for copilots
// and background indexing without altering a candidate's source records.
const CandidateMemorySchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  summary: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  dedupeKey: { type: String, unique: true, sparse: true },
}, { timestamps: true })

CandidateMemorySchema.index({ candidateId: 1, createdAt: -1 })

module.exports = mongoose.model('CandidateMemory', CandidateMemorySchema)
