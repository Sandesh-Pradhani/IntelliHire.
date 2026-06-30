/**
 * Application Model
 * Enhanced for Phase 2:
 * - Full pipeline statuses (Screening, Shortlisted, Interview, Selected, Rejected, Hired)
 * - Timeline/history array
 * - Recruiter notes and comments
 * - Candidate visible status tracking
 */

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
            'Screening',
            'Shortlisted',
            'Interview',
            'Selected',
            'Rejected',
            'Hired'
        ],
        default: 'Applied'
    },

    timeline: [{
        status: {
            type: String,
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: {
            type: String,
            enum: ['candidate', 'recruiter'],
            required: true
        },
        note: String
    }],

    recruiterNotes: {
        type: String,
        default: ''
    },

    interviewDate: Date,
    interviewType: {
        type: String,
        enum: ['Phone', 'Video', 'On-site', 'Technical', 'HR'],
        default: 'Video'
    },

    isVisibleToCandidate: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
})

module.exports = mongoose.model(
    'Application',
    ApplicationSchema
)
