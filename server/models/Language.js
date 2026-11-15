/**
 * Language Model
 * Languages known by candidates
 */

const mongoose = require('mongoose')

const LanguageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    proficiency: {
        type: String,
        enum: ['Basic', 'Conversational', 'Professional', 'Native'],
        default: 'Basic'
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Language', LanguageSchema)
