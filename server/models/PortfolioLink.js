/**
 * PortfolioLink Model
 * Portfolio / personal website links for candidates
 */

const mongoose = require('mongoose')

const PortfolioLinkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ['GitHub', 'LinkedIn', 'Portfolio', 'Other'],
        default: 'Other'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('PortfolioLink', PortfolioLinkSchema)
