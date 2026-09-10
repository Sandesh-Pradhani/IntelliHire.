const Job = require('../models/Job')
const User = require('../models/User')
const { searchCandidates } = require('./copilotService')
const { buildCandidateTwin } = require('./candidateTwinService')

const normalize = (value) => String(value || '').toLowerCase().trim()
const unique = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()))]

async function getJobForRecruiter(jobId, recruiterId) {
  const job = await Job.findOne({ _id: jobId, postedBy: recruiterId }).lean()
  if (!job) throw new Error('Job not found')
  return job
}

async function rankForJob(job, limit = 10) {
  const query = `${job.title} ${job.description} ${(job.requiredSkills || []).join(' ')}`
  const results = await searchCandidates(query, limit)
  return results.map((result, index) => ({
    ...result,
    rank: index + 1,
    decision: result.score >= 75 ? 'Strong shortlist' : result.score >= 50 ? 'Review' : 'Developing fit',
    explanation: [
      `Matched ${result.matchedSkills.length} requirement signal${result.matchedSkills.length === 1 ? '' : 's'}.`,
      ...result.evidence,
      result.missingSkills.length ? `Missing or unverified: ${result.missingSkills.slice(0, 3).join(', ')}.` : 'No major query gap identified.',
    ],
  }))
}

function questionFor(skill, index) {
  const prompts = [
    `Explain a production decision you made using ${skill} and the trade-off you considered.`,
    `How would you diagnose a ${skill} implementation that is correct locally but failing in production?`,
    `Design a small feature using ${skill}; describe the API, data flow, tests, and failure cases.`,
  ]
  return prompts[index % prompts.length]
}

async function buildInterviewPlan(candidateId, job) {
  const candidate = await User.findOne({ _id: candidateId, role: 'candidate' }).select('name email').lean()
  if (!candidate) throw new Error('Candidate not found')
  const twin = await buildCandidateTwin(candidate)
  const required = unique(job.requiredSkills || [])
  const candidateSkills = twin.graph.skills
  const matched = required.filter((skill) => candidateSkills.some((item) => normalize(item) === normalize(skill)))
  const missing = required.filter((skill) => !matched.includes(skill))
  const focusSkills = unique([...matched, ...missing, ...candidateSkills]).slice(0, 8)
  const technical = focusSkills.slice(0, 8).map((skill, index) => ({ category: 'Technical', skill, difficulty: index < matched.length ? 'medium' : 'foundational', question: questionFor(skill, index), expectedAnswer: `A clear explanation of ${skill}, a relevant implementation example, and trade-offs or validation steps.`, rubric: ['Correct technical concepts', 'Concrete candidate evidence', 'Trade-off awareness', 'Testing or operational thinking'] }))
  const behavioral = [
    { category: 'Behavioral', skill: 'Collaboration', difficulty: 'medium', question: 'Tell me about a disagreement on a technical decision. How did you reach an outcome?', expectedAnswer: 'A specific situation, respectful collaboration, and measurable outcome.', rubric: ['Clear STAR structure', 'Ownership', 'Collaboration', 'Reflection'] },
    { category: 'Project', skill: 'Portfolio', difficulty: 'medium', question: 'Walk through the most challenging project in your portfolio. What would you change now?', expectedAnswer: 'Architecture rationale, individual contribution, impact, and an honest improvement area.', rubric: ['Architecture depth', 'Personal contribution', 'Impact awareness', 'Learning mindset'] },
  ]
  const readiness = Math.round((twin.scores.technical * 0.45) + (twin.scores.project * 0.25) + (twin.scores.communication * 0.15) + ((required.length ? matched.length / required.length : 1) * 100 * 0.15))
  return { candidate: twin.candidate, job: { id: String(job._id), title: job.title, company: job.company }, readiness: { score: readiness, matchedSkills: matched, skillsToValidate: missing, explanation: `Readiness combines Digital Twin technical (${twin.scores.technical}), project (${twin.scores.project}), communication (${twin.scores.communication}), and job-skill coverage.` }, questions: [...technical, ...behavioral] }
}

async function buildLearningRoadmap(candidate, targetRole, requiredSkills) {
  const twin = await buildCandidateTwin(candidate)
  const required = unique(requiredSkills || [])
  const known = twin.graph.skills
  const missing = required.filter((skill) => !known.some((item) => normalize(item) === normalize(skill)))
  const sequence = missing.map((skill, index) => ({ order: index + 1, skill, duration: index < 2 ? '1–2 weeks' : '2–3 weeks', objective: `Learn core ${skill} concepts and apply them in a small, documented feature.`, project: `Add a ${skill} capability to a ${targetRole || 'target-role'} portfolio project.`, completionEvidence: ['Repository or demo link', 'Concise project write-up', 'Skill added to Digital Twin'] }))
  return { targetRole: targetRole || 'Your target role', currentSkills: known, missingSkills: missing, readiness: required.length ? Math.round(((required.length - missing.length) / required.length) * 100) : twin.scores.employability, sequence, nextStep: sequence[0] || 'Choose a target job description to generate a role-specific roadmap.' }
}

module.exports = { getJobForRecruiter, rankForJob, buildInterviewPlan, buildLearningRoadmap }
