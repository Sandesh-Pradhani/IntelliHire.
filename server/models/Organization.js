const mongoose = require('mongoose')

const MemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'recruiter', 'manager', 'interviewer', 'hr'], default: 'recruiter' },
  department: { type: String, default: 'General' },
  active: { type: Boolean, default: true },
}, { _id: false })

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departments: [{ type: String, trim: true }],
  members: [MemberSchema],
}, { timestamps: true })

OrganizationSchema.index({ 'members.userId': 1 })
module.exports = mongoose.model('Organization', OrganizationSchema)
