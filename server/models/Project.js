/**
 * Project Model
 *
 * Problem solved: Candidates need a structured way to showcase projects as part
 * of their professional portfolio. Recruiters need AI-scored project data to
 * evaluate practical experience alongside academic and coding achievements.
 *
 * Reason: Extended schema supports comprehensive project metadata including
 * AI scoring, technology categorization, team collaboration info, and
 * GitHub integration readiness.
 *
 * Alternative: Separate Project and ProjectScore models — rejected because
 * keeping scores embedded avoids extra joins and simplifies queries.
 */

const mongoose = require('mongoose')

const ProjectScoreSchema = new mongoose.Schema({
    technologyScore: { type: Number, default: 0, min: 0, max: 100 },
    complexityScore: { type: Number, default: 0, min: 0, max: 100 },
    documentationScore: { type: Number, default: 0, min: 0, max: 100 },
    portfolioScore: { type: Number, default: 0, min: 0, max: 100 },
    recommendation: { type: String, default: '' },
    scoredAt: { type: Date, default: Date.now }
}, { _id: false })

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    technologies: [{
        type: String,
        trim: true
    }],
    githubUrl: {
        type: String,
        trim: true
    },
    liveDemoUrl: {
        type: String,
        trim: true
    },
    images: [{
        type: String
    }],
    category: {
        type: String,
        enum: ['Web Development', 'Mobile Development', 'AI/ML', 'Data Science', 'DevOps', 'Backend', 'Frontend', 'Full Stack', 'Other'],
        default: 'Other'
    },
    duration: {
        type: String,
        trim: true
    },
    teamSize: {
        type: Number,
        min: 1,
        default: 1
    },
    role: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['completed', 'in-progress', 'planned'],
        default: 'completed'
    },
    projectScore: {
        type: ProjectScoreSchema,
        default: () => ({})
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

ProjectSchema.index({ userId: 1, createdAt: -1 })
ProjectSchema.index({ technologies: 1 })
ProjectSchema.index({ category: 1 })
ProjectSchema.index({ 'projectScore.portfolioScore': -1 })

module.exports = mongoose.model('Project', ProjectSchema)
