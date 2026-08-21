/**
 * Certificate Model
 * Professional certifications for candidates
 */

const mongoose = require('mongoose')

const CertificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String,
    skills: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        enum: ['Technology', 'Cloud', 'Data Science', 'Project Management', 'Security', 'AI/ML', 'DevOps', 'Other'],
        default: 'Other'
    },
    evidence: {
        type: String,
        default: ''
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'expired'],
        default: 'unverified'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Certificate', CertificateSchema)
