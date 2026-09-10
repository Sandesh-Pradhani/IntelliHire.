/**
 * Notification Model
 * Stores notifications for candidates and recruiters
 */

const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['application', 'status_update', 'interview', 'message', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: String,
    read: {
        type: Boolean,
        default: false
    },
    relatedId: mongoose.Schema.Types.ObjectId // Application, Job, etc.
}, {
    timestamps: true
})

module.exports = mongoose.model('Notification', NotificationSchema)
