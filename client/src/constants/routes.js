const CANDIDATE_BASE = '/candidate'
const RECRUITER_BASE = '/recruiter'

const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  CANDIDATE: {
    ROOT: CANDIDATE_BASE,
    DASHBOARD: `${CANDIDATE_BASE}/dashboard`,
    JOBS: `${CANDIDATE_BASE}/jobs`,
    APPLICATIONS: `${CANDIDATE_BASE}/applications`,
    PROFILE: `${CANDIDATE_BASE}/profile`,
    PORTFOLIO: `${CANDIDATE_BASE}/portfolio`,
    PORTFOLIO_RESUME: `${CANDIDATE_BASE}/portfolio/resume`,
    PORTFOLIO_ACADEMIC: `${CANDIDATE_BASE}/portfolio/academic`,
    PORTFOLIO_PROJECTS: `${CANDIDATE_BASE}/portfolio/projects`,
    PORTFOLIO_CERTIFICATES: `${CANDIDATE_BASE}/portfolio/certificates`,
    PORTFOLIO_CODING_PROFILES: `${CANDIDATE_BASE}/portfolio/coding-profiles`,
    SETTINGS: `${CANDIDATE_BASE}/settings`,
    RESUME_ANALYSIS: `${CANDIDATE_BASE}/resume-analysis`,
    CAREER_INSIGHTS: `${CANDIDATE_BASE}/career-insights`,
    JOB_MATCH: `${CANDIDATE_BASE}/job-match`,
    NOTIFICATIONS: `${CANDIDATE_BASE}/notifications`,
    ANALYTICS: `${CANDIDATE_BASE}/analytics`,
    SEARCH: `/search`,
  },

  RECRUITER: {
    ROOT: RECRUITER_BASE,
    DASHBOARD: `${RECRUITER_BASE}/dashboard`,
    JOBS: `${RECRUITER_BASE}/jobs`,
    JOB_CREATE: `${RECRUITER_BASE}/jobs/create`,
    JOB_MANAGE: `${RECRUITER_BASE}/jobs/manage`,
    CANDIDATES: `${RECRUITER_BASE}/candidates`,
    APPLICATIONS: `${RECRUITER_BASE}/applications`,
    RANKINGS: `${RECRUITER_BASE}/rankings`,
    JOB_MATCH: `${RECRUITER_BASE}/job-match`,
    PORTFOLIO: `${RECRUITER_BASE}/portfolio`,
    SETTINGS: `${RECRUITER_BASE}/settings`,
    FEEDBACK: `${RECRUITER_BASE}/feedback`,
    NOTIFICATIONS: `${RECRUITER_BASE}/notifications`,
    ANALYTICS: `${RECRUITER_BASE}/analytics`,
    SEARCH: `/search`,
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
