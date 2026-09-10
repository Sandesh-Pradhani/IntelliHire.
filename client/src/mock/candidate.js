/**
 * Mock candidate data — Centralized mock data layer.
 * Replace with actual API calls when backend is ready.
 */
export const MOCK_CANDIDATE_RESUMES = [
  {
    _id: 'mock-resume-1',
    fileName: 'Frontend_Developer_Resume.pdf',
    filename: 'Frontend_Developer_Resume.pdf',
    atsScore: 82,
    extractedSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Git', 'REST APIs', 'Node.js'],
    createdAt: new Date().toISOString(),
  },
]

export const MOCK_CANDIDATE_APPLICATIONS = [
  {
    _id: 'mock-app-1',
    jobTitle: 'Senior Frontend Developer',
    company: 'Tech Corp',
    status: 'shortlisted',
    matchScore: 85,
    appliedDate: new Date().toISOString(),
  },
  {
    _id: 'mock-app-2',
    jobTitle: 'Full Stack Engineer',
    company: 'Startup Inc',
    status: 'pending',
    matchScore: 72,
    appliedDate: new Date().toISOString(),
  },
]

export const MOCK_CAREER_INSIGHTS = {
  recommended_roles: [
    { role: 'Senior Frontend Engineer', match_percentage: 92, matching_skills: ['React', 'TypeScript', 'CSS'] },
    { role: 'Full Stack Developer', match_percentage: 85, matching_skills: ['Node.js', 'React', 'JavaScript'] },
    { role: 'UI/UX Engineer', match_percentage: 78, matching_skills: ['CSS', 'HTML', 'React'] },
  ],
  skills_to_develop: [
    { skill: 'GraphQL', reason: 'Modern APIs increasingly rely on GraphQL' },
    { skill: 'Docker', reason: 'Containerization is a key DevOps skill' },
    { skill: 'AWS/Azure', reason: 'Cloud deployment is essential for senior roles' },
  ],
  career_progression: [
    'Entry-level: Junior Frontend Developer (0-2 years)',
    'Mid-level: Frontend Developer (2-4 years)',
    'Senior: Senior Frontend Engineer (4-6 years)',
    'Lead: Tech Lead / Architect (6+ years)',
  ],
}

export const MOCK_JOB_MATCH_RESULT = {
  atsScore: 82,
  finalScore: 78,
  similarity: { overall: 78, breakdown: { skills: 85, experience: 72, education: 76 } },
  matchedSkills: ['React', 'JavaScript', 'CSS', 'HTML', 'Git'],
  missingSkills: ['GraphQL', 'Docker', 'AWS'],
  suggestions: [
    'Add experience with GraphQL to improve match score',
    'Include cloud deployment experience (AWS/GCP)',
    'Highlight system design skills for senior roles',
  ],
}