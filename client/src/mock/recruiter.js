/**
 * Mock recruiter data — Centralized mock data layer.
 */
export const MOCK_RECRUITER_JOBS = [
  {
    _id: 'mock-job-1',
    title: 'Senior Frontend Developer',
    description: 'We are looking for a Senior Frontend Developer with expertise in React, TypeScript, and modern CSS. The ideal candidate has 5+ years of experience building scalable web applications.',
    department: 'Engineering',
    location: 'Remote',
    status: 'active',
    createdAt: new Date().toISOString(),
    applicationsCount: 12,
  },
  {
    _id: 'mock-job-2',
    title: 'Full Stack Engineer',
    description: 'Join our team as a Full Stack Engineer. You will work with React, Node.js, and PostgreSQL to build end-to-end features.',
    department: 'Engineering',
    location: 'San Francisco, CA',
    status: 'active',
    createdAt: new Date().toISOString(),
    applicationsCount: 8,
  },
  {
    _id: 'mock-job-3',
    title: 'Product Designer',
    description: 'We need a Product Designer who can create beautiful, intuitive interfaces. Experience with Figma and design systems required.',
    department: 'Design',
    location: 'New York, NY',
    status: 'draft',
    createdAt: new Date().toISOString(),
    applicationsCount: 0,
  },
]

export const MOCK_RECRUITER_APPLICATIONS = [
  {
    _id: 'mock-app-r1',
    candidateName: 'Alice Johnson',
    jobTitle: 'Senior Frontend Developer',
    status: 'Shortlisted',
    atsScore: 88,
    matchScore: 85,
    matchedSkills: ['React', 'TypeScript', 'CSS', 'Git'],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mock-app-r2',
    candidateName: 'Bob Smith',
    jobTitle: 'Senior Frontend Developer',
    status: 'Interview',
    atsScore: 76,
    matchScore: 72,
    matchedSkills: ['React', 'JavaScript', 'CSS'],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mock-app-r3',
    candidateName: 'Carol Williams',
    jobTitle: 'Full Stack Engineer',
    status: 'Applied',
    atsScore: 81,
    matchScore: 79,
    matchedSkills: ['Node.js', 'React', 'PostgreSQL'],
    createdAt: new Date().toISOString(),
  },
]

export const MOCK_RECRUITER_CANDIDATES = [
  {
    _id: 'mock-cand-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    appliedJobs: ['Senior Frontend Developer'],
    atsScore: 88,
    matchScore: 85,
    skills: ['React', 'TypeScript', 'CSS', 'Git', 'Node.js'],
    experience: '5 years',
  },
  {
    _id: 'mock-cand-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    appliedJobs: ['Senior Frontend Developer'],
    atsScore: 76,
    matchScore: 72,
    skills: ['React', 'JavaScript', 'CSS', 'HTML'],
    experience: '3 years',
  },
  {
    _id: 'mock-cand-3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    appliedJobs: ['Full Stack Engineer'],
    atsScore: 81,
    matchScore: 79,
    skills: ['Node.js', 'React', 'PostgreSQL', 'TypeScript'],
    experience: '4 years',
  },
]

export const MOCK_RECRUITER_FEEDBACK = [
  { _id: 'mock-fb-1', rating: 5, message: 'Excellent platform! The AI matching is incredibly accurate.' },
  { _id: 'mock-fb-2', rating: 4, message: 'Great tool for screening candidates. Saves hours of manual work.' },
]

export const MOCK_RECRUITER_MATCH_RESULT = {
  candidate: { name: 'Alice Johnson', email: 'alice@example.com' },
  atsScore: 88,
  similarity: { overall: 85, breakdown: { skills: 90, experience: 82, education: 80 } },
  matchedSkills: ['React', 'TypeScript', 'CSS', 'Git', 'Node.js'],
  missingSkills: ['GraphQL', 'Docker'],
  recommendation: 'Strong candidate. Recommended for interview.',
  strengths: ['Deep React expertise', 'TypeScript proficiency', 'Strong CSS skills'],
  weaknesses: ['No GraphQL experience', 'Limited cloud knowledge'],
}