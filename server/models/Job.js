const mongoose = require('mongoose')

const JobSchema = new mongoose.Schema({

    title: String,

    company: String,

    description: String,

    requiredSkills: [String],

    experience: Number,

    createdAt: {

        type: Date,

        default: Date.now
    }

})

module.exports = mongoose.model('Job', JobSchema)