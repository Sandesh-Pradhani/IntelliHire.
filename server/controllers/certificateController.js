const Certificate = require('../models/Certificate')
const { recordCandidateMemory } = require('../services/candidateMemoryService')
const { validateCertificateInput, scoreCertificate } = require('../services/certificateService')

function evidenceFromFile(file) {
    if (!file) return {}
    return {
        evidenceUrl: `/uploads/${file.filename}`,
        evidenceFile: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path
        }
    }
}

async function createCertificate(req, res) {
    try {
        const { data, errors } = validateCertificateInput({ ...req.body, ...evidenceFromFile(req.file) })
        if (errors.length) return res.status(400).json({ message: errors.join(', ') })

        const duplicateQuery = {
            userId: req.user.id,
            name: data.name,
            issuer: data.issuer
        }
        if (data.credentialId) duplicateQuery.credentialId = data.credentialId
        const duplicate = await Certificate.findOne(duplicateQuery)
        if (duplicate) return res.status(409).json({ message: 'Certificate already exists' })

        const certificate = await Certificate.create({ ...data, userId: req.user.id })
        await recordCandidateMemory({
            candidateId: req.user.id,
            event: 'certificate_added',
            entityType: 'certificate',
            entityId: certificate._id,
            summary: `Added certificate: ${certificate.name}`,
            metadata: { issuer: certificate.issuer, skills: certificate.skills || [] },
            dedupeKey: `certificate_added:${certificate._id}`
        })
        res.status(201).json(certificate)
    } catch (error) {
        console.error('[Certificate Create]:', error)
        res.status(500).json({ message: 'Failed to create certificate' })
    }
}

async function getCertificates(req, res) {
    try {
        const certificates = await Certificate.find({ userId: req.user.id }).sort({ createdAt: -1 })
        res.json(certificates)
    } catch (error) {
        console.error('[Certificates Fetch]:', error)
        res.status(500).json({ message: 'Failed to fetch certificates' })
    }
}

async function getCertificate(req, res) {
    try {
        const certificate = await Certificate.findOne({ _id: req.params.id, userId: req.user.id })
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
        res.json(certificate)
    } catch (error) {
        console.error('[Certificate Fetch]:', error)
        res.status(500).json({ message: 'Failed to fetch certificate' })
    }
}

async function updateCertificate(req, res) {
    try {
        const { data, errors } = validateCertificateInput({ ...req.body, ...evidenceFromFile(req.file) }, { partial: true })
        if (errors.length) return res.status(400).json({ message: errors.join(', ') })

        const certificate = await Certificate.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            data,
            { new: true, runValidators: true }
        )
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
        res.json(certificate)
    } catch (error) {
        console.error('[Certificate Update]:', error)
        res.status(500).json({ message: 'Failed to update certificate' })
    }
}

async function deleteCertificate(req, res) {
    try {
        const certificate = await Certificate.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
        res.json({ message: 'Certificate deleted' })
    } catch (error) {
        console.error('[Certificate Delete]:', error)
        res.status(500).json({ message: 'Failed to delete certificate' })
    }
}

async function verifyCertificate(req, res) {
    try {
        const certificate = await Certificate.findOne({ _id: req.params.id, userId: req.user.id })
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' })

        if (certificate.expiryDate && certificate.expiryDate < new Date()) {
            certificate.verificationStatus = 'expired'
        } else if (certificate.evidenceUrl || certificate.credentialUrl || certificate.credentialId) {
            certificate.verificationStatus = req.body?.verified === true ? 'verified' : 'pending'
        } else {
            certificate.verificationStatus = 'unverified'
        }

        await certificate.save()
        res.json(certificate)
    } catch (error) {
        console.error('[Certificate Verify]:', error)
        res.status(500).json({ message: 'Failed to update certificate verification' })
    }
}

async function scoreCertificateHandler(req, res) {
    try {
        const certificate = await Certificate.findOne({ _id: req.params.id, userId: req.user.id })
        if (!certificate) return res.status(404).json({ message: 'Certificate not found' })

        const scoreResult = await scoreCertificate(certificate, req.body?.jobRequiredSkills || [])
        certificate.certificateScore = scoreResult
        await certificate.save()
        res.json(certificate)
    } catch (error) {
        console.error('[Certificate Score]:', error)
        res.status(500).json({ message: 'Failed to score certificate' })
    }
}

async function getCertificateStats(req, res) {
    try {
        const certificates = await Certificate.find({ userId: req.user.id })
        const scores = certificates.map(cert => cert.certificateScore?.certificateScore || 0).filter(Boolean)
        const now = new Date()
        const soon = new Date()
        soon.setDate(now.getDate() + 60)
        res.json({
            totalCertificates: certificates.length,
            verifiedCertificates: certificates.filter(cert => cert.verificationStatus === 'verified').length,
            expiringCertificates: certificates.filter(cert => cert.expiryDate && cert.expiryDate >= now && cert.expiryDate <= soon).length,
            averageCertificateScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0
        })
    } catch (error) {
        console.error('[Certificate Stats]:', error)
        res.status(500).json({ message: 'Failed to fetch certificate stats' })
    }
}

async function getCandidateCertificates(req, res) {
    try {
        const query = { userId: req.params.candidateId }
        if (req.query.issuer) query.issuer = { $regex: req.query.issuer, $options: 'i' }
        if (req.query.category) query.category = req.query.category
        if (req.query.verifiedOnly === 'true') query.verificationStatus = 'verified'
        if (req.query.skill) query.skills = { $in: [new RegExp(req.query.skill, 'i')] }
        if (Number(req.query.minScore) > 0) query['certificateScore.certificateScore'] = { $gte: Number(req.query.minScore) }
        const certificates = await Certificate.find(query).populate('userId', 'name email').sort({ createdAt: -1 })
        res.json(certificates)
    } catch (error) {
        console.error('[Recruiter Certificates Fetch]:', error)
        res.status(500).json({ message: 'Failed to fetch candidate certificates' })
    }
}

module.exports = {
    createCertificate,
    getCertificates,
    getCertificate,
    updateCertificate,
    deleteCertificate,
    verifyCertificate,
    scoreCertificateHandler,
    getCertificateStats,
    getCandidateCertificates
}
