// models/Resume.js

const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    fileName: String,

    extractedSkills: [String],

    atsScore: {
        type: Number,
        default: 0
    },

    uploadedAt: {
        type: Date,
        default: Date.now
    },

    extractedText: { type: String, default: '' },
    atsBreakdown: { type: mongoose.Schema.Types.Mixed },
    suggestions: [{ type: String }]

})

module.exports = mongoose.model('Resume', resumeSchema)
