const mongoose = require('mongoose')

const CertificateScoreSchema = new mongoose.Schema({
    certificateScore: { type: Number, default: 0, min: 0, max: 100 },
    relevanceScore: { type: Number, default: 0, min: 0, max: 100 },
    verificationContribution: { type: Number, default: 0, min: 0, max: 100 },
    skillContribution: { type: Number, default: 0, min: 0, max: 100 },
    freshnessContribution: { type: Number, default: 0, min: 0, max: 100 },
    recommendation: { type: String, default: '' },
    scoredAt: { type: Date, default: Date.now }
}, { _id: false })

const CertificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    issuer: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    issueDate: {
        type: Date,
        required: true
    },
    expiryDate: Date,
    hasExpiry: {
        type: Boolean,
        default: false
    },
    credentialId: {
        type: String,
        trim: true,
        maxlength: 200
    },
    credentialUrl: {
        type: String,
        trim: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    category: {
        type: String,
        trim: true,
        default: 'Other'
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'expired'],
        default: 'unverified'
    },
    evidenceUrl: {
        type: String,
        trim: true
    },
    evidenceFile: {
        originalName: String,
        mimeType: String,
        size: Number,
        path: String
    },
    certificateScore: {
        type: CertificateScoreSchema,
        default: () => ({})
    }
}, {
    timestamps: true
})

CertificateSchema.index({ userId: 1, createdAt: -1 })
CertificateSchema.index({ issuer: 1 })
CertificateSchema.index({ category: 1 })
CertificateSchema.index({ verificationStatus: 1 })
CertificateSchema.index({ userId: 1, name: 1, issuer: 1, credentialId: 1 })

module.exports = mongoose.model('Certificate', CertificateSchema)
