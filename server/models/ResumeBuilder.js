/**
 * ResumeBuilder Model
 *
 * Stores a candidate's structured resume data built from their IntelliHire profile.
 * Separate from the Resume model (which tracks uploaded PDF files).
 *
 * Supports versioning via snapshots stored in versions[].
 * One document per candidate (unique userId).
 */

const mongoose = require('mongoose')

const EducationEntrySchema = new mongoose.Schema({
  degree: { type: String, trim: true, default: '' },
  institution: { type: String, trim: true, default: '' },
  graduationYear: { type: Number, default: null },
  cgpa: { type: Number, default: null },
  branch: { type: String, trim: true, default: '' },
}, { _id: true })

const ExperienceEntrySchema = new mongoose.Schema({
  company: { type: String, trim: true, default: '' },
  role: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  isCurrent: { type: Boolean, default: false },
  technologies: [{ type: String, trim: true }],
}, { _id: true })

const ProjectEntrySchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  technologies: [{ type: String, trim: true }],
  githubUrl: { type: String, trim: true, default: '' },
  liveDemoUrl: { type: String, trim: true, default: '' },
  role: { type: String, trim: true, default: '' },
  duration: { type: String, trim: true, default: '' },
}, { _id: true })

const CertificateEntrySchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  issuer: { type: String, trim: true, default: '' },
  issueDate: { type: Date, default: null },
  credentialUrl: { type: String, trim: true, default: '' },
}, { _id: true })

const LanguageEntrySchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  proficiency: {
    type: String,
    enum: ['Basic', 'Conversational', 'Professional', 'Native'],
    default: 'Basic',
  },
}, { _id: true })

const LinkEntrySchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  url: { type: String, trim: true, default: '' },
  platform: {
    type: String,
    enum: ['GitHub', 'LinkedIn', 'Portfolio', 'Other'],
    default: 'Other',
  },
}, { _id: true })

const CodingProfilesSchema = new mongoose.Schema({
  github: { type: String, trim: true, default: '' },
  leetcode: { type: String, trim: true, default: '' },
  hackerrank: { type: String, trim: true, default: '' },
  problemsSolved: { type: Number, default: 0 },
  ratings: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false })

const VersionSnapshotSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  name: { type: String, default: '' },
  savedAt: { type: Date, default: Date.now },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
}, { _id: true })

const ResumeBuilderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },

  personalInfo: {
    fullName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    linkedIn: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    portfolio: { type: String, trim: true, default: '' },
  },

  summary: { type: String, trim: true, default: '', maxlength: 600 },

  skills: [{ type: String, trim: true }],

  education: [EducationEntrySchema],

  experience: [ExperienceEntrySchema],

  projects: [ProjectEntrySchema],

  certificates: [CertificateEntrySchema],

  codingProfiles: CodingProfilesSchema,

  achievements: [{ type: String, trim: true }],

  languages: [LanguageEntrySchema],

  links: [LinkEntrySchema],

  templateId: { type: String, default: 'classic-ats' },

  activeVersion: { type: Number, default: 1 },

  versions: [VersionSnapshotSchema],

  atsScore: { type: Number, default: 0 },

  lastOptimizedAt: { type: Date, default: null },

}, {
  timestamps: true,
})

module.exports = mongoose.model('ResumeBuilder', ResumeBuilderSchema)
