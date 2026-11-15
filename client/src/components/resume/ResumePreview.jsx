/**
 * ResumePreview Component
 *
 * Renders a live preview of the resume in a styled A4-like container.
 * Matches the PDF output format for WYSIWYG accuracy.
 */

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function DateRange({ start, end, isCurrent }) {
  const startStr = formatDate(start)
  const endStr = isCurrent ? 'Present' : formatDate(end)
  if (!startStr && !endStr) return null
  return (
    <span className="text-xs text-slate-500">
      {startStr}{startStr && endStr ? ' - ' : ''}{endStr}
    </span>
  )
}

export default function ResumePreview({ data }) {
  if (!data) return null

  const pi = data.personalInfo || {}

  return (
    <div className="bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden" style={{ minHeight: '1122px' }}>
      <div className="p-8 md:p-10">
        {/* Header */}
        {pi.fullName && (
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{pi.fullName}</h1>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mb-1">
          {pi.email && <span>{pi.email}</span>}
          {pi.phone && <span>{pi.phone}</span>}
          {pi.location && <span>{pi.location}</span>}
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-blue-600 mb-4">
          {pi.linkedIn && <span>{pi.linkedIn}</span>}
          {pi.github && <span>{pi.github}</span>}
          {pi.portfolio && <span>{pi.portfolio}</span>}
        </div>

        {/* Summary */}
        {data.summary && (
          <Section title="PROFESSIONAL SUMMARY">
            <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
          </Section>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <Section title="SKILLS">
            <p className="text-sm text-slate-700">{data.skills.join(' | ')}</p>
          </Section>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <Section title="EXPERIENCE">
            {data.experience.map((exp, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{exp.role}</span>
                    {exp.company && <span className="text-sm text-slate-600"> at {exp.company}</span>}
                  </div>
                  <DateRange start={exp.startDate} end={exp.endDate} isCurrent={exp.isCurrent} />
                </div>
                {exp.description && (
                  <p className="text-sm text-slate-700 mt-1 ml-4">{exp.description}</p>
                )}
                {exp.technologies && exp.technologies.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 ml-4">
                    Technologies: {exp.technologies.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <Section title="PROJECTS">
            {data.projects.map((proj, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{proj.title}</span>
                  {proj.role && <span className="text-xs text-slate-500">| {proj.role}</span>}
                </div>
                {proj.description && (
                  <p className="text-sm text-slate-700 mt-1 ml-4">{proj.description}</p>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 ml-4">
                    Technologies: {proj.technologies.join(', ')}
                  </p>
                )}
                {(proj.githubUrl || proj.liveDemoUrl) && (
                  <div className="flex gap-3 mt-1 ml-4 text-xs text-blue-600">
                    {proj.githubUrl && <span>GitHub: {proj.githubUrl}</span>}
                    {proj.liveDemoUrl && <span>Live: {proj.liveDemoUrl}</span>}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <Section title="EDUCATION">
            {data.education.map((edu, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{edu.degree}</span>
                    {edu.branch && edu.degree !== edu.branch && (
                      <span className="text-sm text-slate-600"> - {edu.branch}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  {edu.institution && <span>{edu.institution}</span>}
                  {edu.graduationYear && <span>Class of {edu.graduationYear}</span>}
                  {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Certificates */}
        {data.certificates && data.certificates.length > 0 && (
          <Section title="CERTIFICATIONS">
            {data.certificates.map((cert, i) => (
              <div key={i} className="mb-1 last:mb-0">
                <span className="text-sm font-bold text-slate-900">{cert.name}</span>
                {cert.issuer && <span className="text-sm text-slate-600"> - {cert.issuer}</span>}
              </div>
            ))}
          </Section>
        )}

        {/* Coding Profiles */}
        {data.codingProfiles && data.codingProfiles.problemsSolved > 0 && (
          <Section title="CODING PROFILE">
            <p className="text-sm text-slate-700">
              {data.codingProfiles.github && <span>GitHub: {data.codingProfiles.github}</span>}
              {data.codingProfiles.github && data.codingProfiles.leetcode && <span> | </span>}
              {data.codingProfiles.leetcode && <span>LeetCode: {data.codingProfiles.leetcode}</span>}
              {data.codingProfiles.leetcode && data.codingProfiles.hackerrank && <span> | </span>}
              {data.codingProfiles.hackerrank && <span>HackerRank: {data.codingProfiles.hackerrank}</span>}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Problems Solved: {data.codingProfiles.problemsSolved}
            </p>
          </Section>
        )}

        {/* Achievements */}
        {data.achievements && data.achievements.length > 0 && (
          <Section title="ACHIEVEMENTS">
            {data.achievements.map((a, i) => (
              <p key={i} className="text-sm text-slate-700 ml-4 mb-1">• {a}</p>
            ))}
          </Section>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <Section title="LANGUAGES">
            <p className="text-sm text-slate-700">
              {data.languages.map((l) => `${l.name} (${l.proficiency})`).join(' | ')}
            </p>
          </Section>
        )}

        {/* Links */}
        {data.links && data.links.length > 0 && (
          <Section title="LINKS">
            {data.links.map((link, i) => (
              <p key={i} className="text-sm text-slate-700 ml-4 mb-1">
                {link.platform}: {link.url}
              </p>
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-blue-600 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </div>
  )
}
