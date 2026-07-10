const mongoose = require('mongoose')

const RecruiterNoteSchema = new mongoose.Schema({
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    notes: { type: String, default: '' },
    interviewFeedback: { type: String, default: '' },
    strengths: [String],
    weaknesses: [String],
    privateNotes: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('RecruiterNote', RecruiterNoteSchema)
