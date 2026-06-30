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
export const matchJob = async (job, resume, jobId = null, resumeId = null) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/recruiter/match`,
      { job, resume, jobId, resumeId },
      { headers: authHeaders() }
    )
    return response.data
  } catch (error) {
    console.error('matchJob error:', error)
    throw error
  }
}