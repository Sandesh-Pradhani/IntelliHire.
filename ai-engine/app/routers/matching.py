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

import time
import logging
from fastapi import APIRouter

from app.schemas.matching import JobMatchRequest, JobMatchResponse
from app.utils.response import _execution_time, success_response

# Reuse existing business logic - unchanged from Flask era
from skill_extractor import extract_skills
from ai.tfidf_engine import build_vectors
from ai.similarity_engine import calculate_similarity
from ai.skill_gap import skill_gap_analysis
from ai.ranking_engine import calculate_final_score

# New Phase 3 services
from services.skill_gap_service import analyze_skill_gap
from services.sbert_embeddings import compute_semantic_match_with_reasons
from services.ranking_service import calculate_unified_ranking

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

    # Reuse existing NLP skill extraction - identical to Flask
    candidate_skills = extract_skills(resume_text)
    required_skills = extract_skills(job_text)

    # Reuse existing TF-IDF vectorization - identical to Flask
    vectors = build_vectors(job_text, resume_text)

    # Reuse existing cosine similarity - identical to Flask
    similarity_score = calculate_similarity(vectors)

    # Enhanced skill gap analysis
    enhanced_gaps = analyze_skill_gap(candidate_skills, required_skills)

    # SBERT semantic similarity (if available)
    semantic_match = compute_semantic_match_with_reasons(resume_text, job_text)

    # Unified ranking score
    ranking = calculate_unified_ranking(
        ats_score=min(len(candidate_skills) * 10, 100),
        semantic_similarity=semantic_match["similarity_score"],
    )

    # Reuse existing final score calculation - identical to Flask
    final_score = calculate_final_score(
        len(candidate_skills) * 10,
        similarity_score,
    )

    return success_response(
        data={
            "similarity": similarity_score,
            "finalScore": final_score,
            "matchedSkills": enhanced_gaps["matched"],
            "missingSkills": enhanced_gaps["missing"],
            "candidateSkills": candidate_skills,
            "requiredSkills": required_skills,
            "semantic_match": semantic_match,
            "skill_gap_analysis": {
                "match_percentage": enhanced_gaps["match_percentage"],
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