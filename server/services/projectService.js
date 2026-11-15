/**
 * Project Service
 *
 * Problem solved: Encapsulates project-related business logic and external
 * API calls (AI scoring) away from controllers.
 *
 * Reason: Service layer provides a clean interface for calling the FastAPI
 * AI engine and processing project data without coupling to HTTP concerns.
 *
 * Alternative: Direct FastAPI calls from controllers — rejected because
 * it makes testing harder and mixes concerns.
 */

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'

/**
 * Request AI scoring for a project from the FastAPI engine.
 *
 * @param {Object} project - The project document
 * @returns {Object} AI scoring result with technologyScore, complexityScore, etc.
 */
async function getProjectScore(project) {
    try {
        const response = await fetch(`${AI_ENGINE_URL}/project-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: project.title,
                description: project.description || '',
                githubUrl: project.githubUrl || '',
                technologies: project.technologies || [],
                category: project.category || 'Other',
                teamSize: project.teamSize || 1,
                role: project.role || ''
            })
        })

        if (!response.ok) {
            throw new Error(`AI Engine responded with status ${response.status}`)
        }

        const result = await response.json()
        return result.data || result
    } catch (error) {
        console.error('[ProjectService] AI scoring failed:', error.message)
        // Fallback: calculate a basic score locally
        return calculateFallbackScore(project)
    }
}

/**
 * Fallback scoring when AI engine is unavailable.
 * Provides a basic score based on simple heuristics.
 *
 * @param {Object} project - The project document
 * @returns {Object} Basic scoring result
 */
function calculateFallbackScore(project) {
    const techScore = Math.min((project.technologies || []).length * 15, 100)
    const descLength = (project.description || '').length
    const docScore = Math.min(Math.round(descLength / 10), 100)
    const hasGithub = project.githubUrl ? 20 : 0
    const hasLive = project.liveDemoUrl ? 10 : 0
    const complexityScore = Math.min(30 + (project.teamSize || 1) * 10 + hasGithub + hasLive, 100)

    const portfolioScore = Math.round(
        techScore * 0.30 +
        complexityScore * 0.30 +
        docScore * 0.20 +
        (hasGithub + hasLive + 50) * 0.20
    )

    let recommendation = ''
    if (portfolioScore >= 80) recommendation = 'Outstanding project with strong technical depth and documentation.'
    else if (portfolioScore >= 60) recommendation = 'Solid project. Consider adding more technologies and documentation.'
    else if (portfolioScore >= 40) recommendation = 'Good foundation. Improve description and add GitHub/live demo links.'
    else recommendation = 'Project needs more detail. Add technologies, description, and links.'

    return {
        technologyScore: techScore,
        complexityScore,
        documentationScore: docScore,
        portfolioScore: Math.min(portfolioScore, 100),
        recommendation,
        scoredAt: new Date().toISOString()
    }
}

/**
 * Calculate the unified candidate score with project integration.
 *
 * Weights:
 * - Semantic: 30%
 * - ATS: 20%
 * - Academic: 15%
 * - Coding: 20%
 * - Projects: 15%
 *
 * @param {Object} scores - All individual scores
 * @returns {Object} Final unified score with breakdown
 */
function calculateUnifiedScoreWithProjects(scores) {
    const { semanticScore = 0, atsScore = 0, academicScore = 0, codingScore = 0, projectScore = 0 } = scores

    const weights = {
        semantic: 0.30,
        ats: 0.20,
        academic: 0.15,
        coding: 0.20,
        projects: 0.15
    }

    const finalScore = Math.round(
        semanticScore * weights.semantic +
        atsScore * weights.ats +
        academicScore * weights.academic +
        codingScore * weights.coding +
        projectScore * weights.projects
    )

    let recommendation = ''
    if (finalScore >= 85) recommendation = 'Excellent overall candidate. Strong across all dimensions including project portfolio.'
    else if (finalScore >= 70) recommendation = 'Strong candidate with good project experience. Ready for most roles.'
    else if (finalScore >= 50) recommendation = 'Moderate candidate. Project portfolio could be strengthened.'
    else recommendation = 'Candidate needs development in multiple areas. Project portfolio is limited.'

    return {
        finalScore: Math.min(finalScore, 100),
        recommendation,
        breakdown: {
            semantic: { score: semanticScore, weight: weights.semantic },
            ats: { score: atsScore, weight: weights.ats },
            academic: { score: academicScore, weight: weights.academic },
            coding: { score: codingScore, weight: weights.coding },
            projects: { score: projectScore, weight: weights.projects }
        },
        weightsUsed: weights
    }
}

module.exports = {
    getProjectScore,
    calculateFallbackScore,
    calculateUnifiedScoreWithProjects
}
