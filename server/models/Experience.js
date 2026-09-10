/**
 * Experience Model
 * Work experience for candidates
 */

const mongoose = require('mongoose')

const ExperienceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    description: String,
    startDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    isCurrent: {
        type: Boolean,
        default: false
    },
    technologies: [String]
}, {
    timestamps: true
})

module.exports = mongoose.model('Experience', ExperienceSchema)
