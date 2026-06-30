/**
 * Project Model
 * Portfolio projects for candidates
 */

const mongoose = require('mongoose')

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    technologies: [String],
    githubLink: String,
    liveLink: String,
    startDate: Date,
    endDate: Date,
    isOngoing: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Project', ProjectSchema)
