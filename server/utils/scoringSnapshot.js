/**
 * Immutable scoring-snapshot builder (Stage 12).
 *
 * WHY THIS FILE:
 * A stored Final Score cannot be audited once the live AI response is gone:
 * nobody can prove which job skill configuration, which semantic model, or
 * which input text produced it. This builder captures a snapshot of the exact
 * inputs and score components at calculation time, written only alongside an
 * existing successful score write (Application.scoringSnapshot).
 *
 * HARD RULES (do not break):
 *  - Never store resume text, job-description text, file names, or candidate
 *    identifiers inside the snapshot. Only SHA-256 fingerprints of the exact
 *    scoring inputs are recorded.
 *  - Snapshots are created ONLY for successful, complete score calculations
 *    on configured jobs. Any missing component, any reconciliation failure,
 *    an invalid job configuration, or a failed engine call returns null — the
 *    score write proceeds (legacy behavior) but no snapshot is created.
 *  - Once created, a snapshot is immutable. Only an explicitly authorized
 *    rescore (recruiter re-match or the approved recompute script with its
 *    fresh engine result) replaces the snapshot atomically TOGETHER WITH its
 *    new score fields. Every other Application update must not touch it.
 *  - No backfill: historical applications are never given a snapshot here.
 *
 * All score components come from the engine response and are re-derived
 * against the authoritative backend formula (services/match_scoring.py,
 * scoringVersion 2.0.0) before the snapshot is accepted:
 *
 *     skillMatchScore    = round_half_up(100 * matched / required, 1)
 *     baseScore          = round_half_up(0.60 * skill + 0.40 * semantic, 0)
 *     penaltyRate        = min(0.40, 0.10 * missingEssentialCount)
 *     finalScore         = round_half_up(baseScore * (1 - penaltyRate), 0)
 */

const crypto = require('crypto')

const { normalizeSkillList } = require('./scoring')

const SNAPSHOT_VERSION = '1.0.0'

const SKILL_WEIGHT = 0.6
const SEMANTIC_WEIGHT = 0.4
const PENALTY_PER_MISSING_SKILL = 0.1
const PENALTY_CAP_RATE = 0.4

/**
 * Round half-up to an integer, matching the contract's ROUND_HALF_UP for the
 * positive values produced by scoring. Non-finite input returns null.
 */
function roundHalfUpInteger(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    return Math.floor(value + 0.5)
}

/**
 * SHA-256 fingerprint of an exact scoring input string.
 */
function computeTextFingerprint(text) {
    if (text === undefined || text === null) return null
    return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex')
}

/**
 * Fingerprint of the exact job skill configuration used at calculation time.
 * The arrays are normalized the same way the scoring helpers normalize them,
 * so re-normalizing a stored snapshot always reproduces the same fingerprint.
 */
function computeSkillConfigFingerprint(requiredSkills, essentialSkills) {
    return computeTextFingerprint(JSON.stringify({
        requiredSkills: normalizeSkillList(requiredSkills),
        essentialSkills: normalizeSkillList(essentialSkills),
    }))
}

/**
 * Re-derive the authoritative formula from the engine's own reported values.
 * Mirrors services/match_scoring.compute_match_score so a snapshot can only
 * be produced when every component genuinely reconciles with finalScore.
 *
 * @returns {{reconciles: boolean, checks: {string: boolean}}}
 */
function reconcileSnapshotComponents({
    skillMatchScore,
    semanticMatchScore,
    baseScore,
    finalScore,
    penaltyRate,
    penaltyPoints,
    missingEssentialCount,
}) {
    const finite = (value) => typeof value === 'number' && Number.isFinite(value)
    const checks = {}

    const expectedSkillBase = finite(skillMatchScore) && finite(semanticMatchScore)
        ? roundHalfUpInteger(SKILL_WEIGHT * skillMatchScore + SEMANTIC_WEIGHT * semanticMatchScore)
        : null
    checks.baseScoreMatches = expectedSkillBase !== null && baseScore === expectedSkillBase

    const expectedRate = Math.min(
        PENALTY_CAP_RATE,
        PENALTY_PER_MISSING_SKILL * (missingEssentialCount ?? 0)
    )
    checks.penaltyRateMatches = finite(penaltyRate)
        && Math.abs(penaltyRate - expectedRate) <= 1e-9

    const expectedPoints = finite(baseScore) && finite(penaltyRate)
        ? Math.round(baseScore * penaltyRate * 100) / 100
        : null
    checks.penaltyPointsMatch = expectedPoints !== null && finite(penaltyPoints)
        && Math.abs(penaltyPoints - expectedPoints) <= 0.06

    const expectedFinal = finite(baseScore) && finite(penaltyRate)
        ? roundHalfUpInteger(
            Math.max(0, Math.min(100, baseScore * (1 - penaltyRate)))
        )
        : null
    checks.finalScoreMatches = expectedFinal !== null && finalScore === expectedFinal

    return {
        checks,
        reconciles: Object.values(checks).every(Boolean),
    }
}

/**
 * Resolve the penalty block from the engine's own mainSkillPenalty payload,
 * tolerating both absent payloads (null returned, snapshot refused) and
 * partial ones.
 */
function resolvePenalty(scoring) {
    const penalty = scoring?.mainSkillPenalty
    if (!penalty || typeof penalty !== 'object') return null

    const per = { ...penalty }
    per.missing = Array.isArray(penalty.missing) ? [...penalty.missing] : []
    per.essentialSkills = Array.isArray(penalty.essentialSkills)
        ? [...penalty.essentialSkills]
        : []
    return {
        perSkillRate: penalty.perSkillRate ?? null,
        capRate: penalty.capRate ?? null,
        rate: penalty.rate ?? null,
        points: penalty.points ?? null,
        missingCount: penalty.missingCount ?? null,
        missing: per.missing,
        essentialSkills: per.essentialSkills,
        rule: penalty.rule ?? null,
    }
}

/**
 * Build an immutable scoring snapshot for one successful score calculation.
 *
 * Returns null — never a partial snapshot, never a guessed value — when:
 *   - there is no persisted jobId (ad-hoc text matching is not scored into a
 *     job configuration);
 *   - the engine result is missing any required component;
 *   - no required skills were resolved (an invalid/incomplete job
 *     configuration);
 *   - the components do not reconcile with the authoritative formula;
 *   - a semantic-model identifier simply is not available (the model block
 *     then records explicit nulls — a limitation, not a fabrication).
 *
 * @param {object} input
 * @param {string|object} input.jobId Persisted job the score belongs to.
 * @param {object} input.scoring The engine's match result payload.
 * @param {string[]} input.requiredSkills Effective required skills sent to the engine.
 * @param {string[]} input.essentialSkills Effective essential skills sent to the engine.
 * @param {string} input.resumeText Exact resume text scored.
 * @param {string} input.jobText Exact job text scored.
 * @param {object|null} [input.semanticModelInfo] Engine-reported model identity.
 * @param {string} [input.createdAt] Override for tests; defaults to now.
 * @returns {object|null}
 */
function buildScoringSnapshot({
    jobId,
    scoring,
    requiredSkills,
    essentialSkills,
    resumeText,
    jobText,
    semanticModelInfo,
    createdAt,
} = {}) {
    if (!jobId) return null
    if (!scoring || typeof scoring !== 'object') return null

    const breakdown = scoring.scoreBreakdown || scoring.score_breakdown || null
    const semanticScoreSource = breakdown
        ? breakdown.semanticScoreSource ?? breakdown.semantic_score_source ?? null
        : null

    const skillMatchScore = scoring.skillMatchScore
    const semanticScore = scoring.semanticMatchScore
    const baseScore = scoring.baseScore
    const finalScore = scoring.finalScore
    const scoringVersion = scoring.scoringVersion ?? null

    // The authoritative denominator/penalty lists are the engine's resolved
    // arrays; fall back to the caller-provided effective arrays only when the
    // engine did not echo them.
    const resolvedRequired = Array.isArray(scoring.requiredSkills)
        ? scoring.requiredSkills
        : normalizeSkillList(requiredSkills)
    const resolvedEssential = Array.isArray(scoring.essentialSkills)
        ? scoring.essentialSkills
        : normalizeSkillList(essentialSkills)

    const matchedSkills = Array.isArray(scoring.matchedSkills)
        ? [...scoring.matchedSkills]
        : []

    // Fail-closed on any incompleteness.
    if (typeof finalScore !== 'number' || !Number.isFinite(finalScore)) return null
    if (skillMatchScore === null || skillMatchScore === undefined) return null
    if (semanticScore === null || semanticScore === undefined) return null
    if (resolvedRequired.length === 0) return null
    if (semanticScoreSource === null || semanticScoreSource === undefined) {
        return null
    }

    const penalty = resolvePenalty(scoring)
    if (!penalty) return null
    if (penalty.rate === null || penalty.points === null
        || penalty.missingCount === null) {
        return null
    }

    // Refuse snapshots that do not reconcile with the authoritative formula.
    const reconciliation = reconcileSnapshotComponents({
        skillMatchScore,
        semanticMatchScore: semanticScore,
        baseScore,
        finalScore,
        penaltyRate: penalty.rate,
        penaltyPoints: penalty.points,
        missingEssentialCount: penalty.missingCount,
    })
    if (!reconciliation.reconciles) return null

    // Model identity: never invented. Without engine identity info the id
    // falls back to the breakdown's semanticModel string with explicit null
    // hash/calibration; with identity info both are stored verbatim.
    const model = semanticModelInfo && typeof semanticModelInfo === 'object'
        ? {
            semanticModelId: semanticModelInfo.modelId ?? null,
            semanticModelSHA256: semanticModelInfo.weightsSHA256 ?? null,
            calibration: semanticModelInfo.calibration ?? null,
        }
        : {
            semanticModelId: breakdown?.semanticModel ?? null,
            semanticModelSHA256: null,
            calibration: null,
        }

    return {
        snapshotVersion: SNAPSHOT_VERSION,
        scoringVersion,
        createdAt: createdAt || new Date().toISOString(),
        jobId: String(jobId),
        inputs: {
            resumeTextSHA256: computeTextFingerprint(resumeText),
            jobTextSHA256: computeTextFingerprint(jobText),
            skillConfigSHA256: computeSkillConfigFingerprint(
                resolvedRequired,
                resolvedEssential
            ),
        },
        jobSkillConfig: {
            requiredSkills: [...resolvedRequired],
            essentialSkills: [...resolvedEssential],
        },
        model,
        skillMatchScore,
        semanticScore,
        semanticScoreSource,
        baseScore,
        finalScore,
        penalty,
        matchedSkills,
    }
}

module.exports = {
    SNAPSHOT_VERSION,
    buildScoringSnapshot,
    computeSkillConfigFingerprint,
    computeTextFingerprint,
    reconcileSnapshotComponents,
    roundHalfUpInteger,
}
