/**
 * Candidate Intelligence Service
 *
 * Provides a unified backend aggregation layer that combines:
 * - User (identity & contact)
 * - Resume (active resume, ATS score, extracted skills, timeline)
 * - AcademicProfile (CGPA, college, branch, year, backlogs)
 * - CodingProfile (GitHub, LeetCode, HackerRank stats, problems solved)
 * - Projects (portfolio, tech stack, github/demo URLs, project scores)
 * - Certificates (name, issuer, credential URL, verification)
 * - Applications (history, applied jobs, statuses, timeline, recruiter notes)
 * - AI Evaluation (Consolidated scores, job matching, strengths, gaps, recommendation)
 *
 * ONE single source of truth for candidate evaluation and scoring.
 */

const axios = require('axios')
const User = require('../models/User')
const Resume = require('../models/Resume')
const AcademicProfile = require('../models/AcademicProfile')
const CodingProfile = require('../models/CodingProfile')
const Project = require('../models/Project')
const Certificate = require('../models/Certificate')
const Application = require('../models/Application')
const Job = require('../models/Job')

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value || 0)))
const unique = (values) => [...new Set((values || []).filter(Boolean).map((v) => String(v).trim()).filter(Boolean))]

/**
 * Calculate explainable recommendation tier based on final AI score.
 */
function getRecommendationTier(score) {
  if (score >= 90) return 'Strongly Recommended'
  if (score >= 80) return 'Recommended'
  if (score >= 70) return 'Consider'
  if (score >= 60) return 'Needs Review'
  return 'Low Match'
}

/**
 * Fetch and aggregate full unified candidate intelligence.
 *
 * @param {string} candidateId - Candidate User ObjectId
 * @param {string} [jobId] - Optional Job ObjectId for job-specific evaluation
 * @returns {Promise<Object>} Unified Candidate Intelligence payload
 */
async function getCandidateIntelligence(candidateId, jobId = null) {
  // 1. Parallel fetch of all candidate data across MongoDB collections
  const [
    user,
    resumes,
    academic,
    codingProfile,
    projects,
    certificates,
    applications,
    targetJob
  ] = await Promise.all([
    User.findById(candidateId).select('name email role createdAt').lean(),
    Resume.find({ userId: candidateId }).sort({ uploadedAt: -1 }).lean(),
    AcademicProfile.findOne({ candidateId }).lean(),
    CodingProfile.findOne({ candidateId }).lean(),
    Project.find({ userId: candidateId }).sort({ createdAt: -1 }).lean(),
    Certificate.find({ userId: candidateId }).sort({ createdAt: -1 }).lean(),
    Application.find({ candidateId })
      .populate('jobId', 'title company location jobType salaryMin salaryMax status')
      .sort({ createdAt: -1 })
      .lean(),
    jobId ? Job.findById(jobId).lean() : Promise.resolve(null)
  ])

  if (!user) {
    const error = new Error('Candidate not found')
    error.status = 404
    throw error
  }

  // 2. Normalize and extract skills from all candidate signals
  const latestResume = resumes && resumes.length > 0 ? resumes[0] : null
  const candidateSkills = unique([
    ...(latestResume?.extractedSkills || []),
    ...resumes.flatMap((r) => r.extractedSkills || []),
    ...projects.flatMap((p) => p.technologies || []),
    ...certificates.flatMap((c) => (c.skills ? (Array.isArray(c.skills) ? c.skills : [c.skills]) : []))
  ])

  // 3. Coding profile aggregation
  let totalProblemsSolved = 0
  let githubContributions = 0
  let codingScore = 0

  if (codingProfile) {
    const leetcodeSolved = codingProfile.leetcodeData?.totalSolved || codingProfile.leetcodeData?.solvedProblems || 0
    const hackerrankSolved = codingProfile.hackerrankData?.totalSolved || codingProfile.hackerrankData?.badgesCount || 0
    githubContributions = codingProfile.githubData?.totalContributions || codingProfile.githubData?.publicRepos || 0
    totalProblemsSolved = leetcodeSolved + hackerrankSolved

    // Coding score calculation (0-100)
    codingScore = clamp(
      (leetcodeSolved > 0 ? Math.min(leetcodeSolved * 0.4, 50) : 0) +
      (githubContributions > 0 ? Math.min(githubContributions * 0.8, 30) : 0) +
      (hackerrankSolved > 0 ? Math.min(hackerrankSolved * 1.5, 20) : 0)
    )
  }

  // 4. Academic score calculation (0-100)
  let academicScore = 0
  let academicSummary = 'Academic profile not provided'
  if (academic) {
    const cgpa = Number(academic.cgpa) || 0
    const backlogs = Number(academic.backlogs) || 0
    const achievementBonus = Math.min((academic.academicAchievements || []).length * 3, 10)
    academicScore = clamp((cgpa / 10) * 100 - backlogs * 8 + achievementBonus)
    const uni = academic.university || academic.college || 'University'
    academicSummary = `CGPA: ${cgpa}/10 · ${academic.branch || 'Degree'} at ${uni} (Grad: ${academic.graduationYear || 'N/A'})`
  }

  // 5. Project portfolio score calculation (0-100)
  let projectScore = 0
  if (projects && projects.length > 0) {
    const scoredProjects = projects.filter((p) => p.projectScore?.portfolioScore > 0)
    const avgEmbeddedScore = scoredProjects.length > 0
      ? scoredProjects.reduce((sum, p) => sum + (p.projectScore.portfolioScore || 0), 0) / scoredProjects.length
      : 0

    const hasGithubCount = projects.filter((p) => p.githubUrl).length
    const hasDemoCount = projects.filter((p) => p.liveDemoUrl).length
    const hasDetailedDesc = projects.filter((p) => p.description && p.description.length > 50).length

    projectScore = clamp(
      Math.min(projects.length * 15, 45) +
      Math.min(hasGithubCount * 10, 20) +
      Math.min(hasDemoCount * 10, 15) +
      Math.min(hasDetailedDesc * 5, 10) +
      (avgEmbeddedScore * 0.1)
    )
  }

  // 6. Certificate score calculation (0-100)
  let certificateScore = 0
  if (certificates && certificates.length > 0) {
    const verifiedCount = certificates.filter((c) => c.verificationStatus === 'verified').length
    const withCredentialCount = certificates.filter((c) => c.credentialUrl || c.credentialId).length
    const withSkillsCount = certificates.filter((c) => c.skills && c.skills.length > 0).length
    certificateScore = clamp(
      Math.min(certificates.length * 15, 45) +
      Math.min(verifiedCount * 20, 20) +
      Math.min(withCredentialCount * 10, 20) +
      Math.min(withSkillsCount * 5, 15)
    )
  }

  // 7. ATS Score (0-100)
  const atsScore = latestResume ? clamp(latestResume.atsScore || 0) : 0

  // 8. Job-Specific Evaluation (if targetJob is provided)
  let jobMatchScore = null
  let semanticMatch = 0
  let matchedSkills = []
  let missingSkills = []
  let relevantProjects = []
  let relevantCertificates = []
  let currentJobApplication = null

  if (targetJob) {
    const requiredJobSkills = unique([
      ...(targetJob.technologies || []),
      ...(targetJob.requiredSkills || [])
    ])

    // Find if candidate applied for this specific job
    currentJobApplication = applications.find(
      (app) => app.jobId && (String(app.jobId._id || app.jobId) === String(targetJob._id))
    ) || null

    // Call FastAPI AI Engine for job-matching if available, with deterministic fallback
    try {
      const aiUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000'
      const matchResponse = await axios.post(`${aiUrl}/job-match`, {
        job: `${targetJob.title || ''} ${targetJob.description || ''} ${requiredJobSkills.join(' ')}`,
        resume: latestResume ? `${latestResume.fileName || ''} ${candidateSkills.join(' ')}` : candidateSkills.join(' ')
      }, { timeout: 3500 })

      const aiData = matchResponse.data.data || matchResponse.data
      semanticMatch = clamp(aiData.finalScore || aiData.similarity || 0)
      matchedSkills = unique(aiData.matchedSkills || [])
      missingSkills = unique(aiData.missingSkills || [])
    } catch (aiErr) {
      console.log('[CandidateIntelligenceService] AI engine fallback for job match:', aiErr.message)

      // Robust rule-based semantic match fallback
      if (requiredJobSkills.length > 0) {
        const candidateSkillSet = new Set(candidateSkills.map((s) => s.toLowerCase()))
        matchedSkills = requiredJobSkills.filter((req) => candidateSkillSet.has(req.toLowerCase()))
        missingSkills = requiredJobSkills.filter((req) => !candidateSkillSet.has(req.toLowerCase()))
        const matchRatio = matchedSkills.length / requiredJobSkills.length
        semanticMatch = clamp(matchRatio * 100)
      } else {
        matchedSkills = candidateSkills.slice(0, 5)
        missingSkills = []
        semanticMatch = clamp(atsScore || 60)
      }
    }

    jobMatchScore = semanticMatch

    // Filter relevant projects by job requirements
    const jobSkillSet = new Set([
      ...requiredJobSkills.map((s) => s.toLowerCase()),
      ...(targetJob.title ? targetJob.title.toLowerCase().split(/\s+/) : [])
    ])

    relevantProjects = projects
      .map((proj) => {
        const projSkills = (proj.technologies || []).map((t) => t.toLowerCase())
        const overlapCount = projSkills.filter((t) => jobSkillSet.has(t)).length
        return {
          ...proj,
          isRelevant: overlapCount > 0,
          relevanceScore: overlapCount
        }
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Filter relevant certificates
    relevantCertificates = certificates
      .map((cert) => {
        const certName = (cert.name || '').toLowerCase()
        const isRelevant = [...jobSkillSet].some((term) => term.length > 2 && certName.includes(term))
        return {
          ...cert,
          isRelevant
        }
      })
  } else {
    // No target job provided: candidate level general evaluation
    relevantProjects = projects.map((p) => ({ ...p, isRelevant: true, relevanceScore: 0 }))
    relevantCertificates = certificates.map((c) => ({ ...c, isRelevant: true }))
    matchedSkills = candidateSkills
    missingSkills = []
  }

  // 9. Consolidated Final AI Score (ONE SOURCE OF TRUTH)
  let finalAIScore = 0
  if (targetJob) {
    // Weighted formula when evaluated against a job:
    // Semantic Job Match: 35%, ATS: 20%, Coding: 15%, Projects: 15%, Academic: 10%, Certificates: 5%
    finalAIScore = clamp(
      (semanticMatch * 0.35) +
      (atsScore * 0.20) +
      (codingScore * 0.15) +
      (projectScore * 0.15) +
      (academicScore * 0.10) +
      (certificateScore * 0.05)
    )
  } else {
    // General Candidate Employability Composite when no specific job is selected:
    // ATS: 25%, Projects: 25%, Coding: 20%, Academic: 15%, Certificates: 15%
    finalAIScore = clamp(
      (atsScore * 0.25) +
      (projectScore * 0.25) +
      (codingScore * 0.20) +
      (academicScore * 0.15) +
      (certificateScore * 0.15)
    )
  }

  // 10. AI-Assisted Recommendation Tier
  const recommendation = getRecommendationTier(finalAIScore)

  // 11. Deterministic Strengths & Gaps
  const strengths = []
  if (matchedSkills.length >= 3) {
    strengths.push(`Core skill alignment with ${matchedSkills.slice(0, 4).join(', ')}`)
  }
  if (codingScore >= 60 || totalProblemsSolved >= 50) {
    strengths.push(`Strong coding activity (${totalProblemsSolved}+ problems solved across platforms)`)
  }
  if (projects.length >= 2) {
    const withGithub = projects.filter((p) => p.githubUrl).length
    strengths.push(`Active portfolio with ${projects.length} projects (${withGithub} with source code)`)
  }
  if (academic && academic.cgpa >= 8.0) {
    strengths.push(`High academic performance (${academic.cgpa} CGPA in ${academic.branch || 'Engineering'})`)
  }
  if (atsScore >= 75) {
    strengths.push(`High ATS resume compatibility score (${atsScore}%)`)
  }
  if (certificates.length >= 2) {
    strengths.push(`${certificates.length} verifiable certifications on record`)
  }
  if (strengths.length === 0) {
    strengths.push('Candidate profile is active and has foundational data on record')
  }

  const gaps = []
  if (missingSkills.length > 0) {
    gaps.push(`Missing key target skills: ${missingSkills.slice(0, 4).join(', ')}`)
  }
  if (!codingProfile || totalProblemsSolved === 0) {
    gaps.push('No competitive coding profiles linked (LeetCode / GitHub / HackerRank)')
  }
  if (!projects || projects.length === 0) {
    gaps.push('No independent project portfolio items submitted')
  }
  if (!resumes || resumes.length === 0) {
    gaps.push('No resume file uploaded yet')
  }
  if (academic && academic.backlogs > 0) {
    gaps.push(`Recorded backlogs: ${academic.backlogs}`)
  }

  // 12. Determine Application Status for this context
  const applicationStatus = currentJobApplication?.status || (applications.length > 0 ? applications[0].status : 'Not Applied')

  // 13. Assemble Unified Response Structure
  return {
    candidate: {
      id: String(user._id),
      name: user.name || 'Candidate',
      email: user.email || '',
      role: user.role,
      joinedAt: user.createdAt
    },
    targetJob: targetJob ? {
      id: String(targetJob._id),
      title: targetJob.title,
      company: targetJob.company,
      location: targetJob.location,
      jobType: targetJob.jobType,
      technologies: targetJob.technologies || []
    } : null,
    applicationStatus,
    currentApplication: currentJobApplication ? {
      id: String(currentJobApplication._id),
      status: currentJobApplication.status,
      appliedAt: currentJobApplication.createdAt,
      matchScore: currentJobApplication.matchScore || jobMatchScore,
      atsScore: currentJobApplication.atsScore || atsScore,
      recruiterNotes: currentJobApplication.recruiterNotes || '',
      timeline: currentJobApplication.timeline || []
    } : null,
    scores: {
      finalAIScore,
      ats: atsScore,
      semanticMatch: targetJob ? semanticMatch : atsScore,
      academic: academicScore,
      coding: codingScore,
      projects: projectScore,
      certificates: certificateScore
    },
    recommendation,
    recommendationLabel: 'AI-Assisted Recommendation',
    jobMatchScore,
    skills: {
      all: candidateSkills,
      matched: matchedSkills,
      missing: missingSkills
    },
    strengths,
    gaps,
    evidence: {
      totalProjects: projects.length,
      relevantProjectsCount: relevantProjects.filter((p) => p.isRelevant).length,
      totalCertificates: certificates.length,
      relevantCertificatesCount: relevantCertificates.filter((c) => c.isRelevant).length,
      problemsSolved: totalProblemsSolved,
      githubContributions,
      cgpa: academic?.cgpa || null,
      hasResume: Boolean(latestResume)
    },
    resume: latestResume ? {
      id: String(latestResume._id),
      fileName: latestResume.fileName,
      atsScore: latestResume.atsScore || 0,
      extractedSkills: latestResume.extractedSkills || [],
      uploadedAt: latestResume.uploadedAt,
      allResumesCount: resumes.length
    } : null,
    resumeHistory: resumes.map((r, idx) => ({
      id: String(r._id),
      version: resumes.length - idx,
      fileName: r.fileName,
      atsScore: r.atsScore || 0,
      uploadedAt: r.uploadedAt
    })),
    academic: academic ? {
      cgpa: academic.cgpa,
      branch: academic.branch,
      college: academic.college,
      university: academic.university || '',
      graduationYear: academic.graduationYear,
      currentSemester: academic.currentSemester,
      backlogs: academic.backlogs || 0,
      academicAchievements: academic.academicAchievements || [],
      academicScore
    } : null,
    academicSummary,
    coding: codingProfile ? {
      githubUsername: codingProfile.githubUsername || '',
      leetcodeUsername: codingProfile.leetcodeUsername || '',
      hackerrankUsername: codingProfile.hackerrankUsername || '',
      problemsSolved: totalProblemsSolved,
      githubContributions,
      githubData: codingProfile.githubData || null,
      leetcodeData: codingProfile.leetcodeData || null,
      hackerrankData: codingProfile.hackerrankData || null,
      codingScore,
      lastSynced: codingProfile.lastSynced
    } : null,
    projects: relevantProjects.map((p) => ({
      id: String(p._id),
      title: p.title,
      description: p.description || '',
      technologies: p.technologies || [],
      githubUrl: p.githubUrl || '',
      liveDemoUrl: p.liveDemoUrl || '',
      category: p.category || 'Web Development',
      role: p.role || 'Developer',
      status: p.status || 'completed',
      projectScore: p.projectScore?.portfolioScore || 0,
      isRelevant: Boolean(p.isRelevant),
      createdAt: p.createdAt
    })),
    certificates: relevantCertificates.map((c) => ({
      id: String(c._id),
      name: c.name,
      issuer: c.issuer || '',
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      credentialId: c.credentialId || '',
      credentialUrl: c.credentialUrl || '',
      skills: c.skills || [],
      category: c.category || 'Other',
      verificationStatus: c.verificationStatus || 'unverified',
      isRelevant: Boolean(c.isRelevant)
    })),
    applications: applications.map((app) => ({
      id: String(app._id),
      jobId: app.jobId?._id || app.jobId,
      jobTitle: app.jobTitle || app.jobId?.title || 'Unknown Position',
      company: app.jobId?.company || 'IntelliHire Partner',
      status: app.status,
      atsScore: app.atsScore || 0,
      matchScore: app.matchScore || 0,
      appliedAt: app.createdAt
    }))
  }
}

module.exports = {
  getCandidateIntelligence,
  getRecommendationTier
}
