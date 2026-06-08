const mongoose = require('mongoose')

const ApplicationSchema = new mongoose.Schema({

    candidate: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User',

        required: true
    },

    job: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'Job',

        required: true
    },

    resume: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'Resume'
    },

    matchScore: {

        type: Number,

        default: 0
    },

    status: {

        type: String,

        enum: [

            'Applied',
            'Shortlisted',
            'Interview',
            'Rejected',
            'Hired'

        ],

        default: 'Applied'
    }

}, {

    timestamps: true
})

module.exports = mongoose.model(

    'Application',

    ApplicationSchema
)