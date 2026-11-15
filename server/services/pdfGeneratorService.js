/**
 * PDF Generator Service
 *
 * Generates ATS-friendly PDF resumes using pdfmake.
 * Text-based output (no screenshots/images) for maximum ATS readability.
 */

async function generatePdf(resumeData) {
  const pdfMake = require('pdfmake/build/pdfmake')
  const pdfFonts = require('pdfmake/build/vfs_fonts')

  // pdfmake v0.2.x: fonts are exported directly, need to register them
  if (pdfMake.vfs === undefined) {
    if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs
    } else {
      // Fonts exported as top-level keys (newer pdfmake)
      pdfMake.vfs = pdfFonts
    }
  }

  const docDefinition = buildDocDefinition(resumeData)

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition)
      pdfDoc.getBuffer((buffer) => {
        resolve(Buffer.from(buffer))
      })
    } catch (error) {
      reject(new Error('PDF generation failed: ' + error.message))
    }
  })
}

function buildDocDefinition(data) {
  const content = []
  const pi = data.personalInfo || {}

  if (pi.fullName) {
    content.push({ text: pi.fullName, fontSize: 18, bold: true, margin: [0, 0, 0, 4] })
  }

  const contactParts = []
  if (pi.email) contactParts.push(pi.email)
  if (pi.phone) contactParts.push(pi.phone)
  if (pi.location) contactParts.push(pi.location)
  if (contactParts.length) {
    content.push({ text: contactParts.join(' | '), fontSize: 9, color: '#555555' })
  }

  const linkParts = []
  if (pi.linkedIn) linkParts.push(pi.linkedIn)
  if (pi.github) linkParts.push(pi.github)
  if (pi.portfolio) linkParts.push(pi.portfolio)
  if (linkParts.length) {
    content.push({ text: linkParts.join(' | '), fontSize: 9, color: '#555555' })
  }

  content.push({ text: '', margin: [0, 6, 0, 0] })

  if (data.summary) {
    addSection(content, 'PROFESSIONAL SUMMARY')
    content.push({ text: data.summary, fontSize: 10, margin: [0, 2, 0, 2] })
  }

  if (data.skills && data.skills.length) {
    addSection(content, 'SKILLS')
    content.push({ text: data.skills.join(' | '), fontSize: 10, margin: [0, 2, 0, 2] })
  }

  if (data.experience && data.experience.length) {
    addSection(content, 'EXPERIENCE')
    data.experience.forEach((exp) => {
      const titleParts = []
      if (exp.role) titleParts.push({ text: exp.role, bold: true })
      if (exp.company) titleParts.push({ text: ' at ' + exp.company })

      const dateRange = formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)
      content.push({
        columns: [
          { width: '*', stack: titleParts.length ? titleParts : [{ text: exp.role || 'Role', bold: true }] },
          { width: 'auto', text: dateRange, fontSize: 9, color: '#555555', alignment: 'right' },
        ],
        columnGap: 10,
      })

      if (exp.description) {
        content.push({ text: exp.description, fontSize: 10, margin: [10, 2, 0, 2] })
      }
      if (exp.technologies && exp.technologies.length) {
        content.push({ text: 'Technologies: ' + exp.technologies.join(', '), fontSize: 9, color: '#555555', margin: [10, 1, 0, 4] })
      }
    })
  }

  if (data.projects && data.projects.length) {
    addSection(content, 'PROJECTS')
    data.projects.forEach((proj) => {
      const titleParts = [{ text: proj.title || 'Project', bold: true }]
      if (proj.role) titleParts.push({ text: ' | ' + proj.role })
      content.push({ stack: titleParts, margin: [0, 2, 0, 1] })

      if (proj.description) {
        content.push({ text: proj.description, fontSize: 10, margin: [10, 1, 0, 1] })
      }
      if (proj.technologies && proj.technologies.length) {
        content.push({ text: 'Technologies: ' + proj.technologies.join(', '), fontSize: 9, color: '#555555', margin: [10, 1, 0, 1] })
      }
      const projectLinks = []
      if (proj.githubUrl) projectLinks.push('GitHub: ' + proj.githubUrl)
      if (proj.liveDemoUrl) projectLinks.push('Live: ' + proj.liveDemoUrl)
      if (projectLinks.length) {
        content.push({ text: projectLinks.join(' | '), fontSize: 9, color: '#555555', margin: [10, 1, 0, 4] })
      }
    })
  }

  if (data.education && data.education.length) {
    addSection(content, 'EDUCATION')
    data.education.forEach((edu) => {
      const parts = []
      if (edu.degree) parts.push({ text: edu.degree, bold: true })
      if (edu.branch && edu.degree !== edu.branch) parts.push({ text: ' - ' + edu.branch })
      content.push({ stack: parts, margin: [0, 2, 0, 1] })

      const details = []
      if (edu.institution) details.push(edu.institution)
      if (edu.graduationYear) details.push('Class of ' + edu.graduationYear)
      if (edu.cgpa) details.push('CGPA: ' + edu.cgpa)
      if (details.length) {
        content.push({ text: details.join(' | '), fontSize: 9, color: '#555555', margin: [0, 0, 0, 4] })
      }
    })
  }

  if (data.certificates && data.certificates.length) {
    addSection(content, 'CERTIFICATIONS')
    data.certificates.forEach((cert) => {
      const parts = [{ text: cert.name || 'Certification', bold: true }]
      if (cert.issuer) parts.push({ text: ' - ' + cert.issuer })
      content.push({ stack: parts, margin: [0, 1, 0, 1] })
    })
  }

  if (data.codingProfiles && data.codingProfiles.problemsSolved > 0) {
    addSection(content, 'CODING PROFILE')
    const cpLines = []
    if (data.codingProfiles.github) cpLines.push('GitHub: ' + data.codingProfiles.github)
    if (data.codingProfiles.leetcode) cpLines.push('LeetCode: ' + data.codingProfiles.leetcode)
    if (data.codingProfiles.hackerrank) cpLines.push('HackerRank: ' + data.codingProfiles.hackerrank)
    cpLines.push('Problems Solved: ' + data.codingProfiles.problemsSolved)
    content.push({ text: cpLines.join(' | '), fontSize: 10, margin: [0, 2, 0, 2] })
  }

  if (data.achievements && data.achievements.length) {
    addSection(content, 'ACHIEVEMENTS')
    data.achievements.forEach((a) => {
      content.push({ text: '\u2022 ' + a, fontSize: 10, margin: [10, 1, 0, 1] })
    })
  }

  if (data.languages && data.languages.length) {
    addSection(content, 'LANGUAGES')
    content.push({ text: data.languages.map((l) => l.name + ' (' + l.proficiency + ')').join(' | '), fontSize: 10, margin: [0, 2, 0, 2] })
  }

  if (data.links && data.links.length) {
    addSection(content, 'LINKS')
    data.links.forEach((link) => {
      content.push({ text: link.platform + ': ' + link.url, fontSize: 10, margin: [10, 1, 0, 1] })
    })
  }

  return {
    content: content,
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    defaultStyle: {
      font: 'Roboto',
    },
    footer: function(currentPage, pageCount) {
      return { text: currentPage + ' / ' + pageCount, fontSize: 8, color: '#888888', alignment: 'center', margin: [0, 10, 0, 0] }
    },
  }
}

function addSection(content, title) {
  content.push({ text: title, fontSize: 11, bold: true, color: '#2563eb', margin: [0, 12, 0, 4] })
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#2563eb' }],
    margin: [0, 0, 0, 4],
  })
}

function formatDateRange(start, end, isCurrent) {
  var fmt = function(d) {
    if (!d) return ''
    var date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  var startStr = fmt(start)
  var endStr = isCurrent ? 'Present' : fmt(end)
  if (startStr && endStr) return startStr + ' - ' + endStr
  if (startStr) return startStr
  return ''
}

module.exports = { generatePdf }
