/**
 * Project Controller
 *
 * Problem solved: Centralizes all project CRUD operations and AI scoring
 * orchestration, keeping routes thin and testable.
 *
 * Reason: Controller pattern separates HTTP concerns from business logic.
 * Each handler validates input, delegates to service layer, and formats response.
 *
 * Alternative: Inline route handlers — rejected because they mix validation,
 * business logic, and response formatting in one place.
 */

const Project = require('../models/Project')
const { recordCandidateMemory } = require('../services/candidateMemoryService')

/**
 * Get all projects for the authenticated candidate.
 * Supports pagination, search, technology filters, and category filters.
 */
async function getProjects(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            technology = '',
            category = '',
            sort = '-createdAt'
        } = req.query

        const query = { userId: req.user.id }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        if (technology) {
            const techs = technology.split(',').map(t => t.trim())
            query.technologies = { $in: techs }
        }

        if (category) {
            query.category = category
        }

        const pageNum = Math.max(1, parseInt(page))
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
        const skip = (pageNum - 1) * limitNum

        const [projects, total] = await Promise.all([
            Project.find(query).sort(sort).skip(skip).limit(limitNum),
            Project.countDocuments(query)
        ])

        res.json({
            projects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        })
    } catch (error) {
        console.error('[GetProjects]:', error)
        res.status(500).json({ message: 'Failed to fetch projects' })
    }
}

/**
 * Get a single project by ID.
 */
async function getProject(req, res) {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id })
        if (!project) return res.status(404).json({ message: 'Project not found' })
        res.json(project)
    } catch (error) {
        console.error('[GetProject]:', error)
        res.status(500).json({ message: 'Failed to fetch project' })
    }
}

/**
 * Create a new project.
 */
async function createProject(req, res) {
    try {
        const projectData = { ...req.body, userId: req.user.id }
        const project = await Project.create(projectData)

        await recordCandidateMemory({
            candidateId: req.user.id,
            event: 'project_added',
            entityType: 'project',
            entityId: project._id,
            summary: `Added project: ${project.title}`,
            metadata: { technologies: project.technologies || [], category: project.category },
            dedupeKey: `project_added:${project._id}`
        })

        res.status(201).json(project)
    } catch (error) {
        console.error('[CreateProject]:', error)
        res.status(500).json({ message: 'Failed to create project' })
    }
}

/**
 * Update an existing project.
 */
async function updateProject(req, res) {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        )
        if (!project) return res.status(404).json({ message: 'Project not found' })
        res.json(project)
    } catch (error) {
        console.error('[UpdateProject]:', error)
        res.status(500).json({ message: 'Failed to update project' })
    }
}

/**
 * Delete a project.
 */
async function deleteProject(req, res) {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
        if (!project) return res.status(404).json({ message: 'Project not found' })
        res.json({ message: 'Project deleted' })
    } catch (error) {
        console.error('[DeleteProject]:', error)
        res.status(500).json({ message: 'Failed to delete project' })
    }
}

/**
 * Update AI project score for a project.
 */
async function updateProjectScore(req, res) {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { projectScore: req.body },
            { new: true, runValidators: true }
        )
        if (!project) return res.status(404).json({ message: 'Project not found' })
        res.json(project)
    } catch (error) {
        console.error('[UpdateProjectScore]:', error)
        res.status(500).json({ message: 'Failed to update project score' })
    }
}

/**
 * Get portfolio statistics for the authenticated candidate.
 */
async function getPortfolioStats(req, res) {
    try {
        const projects = await Project.find({ userId: req.user.id })

        const totalProjects = projects.length
        const scores = projects.filter(p => p.projectScore?.portfolioScore > 0).map(p => p.projectScore.portfolioScore)
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

        const techSet = new Set()
        projects.forEach(p => (p.technologies || []).forEach(t => techSet.add(t)))

        const categories = {}
        projects.forEach(p => {
            categories[p.category] = (categories[p.category] || 0) + 1
        })

        const featured = projects.find(p => p.isFeatured) || projects.sort((a, b) => (b.projectScore?.portfolioScore || 0) - (a.projectScore?.portfolioScore || 0))[0]

        res.json({
            totalProjects,
            averageScore: avgScore,
            technologiesUsed: Array.from(techSet),
            featuredProject: featured || null,
            categories
        })
    } catch (error) {
        console.error('[GetPortfolioStats]:', error)
        res.status(500).json({ message: 'Failed to fetch portfolio stats' })
    }
}

/**
 * Recruiter: Get all candidate projects with filters.
 * No auth restriction — recruiters can view any candidate's projects.
 */
async function getRecruiterProjects(req, res) {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            technology = '',
            category = '',
            candidateId = '',
            minScore = 0,
            sort = '-projectScore.portfolioScore'
        } = req.query

        const query = {}

        if (candidateId) {
            query.userId = candidateId
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        }

        if (technology) {
            const techs = technology.split(',').map(t => t.trim())
            query.technologies = { $in: techs }
        }

        if (category) {
            query.category = category
        }

        if (minScore > 0) {
            query['projectScore.portfolioScore'] = { $gte: parseInt(minScore) }
        }

        const pageNum = Math.max(1, parseInt(page))
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
        const skip = (pageNum - 1) * limitNum

        const [projects, total] = await Promise.all([
            Project.find(query)
                .populate('userId', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limitNum),
            Project.countDocuments(query)
        ])

        res.json({
            projects,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        })
    } catch (error) {
        console.error('[GetRecruiterProjects]:', error)
        res.status(500).json({ message: 'Failed to fetch projects' })
    }
}

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    updateProjectScore,
    getPortfolioStats,
    getRecruiterProjects
}
