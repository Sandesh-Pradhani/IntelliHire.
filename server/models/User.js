const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['candidate', 'recruiter', 'admin'],
        default: 'candidate',
        required: true
    },

    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    notificationPrefs: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        applicationUpdates: { type: Boolean, default: true },
        interviewInvites: { type: Boolean, default: true },
        offers: { type: Boolean, default: true }
    },
    privacy: {
        showEmail: { type: Boolean, default: false },
        showPhone: { type: Boolean, default: false },
        profileVisible: { type: Boolean, default: true }
    },
    isActive: { type: Boolean, default: true }

}, {

    timestamps: true
})

module.exports = mongoose.model('User', UserSchema)
