/**
 * CodingProfile Model
 * LeetCode, HackerRank, CodeChef profiles
 */

const mongoose = require('mongoose')

const CodingProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    platform: {
        type: String,
        enum: ['LeetCode', 'HackerRank', 'CodeChef', 'Codeforces', 'GeeksforGeeks'],
        required: true
    },
    profileUrl: String,
    username: String,
    rating: Number,
    problemsSolved: Number,
    ranking: String,
    badges: [String]
}, {
    timestamps: true
})

module.exports = mongoose.model('CodingProfile', CodingProfileSchema)
