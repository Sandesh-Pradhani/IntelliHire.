const axios = require('axios')
const User = require('../models/User')
const Resume = require('../models/Resume')
const Project = require('../models/Project')
const Experience = require('../models/Experience')
const Certificate = require('../models/Certificate')
const { buildCandidateTwin } = require('./candidateTwinService')

const STOP_WORDS = new Set(['a', 'an', 'and', 'are', 'best', 'candidate', 'candidates', 'developer', 'developers', 'find', 'for', 'in', 'of', 'or', 'show', 'the', 'to', 'with', 'who'])
const normalize = (value) => String(value || '').toLowerCase().trim()
const unique = (values) => [...new Set(values.filter(Boolean))]
const queryTerms = (query) => unique(normalize(query).match(/[a-z0-9+#.]+/g)?.filter((word) => word.length > 1 && !STOP_WORDS.has(word)) || [])

async function candidateCorpus(candidate) {
  const [resumes, projects, experience, certificates] = await Promise.all([
    Resume.find({ userId: candidate._id }).sort({ uploadedAt: -1 }).lean(),
    Project.find({ userId: candidate._id }).lean(),
    Experience.find({ userId: candidate._id }).lean(),
    Certificate.find({ userId: candidate._id }).lean(),
  ])
  const skills = unique([
    ...resumes.flatMap((item) => item.extractedSkills || []),
    ...projects.flatMap((item) => item.technologies || []),
    ...experience.flatMap((item) => item.technologies || []),
  ].map(normalize))
  const document = [
    candidate.name,
    ...skills,
    ...projects.flatMap((item) => [item.title, item.description]),
    ...experience.flatMap((item) => [item.role, item.company, item.description]),
    ...certificates.flatMap((item) => [item.name, item.issuer]),
  ].filter(Boolean).join(' ')
  return { candidate, resumes, projects, experience, certificates, skills, document }
}

function lexicalResult(query, corpus) {
  const terms = queryTerms(query)
  const haystack = normalize(corpus.document)
  const matchedSkills = corpus.skills.filter((skill) => terms.some((term) => skill.includes(term) || term.includes(skill)))
  const matchedTerms = terms.filter((term) => haystack.includes(term))
  const missingSkills = terms.filter((term) => !matchedTerms.includes(term))
  const score = terms.length ? Math.round((matchedTerms.length / terms.length) * 70 + Math.min(corpus.skills.length * 2, 20) + Math.min(corpus.projects.length * 4, 10)) : 0
  return { score: Math.min(score, 100), matchedSkills, missingSkills, method: 'local-evidence' }
}

async function semanticResult(query, corpus) {
  try {
    const aiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000'
    const response = await axios.post(`${aiUrl}/job-match`, { resume: corpus.document, job: query }, { timeout: 7000 })
    const data = response.data?.data || response.data
    return {
      score: Math.round(data?.unified_ranking?.overall_score || data?.semantic_match?.similarity_score || data?.finalScore || 0),
      matchedSkills: data?.matchedSkills || [],
      missingSkills: data?.missingSkills || [],
      method: data?.semantic_match?.method === 'sbert' ? 'sbert-semantic' : 'semantic-fallback',
    }
  } catch (_) {
    return lexicalResult(query, corpus)
  }
}

async function searchCandidates(query, limit = 8) {
  const candidates = await User.find({ role: 'candidate' }).select('name email').limit(100).lean()
  const corpora = await Promise.all(candidates.map(candidateCorpus))
  const ranked = await Promise.all(corpora.map(async (corpus) => {
    const result = await semanticResult(query, corpus)
    const evidence = [
      result.matchedSkills.length && `Matched skills: ${result.matchedSkills.slice(0, 4).join(', ')}`,
      corpus.projects.length && `${corpus.projects.length} project${corpus.projects.length === 1 ? '' : 's'} provides portfolio evidence`,
      corpus.experience.length && `${corpus.experience.length} experience entr${corpus.experience.length === 1 ? 'y' : 'ies'} provides applied evidence`,
    ].filter(Boolean)
    return { candidateId: String(corpus.candidate._id), name: corpus.candidate.name, email: corpus.candidate.email, score: result.score, matchedSkills: result.matchedSkills, missingSkills: result.missingSkills, evidence, method: result.method }
  }))
  return ranked.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, Math.min(Math.max(limit, 1), 20))
}

async function answerCandidateQuestion(candidate, question) {
  const twin = await buildCandidateTwin(candidate)
  const text = normalize(question)
  let answer
  let actions = [twin.insights.nextBestAction]
  if (text.includes('ats')) {
    answer = `Your current ATS signal is ${twin.scores.ats}%. It is supported by ${twin.graph.counts.resumes} resume version(s) and ${twin.graph.skills.length} documented skills.`
    actions = twin.insights.improvements.filter((item) => /resume|github|linkedin|project/i.test(item)).slice(0, 3)
  } else if (text.includes('project')) {
    answer = `Your project signal is ${twin.scores.project}%. Build a project that demonstrates a missing or target skill, includes a clear problem statement, a technology stack, and a public repository.`
    actions = ['Choose one target role and identify its recurring skills.', 'Build an end-to-end project with measurable outcomes.', 'Link the repository and describe your technical decisions.']
  } else if (text.includes('certificate')) {
    answer = `Your learning signal is ${twin.scores.learning}%, based on ${twin.graph.counts.certificates} certificate(s), coding evidence, and resume progress. Certificates are strongest when paired with a related project.`
    actions = ['Prioritize a certificate aligned to your target role.', 'Turn the learning into a portfolio project.', 'Add the credential and project evidence to your profile.']
  } else if (text.includes('rank') || text.includes('company') || text.includes('target')) {
    answer = `Your employability signal is ${twin.scores.employability}%. Target roles where your documented skills (${twin.graph.skills.slice(0, 6).join(', ') || 'still being built'}) overlap with the job requirements, then use Job Match to identify gaps.`
    actions = twin.insights.improvements.slice(0, 3)
  } else {
    answer = `Your Digital Twin currently shows ${twin.scores.employability}% employability, with ${twin.knowledgeGraph.summary.relationshipCount} evidence relationships. The best next step is to strengthen the weakest evidence area.`
  }
  return { answer, actions: actions.filter(Boolean), twin: { scores: twin.scores, skills: twin.graph.skills } }
}

module.exports = { searchCandidates, answerCandidateQuestion }
