const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000'

function isValidUrl(value) {
    if (!value) return true
    try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol)
    } catch {
        return false
    }
}

function normalizeSkills(skills) {
    if (Array.isArray(skills)) return skills.map(skill => String(skill).trim()).filter(Boolean)
    if (typeof skills === 'string') return skills.split(',').map(skill => skill.trim()).filter(Boolean)
    return []
}

function validateCertificateInput(input, { partial = false } = {}) {
    const errors = []
    const data = { ...input }

    if (!partial || data.name !== undefined || data.title !== undefined) {
        data.name = String(data.name || data.title || '').trim()
        if (!data.name) errors.push('Certificate name is required')
    }

    if (!partial || data.issuer !== undefined) {
        data.issuer = String(data.issuer || '').trim()
        if (!data.issuer) errors.push('Issuer is required')
    }

    if (!partial || data.issueDate !== undefined) {
        if (!data.issueDate) {
            errors.push('Issue date is required')
        } else {
            const issueDate = new Date(data.issueDate)
            if (Number.isNaN(issueDate.getTime())) errors.push('Issue date is invalid')
            else data.issueDate = issueDate
        }
    }

    if (data.expiryDate) {
        const expiryDate = new Date(data.expiryDate)
        if (Number.isNaN(expiryDate.getTime())) errors.push('Expiry date is invalid')
        else data.expiryDate = expiryDate
    }

    if (data.issueDate && data.expiryDate && data.expiryDate < data.issueDate) {
        errors.push('Expiry date must be on or after issue date')
    }

    if (data.credentialUrl && !isValidUrl(data.credentialUrl)) errors.push('Credential URL is invalid')
    if (data.evidenceUrl && !isValidUrl(data.evidenceUrl)) errors.push('Evidence URL is invalid')

    data.skills = normalizeSkills(data.skills)
    data.hasExpiry = Boolean(data.hasExpiry || data.expiryDate)

    if (data.expiryDate && data.expiryDate < new Date()) {
        data.verificationStatus = 'expired'
    } else if (!data.verificationStatus && (data.credentialId || data.credentialUrl || data.evidenceUrl)) {
        data.verificationStatus = 'pending'
    }

    return { data, errors }
}

async function scoreCertificate(certificate, jobRequiredSkills = []) {
    try {
        const response = await fetch(`${AI_ENGINE_URL}/certificate-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: certificate.name,
                issuer: certificate.issuer,
                category: certificate.category || 'Other',
                skills: certificate.skills || [],
                description: certificate.description || '',
                verificationStatus: certificate.verificationStatus || 'unverified',
                issueDate: certificate.issueDate,
                expiryDate: certificate.expiryDate,
                jobRequiredSkills
            })
        })

        if (!response.ok) throw new Error(`AI Engine responded with status ${response.status}`)
        const result = await response.json()
        return result.data || result
    } catch (error) {
        console.error('[CertificateService] AI scoring failed:', error.message)
        return calculateFallbackCertificateScore(certificate, jobRequiredSkills)
    }
}

function calculateFallbackCertificateScore(certificate, jobRequiredSkills = []) {
    const skills = (certificate.skills || []).map(skill => String(skill).toLowerCase())
    const required = (jobRequiredSkills || []).map(skill => String(skill).toLowerCase())
    const matches = required.length ? skills.filter(skill => required.includes(skill)).length : skills.length
    const relevanceScore = required.length ? Math.round((matches / required.length) * 100) : Math.min(skills.length * 20, 100)
    const verificationContribution = certificate.verificationStatus === 'verified' ? 100 : certificate.verificationStatus === 'pending' ? 60 : certificate.verificationStatus === 'expired' ? 20 : 35
    const ageMonths = certificate.issueDate ? Math.max(0, (Date.now() - new Date(certificate.issueDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 60
    const freshnessContribution = certificate.verificationStatus === 'expired' ? 10 : Math.max(30, Math.round(100 - ageMonths * 1.5))
    const issuerContribution = certificate.issuer && certificate.category ? 80 : 45
    const certificateScore = Math.round(relevanceScore * 0.50 + verificationContribution * 0.20 + freshnessContribution * 0.15 + issuerContribution * 0.15)

    return {
        certificateScore: Math.min(certificateScore, 100),
        relevanceScore,
        verificationContribution,
        skillContribution: relevanceScore,
        freshnessContribution,
        recommendation: certificateScore >= 75 ? 'Strong certificate contribution for the candidate profile.' : 'Certificate adds value; relevance improves when skills align with the job.',
        scoredAt: new Date().toISOString()
    }
}

function calculateUnifiedScoreWithCertificates(scores) {
    const {
        semanticScore = 0,
        atsScore = 0,
        academicScore = 0,
        codingScore = 0,
        projectScore = 0,
        certificateScore = 0
    } = scores

    const weights = {
        semantic: 0.28,
        ats: 0.18,
        academic: 0.14,
        coding: 0.18,
        projects: 0.14,
        certificates: 0.08
    }

    const finalScore = Math.round(
        semanticScore * weights.semantic +
        atsScore * weights.ats +
        academicScore * weights.academic +
        codingScore * weights.coding +
        projectScore * weights.projects +
        certificateScore * weights.certificates
    )

    return { finalScore: Math.min(finalScore, 100), weightsUsed: weights }
}

module.exports = {
    validateCertificateInput,
    scoreCertificate,
    calculateFallbackCertificateScore,
    calculateUnifiedScoreWithCertificates
}
