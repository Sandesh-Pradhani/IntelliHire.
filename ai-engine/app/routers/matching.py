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

from fastapi import APIRouter
from app.schemas.matching import JobMatchRequest, JobMatchResponse

# Reuse existing business logic - unchanged from Flask era
# WHY: Zero algorithm changes. Same modules Flask used.
from skill_extractor import extract_skills
from ai.tfidf_engine import build_vectors
from ai.similarity_engine import calculate_similarity
from ai.skill_gap import skill_gap_analysis
from ai.ranking_engine import calculate_final_score

router = APIRouter(tags=["Job Matching"])


@router.post(
    "/job-match",
    response_model=JobMatchResponse,
    summary="Match a resume/candidate against a job description",
)
async def job_match(request: JobMatchRequest):
    """
    Perform semantic matching between a resume and job description.

    **Request body:**
    - `resume` (string, optional): Resume/candidate text
    - `job` (string, optional): Job description text

    **Response:**
    - `similarity`: Cosine similarity score (0-100)
    - `finalScore`: Weighted final match score (0-100)
    - `matchedSkills`: Skills present in both resume and job
    - `missingSkills`: Required skills missing from resume
    - `candidateSkills`: All skills extracted from resume
    - `requiredSkills`: All skills extracted from job description

    **Business logic reused (unchanged):**
    - `skill_extractor.extract_skills()` - NLP skill extraction
    - `tfidf_engine.build_vectors()` - TF-IDF vectorization
    - `similarity_engine.calculate_similarity()` - Cosine similarity
    - `skill_gap.skill_gap_analysis()` - Gap analysis
    - `ranking_engine.calculate_final_score()` - Weighted scoring (40% ATS, 60% similarity)
    """
    resume_text = request.resume
    job_text = request.job

    # Reuse existing NLP skill extraction - identical to Flask
    candidate_skills = extract_skills(resume_text)
    required_skills = extract_skills(job_text)

    # Reuse existing TF-IDF vectorization - identical to Flask
    vectors = build_vectors(job_text, resume_text)

    # Reuse existing cosine similarity - identical to Flask
    similarity_score = calculate_similarity(vectors)

    # Reuse existing skill gap analysis - identical to Flask
    gaps = skill_gap_analysis(candidate_skills, required_skills)

    # Reuse existing final score calculation - identical to Flask
    # Formula: ats_score * 0.4 + similarity_score * 0.6
    final_score = calculate_final_score(
        len(candidate_skills) * 10,
        similarity_score,
    )

    return JobMatchResponse(
        similarity=similarity_score,
        finalScore=final_score,
        matchedSkills=gaps["matched"],
        missingSkills=gaps["missing"],
        candidateSkills=candidate_skills,
        requiredSkills=required_skills,
    )