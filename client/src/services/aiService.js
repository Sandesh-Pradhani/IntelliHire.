/**
 * AI Engine API Service
 *
 * Provides methods for calling the Phase 3 AI Engine endpoints
 * directly or via the Node.js backend proxy.
 *
 * All responses follow the standard envelope:
 * { success, data, message, execution_time, model_used }
 */

import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000'

/**
 * Get auth headers from localStorage token
 */
const authHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Analyze resume text - returns skills + ATS score + breakdown + suggestions
 */
export const analyzeResume = async (resumeText) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/analyze-resume`,
      { resumeText },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('analyzeResume error:', error)
    throw error
  }
}

/**
 * Get detailed ATS breakdown with category scores and suggestions
 */
export const getAtsBreakdown = async (resumeText) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/ats-breakdown`,
      { resumeText },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getAtsBreakdown error:', error)
    throw error
  }
}

/**
 * Get recruiter AI insights (fit assessment, strengths, weaknesses, interview focus)
 */
export const getRecruiterInsights = async (resumeText, jobDescription) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/insights/recruiter`,
      { resumeText, jobDescription },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getRecruiterInsights error:', error)
    throw error
  }
}

/**
 * Get career recommendations based on skills and experience
 */
export const getCareerRecommendations = async (skills, experienceYears = null, interests = []) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/insights/career-recommendation`,
      { skills, experience_years: experienceYears, interests },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getCareerRecommendations error:', error)
    throw error
  }
}

/**
 * Get interview questions based on job description and skills
 */
export const getInterviewQuestions = async (jobDescription, skills = [], difficulty = 'medium') => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/insights/interview-questions`,
      { jobDescription, skills, difficulty },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getInterviewQuestions error:', error)
    throw error
  }
}

/**
 * Upload resume and get full structured JSON extraction + ATS breakdown
 * Direct call to Node backend which proxies to AI Engine
 */
export const uploadResume = async (file) => {
  const formData = new FormData()
  formData.append('resume', file)

  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/upload-resume`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeaders(),
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('uploadResume error:', error)
    throw error
  }
}

/**
 * Get candidate rankings (from Node backend which calls AI Engine)
 */
export const getRankings = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/ai/rankings`,
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getRankings error:', error)
    throw error
  }
}

/**
 * Match job description against resume
 */
export const matchJob = async (job, resume, jobId = null, resumeId = null, role = 'recruiter') => {
  try {
    const endpoint = role === 'candidate'
      ? `${API_BASE}/api/ai/match`
      : `${API_BASE}/api/recruiter/match`

    const response = await axios.post(
      endpoint,
      { job, resume, jobId, resumeId },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('matchJob error:', error)
    throw error
  }
}

/**
 * Phase 4: Get enhanced candidate ranking with explanations
 */
export const getEnhancedRanking = async (jobDescription, candidates) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/recruiter/rank-candidates-enhanced`,
      { jobDescription, candidates },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getEnhancedRanking error:', error)
    throw error
  }
}

/**
 * Phase 4: Get recruiter candidate recommendations (best/backup/reject)
 */
export const getRecruiterRecommendations = async (jobDescription, candidates, thresholdBest = 70, thresholdBackup = 45) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/recruiter/recommendations`,
      { jobDescription, candidates, threshold_best: thresholdBest, threshold_backup: thresholdBackup },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getRecruiterRecommendations error:', error)
    throw error
  }
}

/**
 * Phase 4: Get recruiter dashboard analytics
 */
export const getDashboardAnalytics = async (candidates = [], jobs = [], resumes = []) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/recruiter/dashboard-analytics`,
      { candidates, jobs, resumes },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getDashboardAnalytics error:', error)
    throw error
  }
}

/**
 * Phase 4: Get resume improvement suggestions
 */
export const getResumeSuggestions = async (resumeText, jobDescription = null) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/resume/suggestions`,
      { resumeText, jobDescription },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getResumeSuggestions error:', error)
    throw error
  }
}

/**
 * Phase 4: Compare two resume versions
 */
export const compareResumeVersions = async (versionAText, versionBText, versionAName = 'Version A', versionBName = 'Version B') => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/resume/compare-versions`,
      { version_a_text: versionAText, version_b_text: versionBText, version_a_name: versionAName, version_b_name: versionBName },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('compareResumeVersions error:', error)
    throw error
  }
}

/**
 * Phase 4: Get personalized job recommendations for candidates
 */
export const getJobRecommendations = async (candidateSkills, experienceYears = null, interests = [], jobs = []) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/ai/candidate/job-recommendations`,
      { candidate_skills: candidateSkills, experience_years: experienceYears, interests, jobs },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('getJobRecommendations error:', error)
    throw error
  }
}