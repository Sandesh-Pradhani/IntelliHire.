const CANDIDATE_BASE = '/candidate'
const RECRUITER_BASE = '/recruiter'

const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  CANDIDATE: {
    ROOT: CANDIDATE_BASE,
    DASHBOARD: `${CANDIDATE_BASE}/dashboard`,
    CODING_PROFILE: `${CANDIDATE_BASE}/coding-profile`,
    DIGITAL_TWIN: `${CANDIDATE_BASE}/digital-twin`,
    COPILOT: `${CANDIDATE_BASE}/ai-coach`,
    LEARNING_ROADMAP: `${CANDIDATE_BASE}/learning-roadmap`,
    JOBS: `${CANDIDATE_BASE}/jobs`,
    APPLICATIONS: `${CANDIDATE_BASE}/applications`,
    PROFILE: `${CANDIDATE_BASE}/profile`,
    PORTFOLIO: `${CANDIDATE_BASE}/portfolio`,
    PORTFOLIO_RESUME: `${CANDIDATE_BASE}/portfolio/resume`,
    PORTFOLIO_ACADEMIC: `${CANDIDATE_BASE}/portfolio/academic`,
    PORTFOLIO_PROJECTS: `${CANDIDATE_BASE}/portfolio/projects`,
    PORTFOLIO_PROJECT_DETAILS: `${CANDIDATE_BASE}/portfolio/projects/:id`,
    PORTFOLIO_CERTIFICATES: `${CANDIDATE_BASE}/portfolio/certificates`,
    PORTFOLIO_CODING_PROFILES: `${CANDIDATE_BASE}/portfolio/coding-profiles`,
    SETTINGS: `${CANDIDATE_BASE}/settings`,
    RESUME_ANALYSIS: `${CANDIDATE_BASE}/resume-analysis`,
    CAREER_INSIGHTS: `${CANDIDATE_BASE}/career-insights`,
    JOB_MATCH: `${CANDIDATE_BASE}/job-match`,
    RESUME_BUILDER: `${CANDIDATE_BASE}/resume-builder`,
    NOTIFICATIONS: `${CANDIDATE_BASE}/notifications`,
    FEEDBACK: `${CANDIDATE_BASE}/feedback`,
    ANALYTICS: `${CANDIDATE_BASE}/analytics`,
  },

  RECRUITER: {
    ROOT: RECRUITER_BASE,
    DASHBOARD: `${RECRUITER_BASE}/dashboard`,
    COPILOT: `${RECRUITER_BASE}/ai-copilot`,
    INTERVIEW_INTELLIGENCE: `${RECRUITER_BASE}/interview-intelligence`,
    COMPANY_INTELLIGENCE: `${RECRUITER_BASE}/company`,
    JOBS: `${RECRUITER_BASE}/jobs`,
    JOB_CREATE: `${RECRUITER_BASE}/jobs/create`,
    JOB_MANAGE: `${RECRUITER_BASE}/jobs/manage`,
    CANDIDATES: `${RECRUITER_BASE}/candidates`,
    CANDIDATE_INTELLIGENCE: `${RECRUITER_BASE}/candidates/:candidateId/intelligence`,
    APPLICATIONS: `${RECRUITER_BASE}/applications`,
    RANKINGS: `${RECRUITER_BASE}/rankings`,
    JOB_MATCH: `${RECRUITER_BASE}/job-match`,
    PORTFOLIO: `${RECRUITER_BASE}/portfolio`,
    SETTINGS: `${RECRUITER_BASE}/settings`,
    FEEDBACK: `${RECRUITER_BASE}/feedback`,
    NOTIFICATIONS: `${RECRUITER_BASE}/notifications`,
    ANALYTICS: `${RECRUITER_BASE}/analytics`,
  },
}

export function getDashboardRoute(role) {
  return role === 'recruiter'
    ? ROUTES.RECRUITER.DASHBOARD
    : ROUTES.CANDIDATE.DASHBOARD
}

export function getPortfolioRoute(role) {
  return role === 'recruiter'
    ? ROUTES.RECRUITER.PORTFOLIO
    : ROUTES.CANDIDATE.PORTFOLIO
}

export function getSettingsRoute(role) {
  return role === 'recruiter'
    ? ROUTES.RECRUITER.SETTINGS
    : ROUTES.CANDIDATE.SETTINGS
}

export default ROUTES
