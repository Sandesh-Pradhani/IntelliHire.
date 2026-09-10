const Job = require('../models/Job')
const Application = require('../models/Application')
const AcademicProfile = require('../models/AcademicProfile')

const countBy = (items, mapper) => Object.entries(items.reduce((acc, item) => { const key = mapper(item) || 'Unknown'; acc[key] = (acc[key] || 0) + 1; return acc }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

async function getCompanyIntelligence(organization) {
  const memberIds = organization.members.filter((member) => member.active).map((member) => member.userId)
  const jobs = await Job.find({ $or: [{ organizationId: organization._id }, { postedBy: { $in: memberIds } }] }).lean()
  const jobIds = jobs.map((job) => job._id)
  const applications = await Application.find({ jobId: { $in: jobIds } }).lean()
  const candidateIds = [...new Set(applications.map((application) => String(application.candidateId)))].map((id) => id)
  const academics = await AcademicProfile.find({ candidateId: { $in: candidateIds } }).lean()
  const statusCounts = countBy(applications, (application) => application.status || 'Applied')
  const topRequiredSkills = countBy(jobs.flatMap((job) => job.requiredSkills || []), (skill) => skill).slice(0, 10)
  const topMatchedSkills = countBy(applications.flatMap((application) => application.matchedSkills || []), (skill) => skill).slice(0, 10)
  const collegeDistribution = countBy(academics, (academic) => academic.college).slice(0, 8)
  const activeJobs = jobs.filter((job) => job.status === 'active').length
  const progressed = applications.filter((application) => ['Screening', 'Shortlisted', 'Interview', 'Selected', 'Hired'].includes(application.status)).length
  const hired = applications.filter((application) => application.status === 'Hired').length
  const averageMatch = applications.length ? Math.round(applications.reduce((sum, application) => sum + (application.matchScore || 0), 0) / applications.length) : 0
  const daysToHire = applications.filter((application) => application.status === 'Hired').map((application) => Math.max(0, (new Date(application.updatedAt) - new Date(application.createdAt)) / 86400000))
  const velocity = daysToHire.length ? Math.round(daysToHire.reduce((sum, day) => sum + day, 0) / daysToHire.length) : null
  const pipelineHealth = applications.length === 0 ? 'Build pipeline' : progressed / applications.length >= 0.4 ? 'Healthy' : 'Needs attention'
  return { overview: { activeJobs, applications: applications.length, candidatePool: candidateIds.length, averageMatch, hiringVelocityDays: velocity, pipelineHealth, progressionRate: applications.length ? Math.round((progressed / applications.length) * 100) : 0, hireRate: applications.length ? Math.round((hired / applications.length) * 100) : 0 }, funnel: statusCounts, skillDemand: topRequiredSkills, skillSupply: topMatchedSkills, collegeDistribution, jobs: jobs.map((job) => ({ id: String(job._id), title: job.title, status: job.status, applicants: job.applicantsCount || 0 })) }
}

module.exports = { getCompanyIntelligence }
