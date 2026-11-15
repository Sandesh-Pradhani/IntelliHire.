const Resume = require('../models/Resume')
const Project = require('../models/Project')
const Certificate = require('../models/Certificate')
const CodingProfile = require('../models/CodingProfile')
const Experience = require('../models/Experience')
const Language = require('../models/Language')
const PortfolioLink = require('../models/PortfolioLink')
const AcademicProfile = require('../models/AcademicProfile')
const Job = require('../models/Job')

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)))
const unique = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))]

function buildKnowledgeGraph({ userId, skills, resumes, projects, certificates, experience, links, academic }) {
  const nodes = [{ id: `candidate:${userId}`, type: 'candidate', label: 'Candidate' }]
  const edges = []
  const addNode = (type, id, label, metadata = {}) => nodes.push({ id: `${type}:${id}`, type, label, metadata })
  const relate = (from, to, relation, confidence, evidence = []) => edges.push({ from, to, relation, confidence, evidence })
  const candidateNode = `candidate:${userId}`

  skills.forEach((skill) => {
    const skillNode = `skill:${skill.toLowerCase()}`
    const evidence = [
      ...resumes.filter((item) => (item.extractedSkills || []).some((value) => value.toLowerCase() === skill.toLowerCase())).map(() => 'resume'),
      ...projects.filter((item) => (item.technologies || []).some((value) => value.toLowerCase() === skill.toLowerCase())).map(() => 'project'),
      ...experience.filter((item) => (item.technologies || []).some((value) => value.toLowerCase() === skill.toLowerCase())).map(() => 'experience'),
    ]
    addNode('skill', skill.toLowerCase(), skill, { evidenceCount: evidence.length })
    relate(candidateNode, skillNode, 'has_skill', Math.min(100, 45 + evidence.length * 18), unique(evidence))
  })
  resumes.forEach((item) => {
    const node = `resume:${item._id}`
    addNode('resume', item._id, item.fileName || 'Resume', { atsScore: item.atsScore || 0 })
    relate(candidateNode, node, 'has_resume', 85, ['candidate upload'])
    ;(item.extractedSkills || []).forEach((skill) => relate(node, `skill:${skill.toLowerCase()}`, 'documents', 70, ['resume extraction']))
  })
  projects.forEach((item) => {
    const node = `project:${item._id}`
    addNode('project', item._id, item.title, { github: Boolean(item.githubLink), live: Boolean(item.liveLink) })
    relate(candidateNode, node, 'built', 90, ['candidate portfolio'])
    ;(item.technologies || []).forEach((skill) => relate(node, `skill:${skill.toLowerCase()}`, 'uses', item.githubLink ? 85 : 70, [item.githubLink ? 'GitHub link' : 'project portfolio']))
  })
  experience.forEach((item) => {
    const node = `experience:${item._id}`
    addNode('experience', item._id, `${item.role} at ${item.company}`)
    relate(candidateNode, node, 'worked_as', 90, ['candidate experience'])
    ;(item.technologies || []).forEach((skill) => relate(node, `skill:${skill.toLowerCase()}`, 'applied', 88, ['experience technology']))
  })
  certificates.forEach((item) => { addNode('certificate', item._id, item.name); relate(candidateNode, `certificate:${item._id}`, 'earned', 82, [item.issuer || 'candidate certificate']) })
  links.forEach((item) => { addNode('profile', item._id, item.platform); relate(candidateNode, `profile:${item._id}`, 'has_profile', item.platform === 'GitHub' || item.platform === 'LinkedIn' ? 90 : 70, [item.url]) })
  if (academic) { addNode('education', academic._id, `${academic.branch} · ${academic.college}`, { cgpa: academic.cgpa }); relate(candidateNode, `education:${academic._id}`, 'studied', 85, ['academic profile']) }
  return { nodes, edges, summary: { nodeCount: nodes.length, relationshipCount: edges.length, highConfidenceRelationships: edges.filter((edge) => edge.confidence >= 85).length } }
}

/**
 * Builds an explainable, deterministic candidate representation from records
 * already owned by the candidate. Scores are signals, not hiring decisions.
 * 
 * @param {Object} user - User object
 * @param {String} [jobId] - Optional job ID for job-specific intelligence
 * @param {Object} [aiEngineUrl] - AI engine URL for job matching
 */
async function buildCandidateTwin(user, jobId) {
  const userId = user._id || user.id
  const [resumes, projects, certificates, codingProfiles, experience, languages, links, academic] = await Promise.all([
    Resume.find({ userId }).sort({ uploadedAt: 1 }).lean(),
    Project.find({ userId }).lean(),
    Certificate.find({ userId }).lean(),
    CodingProfile.find({ userId }).lean(),
    Experience.find({ userId }).lean(),
    Language.find({ userId }).lean(),
    PortfolioLink.find({ userId }).lean(),
    AcademicProfile.findOne({ candidateId: userId }).lean(),
  ])

  const skills = unique([
    ...resumes.flatMap((resume) => resume.extractedSkills || []),
    ...projects.flatMap((project) => project.technologies || []),
    ...experience.flatMap((item) => item.technologies || []),
  ])
  const avgAts = resumes.length
    ? resumes.reduce((total, resume) => total + (resume.atsScore || 0), 0) / resumes.length
    : 0
  const latestAts = resumes.at(-1)?.atsScore || 0
  const firstAts = resumes[0]?.atsScore || 0
  const hasGithub = links.some((link) => link.platform === 'GitHub') || projects.some((project) => project.githubLink)
  const hasLinkedIn = links.some((link) => link.platform === 'LinkedIn')
  const projectDescriptions = projects.filter((project) => project.description?.trim()).length
  const codingEvidence = codingProfiles.reduce((total, profile) => total + Math.min(profile.problemsSolved || 0, 100), 0)
  const profileSections = [resumes.length, projects.length, certificates.length, codingProfiles.length, experience.length, languages.length, links.length, academic]
  const completedSections = profileSections.filter(Boolean).length

  const technical = clamp(skills.length * 5 + projects.length * 8 + experience.length * 9 + Math.min(codingEvidence / 5, 16))
  const projectScore = clamp(projects.length * 20 + projectDescriptions * 8 + (hasGithub ? 16 : 0) + projects.filter((item) => item.liveLink).length * 8)
  const learning = clamp(certificates.length * 16 + codingProfiles.length * 13 + Math.max(resumes.length - 1, 0) * 9 + Math.min(skills.length * 2, 20))
  const growth = clamp(45 + Math.max(latestAts - firstAts, 0) * 3 + Math.min(Math.max(resumes.length - 1, 0) * 10, 25) + Math.min(certificates.length * 5, 15))
  const communication = clamp((latestAts || avgAts) * 0.55 + languages.length * 10 + (hasLinkedIn ? 12 : 0) + projectDescriptions * 4)
  const confidence = clamp((completedSections / profileSections.length) * 75 + (skills.length ? 10 : 0) + (hasGithub ? 8 : 0) + (hasLinkedIn ? 7 : 0))
  const ats = clamp(latestAts || avgAts)
  const employability = clamp(ats * 0.25 + technical * 0.24 + projectScore * 0.16 + learning * 0.12 + growth * 0.1 + communication * 0.06 + confidence * 0.07)

  // Job-specific intelligence
  let jobMatchScore = null
  let matchedSkills = []
  let missingSkills = []
  let relevantProjects = []
  let relevantCertificates = []
  let academicSummary = ''
  let recommendation = 'Consider'

  if (jobId) {
    try {
      const job = await Job.findById(jobId).select('title company description technologies location jobType salaryMin salaryMax').lean()
      if (job) {
        // Call AI engine for job matching
        const aiResponse = await axios.post(
          `${process.env.AI_ENGINE_URL}/job-match`,
          {
            job,
            resume: resumes.at(-1) || {},
            candidateSkills: skills,
            requiredSkills: job.technologies || []
          }
        )

        jobMatchScore = aiResponse.data.finalScore || aiResponse.data.matchScore || 0
        matchedSkills = aiResponse.data.matchedSkills || []
        missingSkills = aiResponse.data.missingSkills || []

        // Filter projects by technology relevance
        if (projects.length > 0 && job.technologies) {
          const jobTechSet = new Set(job.technologies.map(t => t.toLowerCase()))
          relevantProjects = projects.filter(project => {
            const projectTechSet = new Set((project.technologies || []).map(t => t.toLowerCase()))
            return [...projectTechSet].some(tech => jobTechSet.has(tech))
          }).slice(0, 5) // Top 5 most relevant
        }

        // Filter certificates by relevance
        if (certificates.length > 0 && job.technologies) {
          const jobTechSet = new Set(job.technologies.map(t => t.toLowerCase()))
          relevantCertificates = certificates.filter(cert => {
            const certSkills = (cert.skills || []).map(s => s.toLowerCase())
            return certSkills.some(skill => jobTechSet.has(skill))
          }).slice(0, 3)
        }

        // Generate academic summary based on job level
        if (job.jobType && academic) {
          const jobLevelMap = {
            'internship': 'entry-level',
            'entry-level': 'entry-level',
            'associate': 'associate',
            'senior': 'senior',
            'lead': 'senior',
            'principal': 'principal',
            'manager': 'management',
            'director': 'executive'
          }
          const expectedLevel = jobLevelMap[job.jobType.toLowerCase()] || 'entry-level'
          academicSummary = `This role is ${expectedLevel}. CGPA: ${academic.cgpa}, Branch: ${academic.branch}`
        }

        // Generate recommendation based on score
        if (jobMatchScore >= 90) {
          recommendation = 'Strongly Recommended'
        } else if (jobMatchScore >= 80) {
          recommendation = 'Recommended'
        } else if (jobMatchScore >= 70) {
          recommendation = 'Consider'
        } else if (jobMatchScore >= 60) {
          recommendation = 'Needs Review'
        } else {
          recommendation = 'Low Match'
        }
      }
    } catch (aiError) {
      console.error('AI matching error:', aiError.message)
      // Continue without AI data if AI engine fails
      jobMatchScore = 0
    }
  }

  const strengths = [
    technical >= 65 && 'Strong technical evidence across skills, projects, and experience.',
    projectScore >= 60 && 'Portfolio demonstrates shipped project work.',
    learning >= 60 && 'Learning momentum is supported by credentials or coding activity.',
    growth >= 65 && 'Profile shows measurable improvement over time.',
    confidence >= 70 && 'Profile is well substantiated across multiple sources.',
  ].filter(Boolean)
  const improvements = [
    !resumes.length && 'Add a resume to establish ATS and skill signals.',
    !projects.length && 'Add one or more projects with outcomes and technology details.',
    !hasGithub && 'Link GitHub or add repository links to validate project work.',
    !hasLinkedIn && 'Add LinkedIn to make your professional story easier to verify.',
    !certificates.length && 'Add relevant certificates or recent learning evidence.',
    !experience.length && 'Add internships, freelance work, or impactful project experience.',
  ].filter(Boolean).slice(0, 4)

  return {
    candidate: { id: String(userId), name: user.name, email: user.email },
    generatedAt: new Date().toISOString(),
    purpose: 'A transparent career-development signal built from candidate-provided information; it is not an automated hiring decision.',
    scores: {
      ats, technical, communication, project: projectScore, learning, growth, confidence, employability,
    },
    explanations: {
      ats: `${resumes.length} resume version${resumes.length === 1 ? '' : 's'}; latest ATS score ${ats}%.`,
      technical: `${skills.length} distinct skills, ${projects.length} projects, and ${experience.length} experience entries contribute.`,
      project: `${projectDescriptions}/${projects.length} projects include descriptions${hasGithub ? '; code evidence is linked' : ''}.`,
      learning: `${certificates.length} certificates, ${codingProfiles.length} coding profiles, and ${resumes.length} resume versions contribute.`,
      confidence: `${completedSections} of ${profileSections.length} evidence sections are complete.`,
    },
    graph: { skills, counts: { resumes: resumes.length, projects: projects.length, certificates: certificates.length, codingProfiles: codingProfiles.length, experience: experience.length, languages: languages.length, links: links.length } },
    knowledgeGraph: buildKnowledgeGraph({ userId, skills, resumes, projects, certificates, experience, links, academic }),
    resumeTimeline: resumes.map((resume, index) => ({ id: String(resume._id), version: index + 1, name: resume.fileName, score: resume.atsScore || 0, date: resume.uploadedAt })),
    insights: { strengths, improvements, nextBestAction: improvements[0] || 'Keep adding recent evidence to maintain your profile.' },
    jobMatchScore,
    matchedSkills,
    missingSkills,
    relevantProjects,
    relevantCertificates,
    academicSummary,
    recommendation
  }
}

module.exports = { buildCandidateTwin }