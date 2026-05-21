const mongoose = require('mongoose')

const CandidateRankingSchema = new mongoose.Schema({

    candidateId: String,

    jobId: String,

    atsScore: Number,

    matchScore: Number,

    finalScore: Number

})

module.exports = mongoose.model(

    'CandidateRanking',

    CandidateRankingSchema

)