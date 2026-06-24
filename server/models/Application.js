const mongoose = require('mongoose')

const ApplicationSchema = new mongoose.Schema({
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume'
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    candidateName: {
        type: String,
        required: true
    },
    candidateEmail: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    atsScore: {
        type: Number,
        default: 0
    },
    matchScore: {
        type: Number,
        default: 0
    },
    matchedSkills: {
        type: [String],
        default: []
    },
    missingSkills: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: [
            'Applied',
            'Shortlisted',
            'Interview',
            'Rejected',
            'Hired'
        ],
        default: 'Applied'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model(
    'Application',
    ApplicationSchema
)