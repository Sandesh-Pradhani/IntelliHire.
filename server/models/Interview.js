const mongoose = require('mongoose')

const InterviewSchema = new mongoose.Schema({
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    round: { type: String, enum: ['Phone Screening', 'Technical', 'HR', 'Manager', 'Final'], required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 60 },
    location: { type: String, default: '' },
    meetLink: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No-Show'], default: 'Scheduled' },
    candidateResponse: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Rescheduled'], default: 'Pending' },
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        strengths: [String],
        weaknesses: [String],
        comments: String,
        recommendation: { type: String, enum: ['Strong Hire', 'Hire', 'Borderline', 'No Hire', 'Strong No Hire'] }
    }
}, { timestamps: true })

module.exports = mongoose.model('Interview', InterviewSchema)
