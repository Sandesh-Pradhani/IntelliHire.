const mongoose = require('mongoose')

const AcademicProfileSchema = new mongoose.Schema({

    candidateId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User',

        required: true,

        unique: true
    },

    cgpa: {

        type: Number,

        required: true,

        min: 0,

        max: 10
    },

    branch: {

        type: String,

        required: true
    },

    college: {

        type: String,

        required: true
    },

    university: {

        type: String,

        default: ''
    },

    graduationYear: {

        type: Number,

        required: true
    },

    currentSemester: {

        type: Number,

        required: true
    },

    backlogs: {

        type: Number,

        default: 0
    },

    academicAchievements: {

        type: [String],

        default: []
    }

}, {

    timestamps: true
})

module.exports = mongoose.model(
    'AcademicProfile',
    AcademicProfileSchema
)