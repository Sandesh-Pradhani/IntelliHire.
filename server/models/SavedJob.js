/**
 * SavedJob Model
 * Allows candidates to save/bookmark jobs for later
 */

const mongoose = require('mongoose')

const SavedJobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    }
}, {
    timestamps: true
})

// Prevent duplicate saves
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true })

module.exports = mongoose.model('SavedJob', SavedJobSchema)
