/**
 * Scoring helpers shared by the Node API and its tests.
 *
 * WHY THIS FILE:
 * Several routes previously used `||` to persist/display score values. That
 * treats a legitimate score of 0 as "missing" and silently substitutes an ATS
 * score or a stale application score. The helpers below make the nullish
 * behavior explicit and testable without a database connection.
 */

const splitSkillValue = (value) => {
    if (Array.isArray(value)) return value
    if (value === undefined || value === null) return []
    return String(value).split(',')
}

/**
 * Trim, collapse whitespace and de-duplicate a skill list case-insensitively.
 * Order is preserved so the recruiter's intent is visible in the UI.
 */
function normalizeSkillList(value) {
    const seen = new Set()
    const normalized = []

    for (const item of splitSkillValue(value)) {
        const skill = String(item || '').trim().replace(/\s+/g, ' ')
        if (!skill) continue
        const key = skill.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        normalized.push(skill)
    }

    return normalized
}

/**
 * Keep essential skills inside the authoritative required list.
 *
 * `essentialSkills` is a subset of `requiredSkills`: a skill that is not
 * required cannot be missing from a denominator that does not contain it.
 * When no required list exists but essentials do, the essentials become the
 * required list so the job is still scoreable.
 */
function resolveEffectiveSkills(requiredSkills, essentialSkills) {
    let required = normalizeSkillList(requiredSkills)
    const essentials = normalizeSkillList(essentialSkills)

    if (required.length === 0 && essentials.length > 0) {
        required = essentials
    }

    const requiredKeys = new Set(required.map((skill) => skill.toLowerCase()))
    const filteredEssentials = essentials.filter((skill) => (
        requiredKeys.has(skill.toLowerCase())
    ))

    return {
        requiredSkills: required,
        essentialSkills: filteredEssentials,
    }
}

/**
 * Fail-closed validation for a job's configured skill lists on the live
 * scoring path.
 *
 * WHY THIS EXISTS:
 * When a persisted job has NO configured skills at all, the scoring engine
 * infers a denominator from the description text, which produced misleading
 * historical scores (see the Stage 10 audit). Jobs receiving a persisted
 * score must have explicit configured requirements. Essential skills may be
 * empty, but when both lists exist the essentials must be a subset of the
 * required list, because an essential skill outside the denominator cannot
 * be penalized.
 *
 * The documented `resolveEffectiveSkills` promotion (essentials become the
 * required list when no required list exists) is explicit caller/job
 * configuration, not silent inference, so it remains scoreable here.
 *
 * @param {string[]} requiredSkills Configured required skills.
 * @param {string[]} essentialSkills Configured essential skills.
 * @returns {{
 *   ok: boolean,
 *   code: string|'job_skill_config_missing'|'essential_skills_not_subset'|null,
 *   message: string,
 *   details: { missing: string[], outsideRequired: string[] }
 * }}
 */
function validateJobSkillConfig(requiredSkills, essentialSkills) {
    const required = normalizeSkillList(requiredSkills)
    const essentials = normalizeSkillList(essentialSkills)

    if (required.length === 0 && essentials.length === 0) {
        return {
            ok: false,
            code: 'job_skill_config_missing',
            message: 'This job has no required skills configured, so it cannot receive a Final Match Score. Configure the job\'s required skills (and optionally essential skills) and try again.',
            details: {
                missing: ['requiredSkills'],
                outsideRequired: [],
            },
        }
    }

    if (required.length === 0 && essentials.length > 0) {
        // resolveEffectiveSkills promotes the explicit essential list to the
        // required list: the configuration is explicit, so nothing is
        // silently inferred and the job is scoreable.
        return {
            ok: true,
            code: null,
            message: '',
            details: { missing: [], outsideRequired: [] },
        }
    }

    const requiredKeys = new Set(required.map((skill) => skill.toLowerCase()))
    const outsideRequired = essentials.filter(
        (skill) => !requiredKeys.has(skill.toLowerCase())
    )
    if (outsideRequired.length > 0) {
        return {
            ok: false,
            code: 'essential_skills_not_subset',
            message: 'This job\'s essential skills include skills that are not in its required-skill list. A skill that is not required cannot be an essential penalty; fix the job\'s skill configuration and try again.',
            details: {
                missing: [],
                outsideRequired,
            },
        }
    }

    return {
        ok: true,
        code: null,
        message: '',
        details: { missing: [], outsideRequired: [] },
    }
}

/**
 * Nullish score selection. 0 is a real score and must never be replaced by a
 * previous value or by an ATS fallback.
 */
function resolveScoreUpdate(incoming, existing, fallback = 0) {
    if (incoming !== undefined && incoming !== null) return incoming
    if (existing !== undefined && existing !== null) return existing
    return fallback
}

/**
 * The score shown in ranking surfaces: authoritative job-match score first,
 * ATS only when no match score exists at all.
 */
function resolveDisplayScore(matchScore, atsScore, fallback = 0) {
    return resolveScoreUpdate(matchScore, atsScore, fallback)
}

/**
 * Fields persisted on Application so a stored score can be audited later.
 */
function buildApplicationScoringFields(result) {
    const payload = result || {}
    const camelBreakdown = payload.scoreBreakdown || null
    const snakeBreakdown = payload.score_breakdown || null

    return {
        scoringVersion: payload.scoringVersion ?? null,
        baseScore: payload.baseScore ?? null,
        semanticScore: payload.semanticMatchScore ?? null,
        semanticScoreSource:
            camelBreakdown?.semanticScoreSource
            ?? snakeBreakdown?.semantic_score_source
            ?? null,
        missingMainSkills: Array.isArray(payload.missingMainSkills)
            ? payload.missingMainSkills
            : [],
        scoreBreakdown: camelBreakdown,
    }
}

module.exports = {
    normalizeSkillList,
    resolveEffectiveSkills,
    validateJobSkillConfig,
    resolveScoreUpdate,
    resolveDisplayScore,
    buildApplicationScoringFields,
}
