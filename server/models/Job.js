/**
 * Job Model
 * 
 * Enhanced for Phase 2:
 * - Status tracking (active / archived / closed)
 * - postedBy reference to User
 * - applicantsCount
 * - location, jobType, salary range
 */

const mongoose = require('mongoose')

const JobSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    company: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    requiredSkills: [String],

    experience: Number,

    location: {
        type: String,
        default: 'Remote'
    },

    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time'
    },

    salaryMin: Number,
    salaryMax: Number,

    status: {
        type: String,
        enum: ['draft', 'active', 'archived', 'closed'],
        default: 'active'
    },

    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    applicantsCount: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    closedAt: Date
})

module.exports = mongoose.model('Job', JobSchema)

