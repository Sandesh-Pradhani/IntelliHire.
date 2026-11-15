"""
Job matching router for IntelliHire AI Engine.

WHY THIS FILE:
Handles semantic matching between resumes and job descriptions.
Uses existing business logic from skill_extractor.py, tfidf_engine.py,
similarity_engine.py, skill_gap.py, and ranking_engine.py.
NO algorithms rewritten.

WHY THIS APPROACH:
APIRouter keeps matching endpoints isolated from resume analysis and ranking.
"""

import os
import time
import logging
from fastapi import APIRouter, HTTPException

from app.schemas.matching import (
    JobMatchRequest,
    JobMatchResponse,
    SkillExtractionRequest,
)
from app.utils.response import _execution_time, success_response

# Reuse existing business logic - unchanged from Flask era
from skill_extractor import canonicalize_skills, extract_skills
from ai.tfidf_engine import build_vectors
from ai.similarity_engine import calculate_similarity
from ai.skill_gap import skill_gap_analysis
from ai.ranking_engine import calculate_final_score

# New Phase 3 services
from services.skill_gap_service import analyze_skill_gap
from services.sbert_embeddings import (
    compute_semantic_match_with_reasons,
    get_finetuned_ab_path,
)
from services.ranking_service import calculate_unified_ranking
from services.match_scoring import (
    SCORING_VERSION,
    compute_match_score,
    resolve_essential_skills,
    resolve_required_skills,
)
from services.model_identity import resolve_semantic_model_info

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Job Matching"])


@router.post(
    "/job-match",
    summary="Match a resume/candidate against a job description",
)
async def job_match(request: JobMatchRequest):
    """
    Perform semantic matching between a resume and job description.

    Returns both TF-IDF similarity and SBERT semantic similarity (if available),
    enhanced skill gap analysis, and unified ranking score.
    """
    start = time.perf_counter()
    resume_text = request.resume
    job_text = request.job

    # ---- v2 scoring contract: authoritative inputs -----------------------
    # Candidate skills: an explicit array wins (authoritative caller intent);
    # otherwise they are extracted fresh from the resume text that was sent.
    explicit_candidate_skills = canonicalize_skills(
        list(request.candidate_skills or [])
    )
    candidate_skills = explicit_candidate_skills or canonicalize_skills(
        extract_skills(resume_text)
    )

    # Required skills: Job.requiredSkills when supplied, otherwise inference
    # from the job text with a warning.
    required_skills, required_warnings = resolve_required_skills(
        request.required_skills,
        job_text,
    )

    # Essential skills: explicit Job.essentialSkills, then all required skills,
    # then title skills, then none. No alphabetical guessing.
    essential_skills, essential_warnings = resolve_essential_skills(
        job_title=request.job_title,
        required_skills=required_skills,
        essential_skills=request.essential_skills,
    )

    # ---- Step 12 / 27B: SBERT semantic input -----------------------------
    # `resume_text` drives TF-IDF and (when no explicit array is supplied)
    # skill extraction. The optional richer prose is used ONLY for the
    # enriched semantic pass. New server callers put raw resume text in
    # `resume`, so the enriched text is normally identical and no second
    # inference is performed.
    semantic_resume_text = request.resume_semantic.strip()

    # Reuse existing TF-IDF vectorization - identical to Flask
    vectors = build_vectors(job_text, resume_text)

    # Reuse existing cosine similarity - identical to Flask
    similarity_score = calculate_similarity(vectors)

    # SBERT semantic similarity (if available) - UNCHANGED inputs, so the value
    # that feeds unified_ranking is bit-identical to pre-Step-12.
    semantic_match = compute_semantic_match_with_reasons(resume_text, job_text)

    # Additive second semantic pass over the richer parsed prose.
    semantic_match_enriched = None
    if semantic_resume_text and semantic_resume_text != resume_text:
        try:
            semantic_match_enriched = compute_semantic_match_with_reasons(
                semantic_resume_text, job_text)
        except Exception as e:  # noqa: BLE001 - additive only
            logger.warning("Enriched semantic match failed; omitted: %s", e)
            semantic_match_enriched = None

    # Unified ranking score (kept for existing consumers; it is NOT the
    # authoritative job-match score).
    ranking = calculate_unified_ranking(
        ats_score=min(len(candidate_skills) * 10, 100),
        semantic_similarity=semantic_match["similarity_score"],
    )

    # Semantic value for the existing 40% slot: enriched V2 -> base V2 ->
    # TF-IDF. This is the same selection rule as Step 27B; only the penalty
    # and denominator changed in v2.
    v2_calibrated = None
    v2_origin = None
    if semantic_match_enriched:
        v2_calibrated = semantic_match_enriched.get(
            "match_percentage_v2_calibrated"
        )
        if v2_calibrated is not None:
            v2_origin = "sbert_v2_enriched"

    if v2_calibrated is None:
        v2_calibrated = semantic_match.get("match_percentage_v2_calibrated")
        if v2_calibrated is not None:
            v2_origin = "sbert_v2_base"

    if v2_calibrated is not None:
        semantic_for_final = v2_calibrated
        final_score_source = "sbert_v2"
        semantic_source_detail = v2_origin or "sbert_v2_base"
        semantic_model = (
            (semantic_match_enriched or semantic_match).get(
                "ab_finetuned_model_path"
            )
            or semantic_match.get("model_used")
        )
    else:
        semantic_for_final = similarity_score
        final_score_source = "tfidf_fallback"
        semantic_source_detail = "tfidf_fallback"
        semantic_model = "tf-idf"

    # ---- Semantic-model identity (additive; snapshot provenance) ----------
    #
    # The snapshot contract needs a verifiable model identifier and hash.
    # `semantic_model` already records what actually fed the final score. A
    # local directory gets its weights SHA-256 verified against the file on
    # disk; anything else (hub name, tf-idf) keeps hash/calibration explicitly
    # None. Failure or missing data omits the key — never a fabricated value.
    try:
        semantic_model_info = resolve_semantic_model_info(
            semantic_model,
            fallback_enabled=(final_score_source == "tfidf_fallback"),
        )
    except Exception as e:  # noqa: BLE001 - provenance must never break scoring
        logger.warning("semanticModelInfo unavailable; omitted: %s", e)
        semantic_model_info = None

    # Authoritative v2 contract: 60/40 base, proportional essential-skill
    # penalty (10% per missing essential, cap 40%), applied once.
    scoring = compute_match_score(
        candidate_skills=candidate_skills,
        required_skills=required_skills,
        essential_skills=essential_skills,
        semantic_score=semantic_for_final,
        semantic_source=semantic_source_detail,
        semantic_model=semantic_model,
        extra_warnings=required_warnings + essential_warnings,
        scoring_version=SCORING_VERSION,
    )

    # Skill-gap detail (difficulty, roadmap, recommendations) reuses the same
    # authoritative matched/missing lists so every response field agrees.
    enhanced_gaps = analyze_skill_gap(candidate_skills, required_skills)

    # Legacy penalty payload: keep `critical_skill_penalty.reduced_by` in
    # points for existing consumers. None when no essential skill is missing.
    legacy_penalty = None
    if scoring["missingMainSkills"]:
        legacy_penalty = {
            "reduced_by": scoring["mainSkillPenalty"]["points"],
            "missing": scoring["missingMainSkills"],
            "critical_skills": scoring["essentialSkills"],
            "rule": scoring["mainSkillPenalty"]["rule"],
        }

    # Merge legacy and v2 breakdown keys. `weights` keeps its historical
    # {skills, similarity} shape; the contract weights live in
    # `scoreBreakdown.contractWeights`.
    score_breakdown = {
        "skill_match_score": scoring["skillMatchScore"],
        "similarity_score": similarity_score,
        "weights": {
            "skills": 0.6,
            "similarity": 0.4,
        },
        "semantic_score_source": final_score_source,
        "critical_skill_penalty": legacy_penalty,
        "final_score_pre_penalty": scoring["baseScore"],
        **scoring["scoreBreakdown"],
    }

    return success_response(
        data={
            # ---- v2 contract fields (additive) ----
            "scoringVersion": scoring["scoringVersion"],
            "skillMatchScore": scoring["skillMatchScore"],
            "semanticMatchScore": scoring["semanticMatchScore"],
            "baseScore": scoring["baseScore"],
            "mainSkillPenalty": scoring["mainSkillPenalty"],
            "missingMainSkills": scoring["missingMainSkills"],
            "essentialSkills": scoring["essentialSkills"],
            "scoreBreakdown": scoring["scoreBreakdown"],
            "warnings": scoring["warnings"],
            # ---- additive provenance for the scoring snapshot ----
            "semanticModelInfo": semantic_model_info,
            # ---- legacy fields (unchanged shapes) ----
            "similarity": similarity_score,
            "finalScore": scoring["finalScore"],
            "score_breakdown": score_breakdown,
            "matchedSkills": scoring["matchedSkills"],
            "missingSkills": scoring["missingSkills"],
            "candidateSkills": scoring["candidateSkills"],
            "requiredSkills": scoring["requiredSkills"],
            "semantic_match": semantic_match,
            "semantic_match_enriched": semantic_match_enriched,
            "skill_gap_analysis": {
                "match_percentage": (
                    scoring["skillMatchScore"]
                    if scoring["skillMatchScore"] is not None else 0
                ),
                "missing_difficulty": enhanced_gaps["missing_difficulty"],
                "recommended_skills": enhanced_gaps["recommended_skills"],
                "roadmap": enhanced_gaps["roadmap"],
            },
            "unified_ranking": ranking,
        },
        message="Job match analysis complete",
        execution_time_ms=_execution_time(start),
        model_used="tfidf+sbert",
    )


@router.post(
    "/extract-skills",
    summary="Extract canonical skill names from text",
)
async def extract_skill_list(request: SkillExtractionRequest):
    """Return the extractor's canonical skill list for one piece of text.

    The Node server uses this to turn a parsed job description into suggested
    required skills. It is deterministic and never calls an LLM.
    """
    start = time.perf_counter()
    return success_response(
        data={"skills": extract_skills(request.text or "")},
        message="Skills extracted",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


# ---------------------------------------------------------------------------
# Step 4 A/B — development-only comparison endpoint.
#
# SAFETY CONTRACT:
# - Requires BOTH env vars set: SBERT_MODEL_PATH (fine-tuned A/B model) and
#   SBERT_AB_COMPARE_ENABLED=1. With defaults (neither set) the route
#   responds 404, so no new public production surface exists.
# - It never mutates the main /job-match response or any production score.
# - Fine-tuned cosine is returned RAW (range [-1, 1]); never multiplied by
#   100 and never thresholded.
# ---------------------------------------------------------------------------
@router.post(
    "/job-match/compare",
    summary="[DEV/AB ONLY] Side-by-side comparison: production vs fine-tuned SBERT",
    include_in_schema=False,
)
async def job_match_compare(request: JobMatchRequest):
    if not get_finetuned_ab_path() or \
            os.environ.get("SBERT_AB_COMPARE_ENABLED", "") != "1":
        raise HTTPException(
            status_code=404,
            detail="Not found (A/B compare disabled by default)",
        )

    start = time.perf_counter()
    resume_text = request.resume
    job_text = request.job

    # Production pipeline, executed exactly as in /job-match (unchanged).
    candidate_skills = extract_skills(resume_text)
    required_skills = extract_skills(job_text)
    vectors = build_vectors(job_text, resume_text)
    similarity_score = calculate_similarity(vectors)
    enhanced_gaps = analyze_skill_gap(candidate_skills, required_skills)
    semantic_match = compute_semantic_match_with_reasons(resume_text, job_text)
    skill_match_score = enhanced_gaps["match_percentage"]
    final_score = calculate_final_score(skill_match_score, similarity_score)
    ranking = calculate_unified_ranking(
        ats_score=min(len(candidate_skills) * 10, 100),
        semantic_similarity=semantic_match["similarity_score"],
    )

    return success_response(
        data={
            "tfidf_similarity": similarity_score,
            "production_sbert": {
                "similarity_score_x100": semantic_match["similarity_score"],
                "model_used": semantic_match.get("model_used"),
                "production_model": semantic_match.get("production_model"),
            },
            "finetuned_ab": {
                "similarity_score_finetuned_raw":
                    semantic_match.get("similarity_score_finetuned_raw"),
                "model_path": semantic_match.get("ab_finetuned_model_path"),
                "note": ("raw cosine, range [-1,1]; not a percentage; no "
                         "thresholds applied"),
            },
            "skill_match_score": skill_match_score,
            "matched_skills": enhanced_gaps["matched"],
            "missing_skills": enhanced_gaps["missing"],
            "final_score": final_score,
            "unified_ranking": ranking,
        },
        message="A/B job match comparison (dev only)",
        execution_time_ms=_execution_time(start),
        model_used="tfidf+sbert+ab",
    )
