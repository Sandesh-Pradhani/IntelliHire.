/**
 * CodingProfile Model - Unified Coding Profile Integration
 *
 * WHY THIS FILE:
 * Stores a candidate's coding achievements across GitHub, LeetCode, and HackerRank
 * in a SINGLE document. This replaces the old per-platform model so that the
 * AI scoring engine can evaluate all coding data together.
 *
 * WHY THIS APPROACH:
 * - One document per candidate (unique candidateId) simplifies retrieval
 * - Raw platform data (githubData, leetcodeData, hackerrankData) is stored
 *   as flexible subdocuments so the AI engine can score without extra API calls
 * - lastSynced tracks when data was last refreshed from external platforms
 *
 * ALTERNATIVES CONSIDERED:
 * - Per-platform documents (old model): harder to aggregate for scoring
 * - Separate collection per platform: over-engineered for 3 platforms
 */

const mongoose = require('mongoose')

const CodingProfileSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Candidate must have only ONE CodingProfile
    },

    // Platform usernames
    githubUsername: {
      type: String,
      trim: true,
      default: '',
    },
    leetcodeUsername: {
      type: String,
      trim: true,
      default: '',
    },
    hackerrankUsername: {
      type: String,
      trim: true,
      default: '',
    },

    // Raw platform data (flexible subdocuments)
    githubData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    leetcodeData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    hackerrankData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Last time data was synced from external platforms
    lastSynced: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('CodingProfile', CodingProfileSchema)