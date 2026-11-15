/**
 * AI Service Layer v2.0
 *
 * All AI-related API calls go through this service.
 * Frontend never knows FastAPI URL directly.
 *
 * Endpoints:
 * - POST /api/ai/analyze-resume           - Resume intelligence pipeline
 * - POST /api/ai/ats-breakdown             - Weighted ATS scoring
 * - POST /api/ai/job-match-v2              - Semantic job matching
 * - POST /api/ai/skill-gap                - Skill gap analysis
 * - POST /api/ai/insights/career-recommendation  - Career insights
 * - POST /api/ai/recruiter/rank-candidates-enhanced  - Enhanced ranking
 * - POST /api/ai/recruiter/recommendations      - Recruiter recommendations
 * - POST /api/ai/recruiter/dashboard-analytics  - Dashboard analytics
 * - POST /api/ai/resume/suggestions             - Resume suggestions
 * - POST /api/ai/resume/compare-versions        - Version comparison
 * - POST /api/ai/candidate/job-recommendations  - Job recommendations
 * - GET  /api/ai/rankings                - Legacy rankings
 * - GET  /api/ai/history                 - Resume history
 */
import http from './http.service'

export const aiService = {
  // ── AI Module 1: Resume Intelligence ──
  async analyzeResume({ resumeText }) {
    const res = await http.post('/api/ai/analyze-resume', { resumeText })
    return res.data
  },

  // ── AI Module 2: Weighted ATS Scoring ──
  async getAtsBreakdown({ resumeText }) {
    const res = await http.post('/api/ai/ats-breakdown', { resumeText })
    return res.data
  },

  // ── AI Module 3: Semantic Job Matching ──
  async matchCandidateJob({ jobId, resumeId }) {
    const res = await http.post('/api/ai/match', { jobId, resumeId })
    return res.data
  },

  async semanticJobMatch({ resumeText, jobText }) {
    const res = await http.post('/api/ai/job-match-v2', { resume: resumeText, job: jobText })
    return res.data
  },

  // ── AI Module 4: Skill Gap Analysis ──
  async analyzeSkillGap({ candidateSkills, requiredSkills }) {
    const res = await http.post('/api/ai/skill-gap', {
      candidate_skills: candidateSkills,
      required_skills: requiredSkills,
    })
    return res.data
  },

  // ── AI Module 5: Career Insights ──
  async getCareerInsights({ skills, experience_years, interests }) {
    const res = await http.post('/api/ai/insights/career-recommendation', {
      skills: skills || [],
      experience_years: experience_years || null,
      interests: interests || [],
    })
    return res.data
  },

  // ── AI Module 6: Recruiter Candidate Ranking ──
  async getEnhancedRankings({ jobDescription, candidates }) {
    const res = await http.post('/api/ai/recruiter/rank-candidates-enhanced', {
      jobDescription: jobDescription || '',
      candidates: candidates || [],
    })
    return res.data
  },

  // ── AI Module 7: Recruiter AI Insights ──
  async getRecruiterInsights({ resumeText, jobDescription }) {
    const res = await http.post('/api/ai/insights/recruiter', { resumeText, jobDescription })
    return res.data
  },

  async getDashboardAnalytics({ candidates, jobs, resumes }) {
    const res = await http.post('/api/ai/recruiter/dashboard-analytics', {
      candidates: candidates || [],
      jobs: jobs || [],
      resumes: resumes || [],
    })
    return res.data
  },

  // ── AI Module 8: Resume Suggestions ──
  async getResumeSuggestions({ resumeText, jobDescription }) {
    const res = await http.post('/api/ai/resume/suggestions', {
      resumeText,
      jobDescription: jobDescription || null,
    })
    return res.data
  },

  // ── AI Module 9: Candidate Job Recommendations ──
  async getJobRecommendations({ candidate_skills, experience_years, interests, jobs }) {
    const res = await http.post('/api/ai/candidate/job-recommendations', {
      candidate_skills: candidate_skills || [],
      experience_years: experience_years || null,
      interests: interests || [],
      jobs: jobs || [],
    })
    return res.data
  },

  // ── AI Module 10: Recruiter Recommendations ──
  async getRecruiterRecommendations({ jobDescription, candidates }) {
    const res = await http.post('/api/ai/recruiter/recommendations', {
      jobDescription: jobDescription || '',
      candidates: candidates || [],
    })
    return res.data
  },

  // ── AI Module 11: Resume Version Comparison ──
  async compareResumeVersions({ version_a_text, version_b_text, version_a_name, version_b_name }) {
    const res = await http.post('/api/ai/resume/compare-versions', {
      version_a_text,
      version_b_text,
      version_a_name: version_a_name || 'Version A',
      version_b_name: version_b_name || 'Version B',
    })
    return res.data
  },

  // ── Legacy Endpoints ──
  async matchRecruiterCandidate({ jobId, candidateId }) {
    const res = await http.post('/api/recruiter/match', { jobId, candidateId })
    return res.data
  },

  async getInterviewQuestions({ jobDescription, skills, difficulty }) {
    const res = await http.post('/api/ai/insights/interview-questions', {
      jobDescription: jobDescription || '',
      skills: skills || [],
      difficulty: difficulty || 'medium',
    })
    return res.data
  },

  async getRankings() {
    const res = await http.get('/api/ai/rankings')
    return res.data
  },
}

export default aiService