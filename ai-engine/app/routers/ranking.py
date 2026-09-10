"""
Candidate ranking router for IntelliHire AI Engine.

WHY THIS FILE:
Handles candidate ranking against job descriptions.
Uses existing business logic from skill_extractor.py and skill_gap.py.
NO algorithms rewritten.

WHY THIS APPROACH:
APIRouter keeps ranking endpoints isolated from resume analysis and matching.
"""

import time
import logging
from fastapi import APIRouter

from app.schemas.ranking import (
    RankCandidatesRequest,
    RankCandidatesResponse,
    CandidateRanking,
)
from app.utils.response import _execution_time, success_response

# Reuse existing business logic - unchanged from Flask era
from skill_extractor import extract_skills
from ai.skill_gap import skill_gap_analysis

# New Phase 3 services
from services.skill_gap_service import analyze_skill_gap
from services.ranking_service import calculate_unified_ranking

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Candidate Ranking"])


@router.post(
    "/rank-candidates",
    summary="Rank candidates against a job description",
)
async def rank_candidates(request: RankCandidatesRequest):
    """
    Rank candidates based on skill match with a job description.

    Uses enhanced skill gap analysis and unified ranking formula.
    """
    start = time.perf_counter()
    job_description = request.jobDescription
    candidates = request.candidates

    # Reuse existing NLP skill extraction - identical to Flask
    required_skills = extract_skills(job_description)

    if not required_skills:
        return success_response(
            data={"rankings": []},
            message="No required skills extracted from job description",
            execution_time_ms=_execution_time(start),
            model_used="rule-based",
        )

    rankings = []

    for candidate in candidates:
        candidate_id = candidate.id
        candidate_name = candidate.name
        candidate_skills = [s.lower() for s in candidate.skills]

        # Enhanced skill gap analysis
        enhanced_gaps = analyze_skill_gap(candidate_skills, required_skills)

        matched_skills = enhanced_gaps["matched"]
        missing_skills = enhanced_gaps["missing"]
        match_percentage = enhanced_gaps["match_percentage"]

        # Unified ranking score
        ats_score = min(len(candidate_skills) * 10, 100)
        ranking = calculate_unified_ranking(
            ats_score=ats_score,
            semantic_similarity=match_percentage,  # Use skill match as semantic proxy
        )

        rankings.append(
            CandidateRanking(
                candidateId=candidate_id,
                candidateName=candidate_name,
                score=round(ranking["overall"]),
                matchedSkills=matched_skills,
                missingSkills=missing_skills,
            )
        )

    # Sort descending by score - identical to Flask behavior
    rankings.sort(key=lambda r: r.score, reverse=True)

    return success_response(
        data={
            "rankings": [r.model_dump() for r in rankings],
            "total_candidates": len(rankings),
        },
        message=f"Ranked {len(rankings)} candidates",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )