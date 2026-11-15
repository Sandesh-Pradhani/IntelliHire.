/**
 * ResumeBuilder Service
 *
 * Aggregates candidate profile data from all IntelliHire collections
 * and transforms it into a structured resume format.
 */

const ResumeBuilder = require('../models/ResumeBuilder')
const Resume = require('../models/Resume')
const Project = require('../models/Project')
const Certificate = require('../models/Certificate')
const CodingProfile = require('../models/CodingProfile')
const Experience = require('../models/Experience')
const Language = require('../models/Language')
const PortfolioLink = require('../models/PortfolioLink')
const AcademicProfile = require('../models/AcademicProfile')
const User = require('../models/User')

const MAX_VERSIONS = 10

/**
 * Aggregate all candidate profile data from MongoDB collections.
 * Returns a normalized resume-ready object.
 */
async function aggregateProfile(userId) {
  const [
    user,
    resumes,
    projects,
    certificates,
    codingProfiles,
    experience,
    languages,
    links,
    academic,
  ] = await Promise.all([
    User.findById(userId).lean(),
    Resume.find({ userId }).sort({ uploadedAt: -1 }).lean(),
    Project.find({ userId }).sort({ createdAt: -1 }).lean(),
    Certificate.find({ userId }).sort({ createdAt: -1 }).lean(),
    CodingProfile.findOne({ candidateId: userId }).lean(),
    Experience.find({ userId }).sort({ startDate: -1 }).lean(),
    Language.find({ userId }).sort({ createdAt: -1 }).lean(),
    PortfolioLink.find({ userId }).sort({ createdAt: -1 }).lean(),
    AcademicProfile.findOne({ candidateId: userId }).lean(),
  ])

  if (!user) throw new Error('User not found')

  const skills = [
    ...new Set([
      ...resumes.flatMap((r) => r.extractedSkills || []),
      ...projects.flatMap((p) => p.technologies || []),
      ...experience.flatMap((e) => e.technologies || []),
    ]),
  ]

  const githubLink = links.find((l) => l.platform === 'GitHub')
  const linkedInLink = links.find((l) => l.platform === 'LinkedIn')
  const portfolioLink = links.find((l) => l.platform === 'Portfolio')

  const education = academic
    ? [
        {
          degree: academic.branch || '',
          institution: academic.college || '',
          graduationYear: academic.graduationYear || null,
          cgpa: academic.cgpa || null,
          branch: academic.branch || '',
        },
      ]
    : []

  const codingProfilesData = codingProfiles
    ? {
        github: codingProfiles.githubUsername || '',
        leetcode: codingProfiles.leetcodeUsername || '',
        hackerrank: codingProfiles.hackerrankUsername || '',
        problemsSolved: Math.min(
          (codingProfiles.githubData?.totalContributions || 0) +
          (codingProfiles.leetcodeData?.totalSolved || 0) +
          (codingProfiles.hackerrankData?.totalSolved || 0),
          9999
        ),
        ratings: {
          github: codingProfiles.githubData?.totalContributions || 0,
          leetcode: codingProfiles.leetcodeData?.totalSolved || 0,
          hackerrank: codingProfiles.hackerrankData?.totalSolved || 0,
        },
      }
    : { github: '', leetcode: '', hackerrank: '', problemsSolved: 0, ratings: {} }

  return {
    personalInfo: {
      fullName: user.name || '',
      email: user.email || '',
      phone: '',
      location: '',
      linkedIn: linkedInLink?.url || '',
      github: githubLink?.url || '',
      portfolio: portfolioLink?.url || '',
    },
    summary: '',
    skills,
    education,
    experience: experience.map((e) => ({
      company: e.company || '',
      role: e.role || '',
      description: e.description || '',
      startDate: e.startDate || null,
      endDate: e.endDate || null,
      isCurrent: e.isCurrent || false,
      technologies: e.technologies || [],
    })),
    projects: projects.map((p) => ({
      title: p.title || '',
      description: p.description || '',
      technologies: p.technologies || [],
      githubUrl: p.githubUrl || '',
      liveDemoUrl: p.liveDemoUrl || '',
      role: p.role || '',
      duration: p.duration || '',
    })),
    certificates: certificates.map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      issueDate: c.issueDate || null,
      credentialUrl: c.credentialUrl || '',
    })),
    codingProfiles: codingProfilesData,
    achievements: [],
    languages: languages.map((l) => ({
      name: l.name || '',
      proficiency: l.proficiency || 'Basic',
    })),
    links: links.map((l) => ({
      title: l.title || '',
      url: l.url || '',
      platform: l.platform || 'Other',
    })),
    templateId: 'classic-ats',
  }
}

/**
 * Get or create the resume builder document for a candidate.
 * If no document exists, initialize from profile data.
 */
async function getOrCreate(userId) {
  let doc = await ResumeBuilder.findOne({ userId }).lean()
  if (doc) return doc

  const profile = await aggregateProfile(userId)
  doc = await ResumeBuilder.create({ userId, ...profile })
  return doc.toObject()
}

/**
 * Save resume builder data. Creates a version snapshot if significant changes.
 */
async function save(userId, data) {
  const doc = await ResumeBuilder.findOne({ userId })
  if (!doc) throw new Error('ResumeBuilder not found')

  Object.assign(doc, data)
  doc.markModified('personalInfo')
  doc.markModified('codingProfiles')
  doc.markModified('education')
  doc.markModified('experience')
  doc.markModified('projects')
  doc.markModified('certificates')
  doc.markModified('achievements')
  doc.markModified('languages')
  doc.markModified('links')
  doc.markModified('versions')

  await doc.save()
  return doc.toObject()
}

/**
 * Save a version snapshot.
 */
async function saveVersion(userId, name) {
  const doc = await ResumeBuilder.findOne({ userId })
  if (!doc) throw new Error('ResumeBuilder not found')

  const nextVersion = doc.versions.length + 1
  if (doc.versions.length >= MAX_VERSIONS) {
    doc.versions.shift()
  }

  const snapshot = {
    personalInfo: doc.personalInfo,
    summary: doc.summary,
    skills: doc.skills,
    education: doc.education,
    experience: doc.experience,
    projects: doc.projects,
    certificates: doc.certificates,
    codingProfiles: doc.codingProfiles,
    achievements: doc.achievements,
    languages: doc.languages,
    links: doc.links,
    templateId: doc.templateId,
  }

  doc.versions.push({
    versionNumber: nextVersion,
    name: name || `Version ${nextVersion}`,
    savedAt: new Date(),
    snapshot,
  })

  doc.activeVersion = nextVersion
  await doc.save()
  return doc.toObject()
}

/**
 * Restore a version snapshot.
 */
async function restoreVersion(userId, versionId) {
  const doc = await ResumeBuilder.findOne({ userId })
  if (!doc) throw new Error('ResumeBuilder not found')

  const version = doc.versions.id(versionId)
  if (!version) throw new Error('Version not found')

  const snap = version.snapshot
  doc.personalInfo = snap.personalInfo
  doc.summary = snap.summary
  doc.skills = snap.skills
  doc.education = snap.education
  doc.experience = snap.experience
  doc.projects = snap.projects
  doc.certificates = snap.certificates
  doc.codingProfiles = snap.codingProfiles
  doc.achievements = snap.achievements
  doc.languages = snap.languages
  doc.links = snap.links
  doc.templateId = snap.templateId

  await doc.save()
  return doc.toObject()
}

/**
 * Convert resume builder data to plain text for ATS analysis.
 */
function toPlainText(data) {
  const lines = []

  if (data.personalInfo?.fullName) lines.push(data.personalInfo.fullName)
  if (data.personalInfo?.email) lines.push(data.personalInfo.email)
  if (data.personalInfo?.phone) lines.push(data.personalInfo.phone)
  if (data.personalInfo?.location) lines.push(data.personalInfo.location)
  lines.push('')

  if (data.summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(data.summary)
    lines.push('')
  }

  if (data.skills?.length) {
    lines.push('SKILLS')
    lines.push(data.skills.join(', '))
    lines.push('')
  }

  if (data.education?.length) {
    lines.push('EDUCATION')
    data.education.forEach((e) => {
      lines.push(`${e.degree} - ${e.institution} (${e.graduationYear || 'N/A'})`)
      if (e.cgpa) lines.push(`CGPA: ${e.cgpa}`)
    })
    lines.push('')
  }

  if (data.experience?.length) {
    lines.push('EXPERIENCE')
    data.experience.forEach((e) => {
      lines.push(`${e.role} at ${e.company}`)
      if (e.description) lines.push(e.description)
      if (e.technologies?.length) lines.push(`Technologies: ${e.technologies.join(', ')}`)
    })
    lines.push('')
  }

  if (data.projects?.length) {
    lines.push('PROJECTS')
    data.projects.forEach((p) => {
      lines.push(p.title)
      if (p.description) lines.push(p.description)
      if (p.technologies?.length) lines.push(`Technologies: ${p.technologies.join(', ')}`)
    })
    lines.push('')
  }

  if (data.certificates?.length) {
    lines.push('CERTIFICATIONS')
    data.certificates.forEach((c) => {
      lines.push(`${c.name}${c.issuer ? ' - ' + c.issuer : ''}`)
    })
    lines.push('')
  }

  if (data.codingProfiles?.problemsSolved) {
    lines.push('CODING PROFILE')
    if (data.codingProfiles.github) lines.push(`GitHub: ${data.codingProfiles.github}`)
    if (data.codingProfiles.leetcode) lines.push(`LeetCode: ${data.codingProfiles.leetcode}`)
    if (data.codingProfiles.hackerrank) lines.push(`HackerRank: ${data.codingProfiles.hackerrank}`)
    lines.push(`Problems Solved: ${data.codingProfiles.problemsSolved}`)
    lines.push('')
  }

  if (data.achievements?.length) {
    lines.push('ACHIEVEMENTS')
    data.achievements.forEach((a) => lines.push(`- ${a}`))
    lines.push('')
  }

  if (data.languages?.length) {
    lines.push('LANGUAGES')
    data.languages.forEach((l) => lines.push(`${l.name} (${l.proficiency})`))
    lines.push('')
  }

  return lines.join('\n')
}

module.exports = {
  aggregateProfile,
  getOrCreate,
  save,
  saveVersion,
  restoreVersion,
  toPlainText,
}
