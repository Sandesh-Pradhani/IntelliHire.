const mongoose = require('mongoose')

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    industry: { type: String, default: '' },
    website: { type: String, default: '' },
    location: { type: String, default: '' },
    logo: { type: String, default: '' },
    employeeCount: { type: String, default: '' },
    founded: Number,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

module.exports = mongoose.model('Company', CompanySchema)
