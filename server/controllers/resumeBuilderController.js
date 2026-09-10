/**
 * Resume Builder Controller
 *
 * Handles resume builder operations:
 * - Load/create resume from profile
 * - Save resume data
 * - Version management
 * - AI operations (with local fallback when AI engine is down)
 * - PDF export
 */

const axios = require('axios')
const resumeBuilderService = require('../services/resumeBuilderService')

const AI_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'

/**
 * Helper: Call AI Engine with timeout and fallback
 */
async function callAi(endpoint, payload) {
  const response = await axios.post(`${AI_URL}${endpoint}`, payload, { timeout: 10000 })
  return response.data.data || response.data
}

async function aiAvailable() {
  try {
    await axios.get(`${AI_URL}/health`, { timeout: 3000 })
    return true
  } catch {
    return false
  }
}

// ── Local fallback: Generate summary when AI engine is down ──
function generateSummaryLocal(data) {
  const skills = data.skills || []
  const projects = data.projects || []
  const experience = data.experience || []
  const education = data.education || []
  const certificates = data.certificates || []
  const cp = data.codingProfiles || {}

  const domains = []
  const allTech = [
    ...skills,
    ...projects.flatMap(p => p.technologies || []),
    ...experience.flatMap(e => e.technologies || []),
  ].map(s => s.toLowerCase())

  if (allTech.some(t => ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css'].includes(t))) domains.push('web development')
  if (allTech.some(t => ['python', 'machine learning', 'tensorflow', 'pytorch', 'data'].includes(t))) domains.push('data science')
  if (allTech.some(t => ['java', 'spring', 'node', 'express', 'django', 'flask'].includes(t))) domains.push('backend development')
  if (allTech.some(t => ['aws', 'azure', 'gcp', 'docker', 'kubernetes'].includes(t))) domains.push('cloud engineering')
  if (domains.length === 0 && skills.length > 0) domains.push('software development')

  const domain = domains[0] || 'software development'
  const expCount = experience.length
  const eduText = education.length > 0 ? education[0].degree || education[0].branch || '' : ''
  const topSkills = skills.slice(0, 5)

  let summary = ''
  if (expCount > 0) {
    summary = `Results-oriented ${domain} professional with ${expCount} year${expCount > 1 ? 's' : ''} of experience`
  } else {
    summary = `Aspiring ${domain} professional with hands-on project experience`
  }
  if (eduText) summary += `, holding a ${eduText} degree`
  if (topSkills.length > 0) summary += `, proficient in ${topSkills.join(', ')}`
  summary += '.'
  if (projects.length > 0) {
    const titles = projects.slice(0, 2).map(p => p.title).filter(Boolean)
    if (titles.length > 0) summary += ` Notable projects include ${titles.join(' and ')}.`
  }
  if (certificates.length > 0) {
    summary += ` Certified with ${certificates.length} professional credential${certificates.length > 1 ? 's' : ''}.`
  }
  if (cp.problemsSolved > 0) {
    summary += ` Active coding profile with ${cp.problemsSolved} problems solved.`
  }

  return { summary, wordCount: summary.split(' ').length }
}

// ── Local fallback: ATS analysis when AI engine is down ──
function atsAnalyzeLocal(data) {
  const lines = []
  if (data.personalInfo?.fullName) lines.push(data.personalInfo.fullName)
  if (data.personalInfo?.email) lines.push(data.personalInfo.email)
  if (data.summary) { lines.push('PROFESSIONAL SUMMARY'); lines.push(data.summary) }
  if (data.skills?.length) { lines.push('SKILLS'); lines.push(data.skills.join(', ')) }
  if (data.education?.length) { lines.push('EDUCATION'); data.education.forEach(e => lines.push(e.degree + ' - ' + e.institution)) }
  if (data.experience?.length) { lines.push('EXPERIENCE'); data.experience.forEach(e => { lines.push(e.role + ' at ' + e.company); if (e.description) lines.push(e.description) }) }
  if (data.projects?.length) { lines.push('PROJECTS'); data.projects.forEach(p => { lines.push(p.title); if (p.description) lines.push(p.description) }) }
  if (data.certificates?.length) { lines.push('CERTIFICATIONS'); data.certificates.forEach(c => lines.push(c.name + ' - ' + c.issuer)) }
  const text = lines.join('\n').toLowerCase()
  const wordCount = lines.join(' ').split(/\s+/).length

  const sectionChecks = {
    personalInfo: !!(data.personalInfo?.email),
    summary: !!data.summary,
    skills: !!(data.skills?.length),
    education: !!(data.education?.length),
    experience: !!(data.experience?.length),
    projects: !!(data.projects?.length),
    certificates: !!(data.certificates?.length),
  }
  const filledCount = Object.values(sectionChecks).filter(Boolean).length
  const completeness = Math.round((filledCount / Object.keys(sectionChecks).length) * 100)

  const matched = (data.skills || []).filter(s => text.includes(s.toLowerCase()))
  const keywordCoverage = data.skills?.length ? Math.round((matched.length / data.skills.length) * 100) : 0

  const formatScore = Math.min(20, 10 + (wordCount >= 200 ? 5 : 0) + (wordCount <= 1000 ? 5 : 0))
  const sectionScore = Math.min(30, completeness * 0.3)
  const keywordScore = Math.min(25, keywordCoverage * 0.25)
  const expScore = sectionChecks.experience ? 15 : 0
  const eduScore = sectionChecks.education ? 10 : 0
  const atsScore = Math.min(100, Math.round(formatScore + sectionScore + keywordScore + expScore + eduScore))

  const recommendations = []
  if (!sectionChecks.summary) recommendations.push('Add a professional summary section')
  if (!sectionChecks.skills) recommendations.push('Include a dedicated skills section')
  if (!sectionChecks.experience) recommendations.push('Add work experience with job titles and descriptions')
  if (!sectionChecks.education) recommendations.push('Include education details')
  if (!sectionChecks.projects) recommendations.push('Add a projects section')
  if (!sectionChecks.certificates) recommendations.push('Consider adding professional certifications')
  if (keywordCoverage < 60) recommendations.push('Add more relevant skills to improve keyword coverage')
  if (wordCount < 200) recommendations.push('Resume is too short — add more details')

  return {
    atsScore,
    keywordCoverage,
    matchedKeywords: matched,
    missingKeywords: [],
    sectionCompleteness: sectionChecks,
    recommendations,
  }
}

// ── Local fallback: Optimize section ──
function optimizeSectionLocal(section, content) {
  if (!content || !content.trim()) return { original: content, optimized: content, suggestions: [] }
  const optimized = content.trim()
    .replace(/^responsible for /i, 'Developed ')
    .replace(/^worked on /i, 'Implemented ')
    .replace(/^made /i, 'Developed ')
    .replace(/^helped with /i, 'Contributed to ')

  return {
    original: content,
    optimized,
    suggestions: ['Improved action verb usage', 'Review optimized text for accuracy'],
  }
}

// ── Local fallback: Job match ──
function jobMatchLocal(data, jobDescription) {
  const resumeText = [
    (data.skills || []).join(' '),
    (data.summary || ''),
    ...(data.experience || []).map(e => e.description || ''),
    ...(data.projects || []).map(p => p.description || ''),
  ].join(' ').toLowerCase()

  const jobWords = jobDescription.toLowerCase().match(/\b[a-zA-Z]{4,}\b/g) || []
  const stopWords = new Set(['about', 'would', 'could', 'other', 'which', 'their', 'there', 'these', 'those', 'where', 'after', 'using', 'being', 'should', 'have', 'been', 'from', 'with', 'that', 'this', 'will', 'each', 'make', 'like', 'than', 'them', 'then', 'what', 'when', 'your', 'they', 'also', 'more', 'some', 'time', 'very', 'just', 'over', 'such', 'take', 'into', 'only', 'work', 'well'])
  const techKeywords = [...new Set(jobWords.filter(w => !stopWords.has(w) && w.length > 3))]

  const matched = techKeywords.filter(w => resumeText.includes(w))
  const missing = techKeywords.filter(w => !resumeText.includes(w)).slice(0, 15)
  const matchScore = techKeywords.length ? Math.round((matched.length / techKeywords.length) * 100 * 10) / 10 : 0

  const recommendations = []
  if (matchScore < 50) recommendations.push('Low keyword match — review job requirements')
  if (missing.length > 0) recommendations.push('Consider adding if relevant: ' + missing.slice(0, 5).join(', '))
  if (!data.summary) recommendations.push('Add a professional summary tailored to this role')

  return { matchScore, matchedKeywords: matched, missingKeywords: missing, recommendations }
}

/**
 * GET /api/resume-builder
 */
async function getResumeBuilder(req, res) {
  try {
    const data = await resumeBuilderService.getOrCreate(req.user.id)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[ResumeBuilder Load]:', error)
    res.status(500).json({ message: 'Failed to load resume builder data' })
  }
}

/**
 * POST /api/resume-builder/init
 */
async function initFromProfile(req, res) {
  try {
    const profile = await resumeBuilderService.aggregateProfile(req.user.id)
    const data = await resumeBuilderService.save(req.user.id, profile)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[ResumeBuilder Init]:', error)
    res.status(500).json({ message: 'Failed to initialize from profile' })
  }
}

/**
 * PUT /api/resume-builder
 */
async function saveResumeBuilder(req, res) {
  try {
    const data = await resumeBuilderService.save(req.user.id, req.body)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[ResumeBuilder Save]:', error)
    res.status(500).json({ message: 'Failed to save resume data' })
  }
}

/**
 * POST /api/resume-builder/generate-summary
 */
async function generateSummary(req, res) {
  try {
    let result
    if (await aiAvailable()) {
      result = await callAi('/resume-builder/generate-summary', req.body)
    } else {
      result = generateSummaryLocal(req.body.resumeData || {})
    }
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[ResumeBuilder Summary]:', error.message)
    const result = generateSummaryLocal(req.body.resumeData || {})
    res.json({ success: true, data: result })
  }
}

/**
 * POST /api/resume-builder/optimize
 */
async function optimizeSection(req, res) {
  try {
    let result
    if (await aiAvailable()) {
      result = await callAi('/resume-builder/optimize-section', req.body)
    } else {
      result = optimizeSectionLocal(req.body.section, req.body.content)
    }
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[ResumeBuilder Optimize]:', error.message)
    const result = optimizeSectionLocal(req.body.section, req.body.content)
    res.json({ success: true, data: result })
  }
}

/**
 * POST /api/resume-builder/ats-analyze
 */
async function atsAnalyze(req, res) {
  try {
    let result
    if (await aiAvailable()) {
      result = await callAi('/resume-builder/ats-analyze', req.body)
    } else {
      result = atsAnalyzeLocal(req.body.resumeData || {})
    }
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[ResumeBuilder ATS]:', error.message)
    const result = atsAnalyzeLocal(req.body.resumeData || {})
    res.json({ success: true, data: result })
  }
}

/**
 * POST /api/resume-builder/analyze-job
 */
async function analyzeJob(req, res) {
  try {
    let result
    if (await aiAvailable()) {
      result = await callAi('/resume-builder/job-match', req.body)
    } else {
      result = jobMatchLocal(req.body.resumeData || {}, req.body.jobDescription || '')
    }
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[ResumeBuilder JobMatch]:', error.message)
    const result = jobMatchLocal(req.body.resumeData || {}, req.body.jobDescription || '')
    res.json({ success: true, data: result })
  }
}

/**
 * POST /api/resume-builder/versions/save
 */
async function saveVersion(req, res) {
  try {
    const data = await resumeBuilderService.saveVersion(req.user.id, req.body.name)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[ResumeBuilder Version Save]:', error)
    res.status(500).json({ message: 'Failed to save version' })
  }
}

/**
 * GET /api/resume-builder/versions
 */
async function getVersions(req, res) {
  try {
    const doc = await resumeBuilderService.getOrCreate(req.user.id)
    const versions = (doc.versions || []).map((v) => ({
      id: v._id,
      versionNumber: v.versionNumber,
      name: v.name,
      savedAt: v.savedAt,
    }))
    res.json({ success: true, data: { versions, activeVersion: doc.activeVersion } })
  } catch (error) {
    console.error('[ResumeBuilder Versions]:', error)
    res.status(500).json({ message: 'Failed to fetch versions' })
  }
}

/**
 * POST /api/resume-builder/versions/:id/restore
 */
async function restoreVersion(req, res) {
  try {
    const data = await resumeBuilderService.restoreVersion(req.user.id, req.params.id)
    res.json({ success: true, data })
  } catch (error) {
    console.error('[ResumeBuilder Version Restore]:', error)
    res.status(500).json({ message: 'Failed to restore version' })
  }
}

/**
 * POST /api/resume-builder/export-pdf
 */
async function exportPdf(req, res) {
  try {
    const pdfService = require('../services/pdfGeneratorService')
    const buffer = await pdfService.generatePdf(req.body)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf')
    res.send(buffer)
  } catch (error) {
    console.error('[ResumeBuilder PDF Export]:', error)
    res.status(500).json({ message: 'Failed to generate PDF' })
  }
}

module.exports = {
  getResumeBuilder,
  initFromProfile,
  saveResumeBuilder,
  generateSummary,
  optimizeSection,
  atsAnalyze,
  analyzeJob,
  saveVersion,
  getVersions,
  restoreVersion,
  exportPdf,
}
