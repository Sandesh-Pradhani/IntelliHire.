"""
Candidate ranking router for IntelliHire AI Engine.

WHY THIS FILE:
Handles candidate ranking against job descriptions.
Uses existing business logic from skill_extractor.py and skill_gap.py.
NO algorithms rewritten.
"""

from fastapi import APIRouter
from app.schemas.ranking import (
    RankCandidatesRequest,
    RankCandidatesResponse,
    CandidateRanking,
)

# Reuse existing business logic - unchanged from Flask era
# WHY: Zero algorithm changes. Same modules Flask used.
from skill_extractor import extract_skills
from ai.skill_gap import skill_gap_analysis

router = APIRouter(tags=["Candidate Ranking"])


@router.post(
    "/rank-candidates",
    response_model=RankCandidatesResponse,
    summary="Rank candidates against a job description",
)
async def rank_candidates(request: RankCandidatesRequest):
    """
    Rank candidates based on skill match with a job description.

    **Request body:**
    - `jobDescription` (string, optional): Job description text
    - `candidates` (array, optional): List of candidates with skills
      Each candidate uses `_id` as the JSON field name (backward compatible)

    **Response:**
    - `rankings`: Candidates sorted by match score (descending)

    **Business logic reused (unchanged):**
    - `skill_extractor.extract_skills()` - NLP skill extraction
    - `skill_gap.skill_gap_analysis()` - Gap analysis per candidate

    **Scoring formula (identical to Flask):**
    - `(matchedSkills / requiredSkills) * 100`
    """
    job_description = request.jobDescription
    candidates = request.candidates

    # Reuse existing NLP skill extraction - identical to Flask
    required_skills = extract_skills(job_description)

    if not required_skills:
        return RankCandidatesResponse(rankings=[])

    rankings = []

    for candidate in candidates:
        # Use .id (Python attribute) instead of ._id
        # Pydantic alias maps JSON _id → Python id
        candidate_id = candidate.id
        candidate_name = candidate.name
        candidate_skills = [s.lower() for s in candidate.skills]

        # Reuse existing skill gap analysis - identical to Flask
        gaps = skill_gap_analysis(candidate_skills, required_skills)

        matched_skills = gaps["matched"]
        missing_skills = gaps["missing"]

        # Reuse identical scoring formula - identical to Flask
        match_percentage = (
            round((len(matched_skills) / len(required_skills)) * 100)
            if required_skills
            else 0
        )

        rankings.append(
            CandidateRanking(
                candidateId=candidate_id,
                candidateName=candidate_name,
                score=match_percentage,
                matchedSkills=matched_skills,
                missingSkills=missing_skills,
            )
        )

    # Sort descending by score - identical to Flask behavior
    rankings.sort(key=lambda r: r.score, reverse=True)

    return RankCandidatesResponse(rankings=rankings)