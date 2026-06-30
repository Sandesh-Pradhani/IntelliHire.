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
    credentialUrl: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Certificate', CertificateSchema)
