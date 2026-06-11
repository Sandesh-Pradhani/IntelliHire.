"""
Resume analysis router for IntelliHire AI Engine.

WHY THIS FILE:
Handles resume text analysis, skill extraction, and ATS scoring.
Uses existing business logic from skill_extractor.py - NO algorithms rewritten.

WHY THIS APPROACH:
APIRouter keeps endpoints organized by domain and allows modular
inclusion in the main FastAPI app.

ALTERNATIVES CONSIDERED:
- Putting all endpoints in main.py: becomes unmaintainable
- Keeping Flask pattern: loses FastAPI benefits
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.resume import AnalyzeResumeRequest, AnalyzeResumeResponse

# Reuse existing business logic - unchanged from Flask era
# WHY: Zero algorithm changes. These are the same modules Flask used.
from skill_extractor import extract_skills

router = APIRouter(tags=["Resume Analysis"])


@router.post(
    "/analyze-resume",
    response_model=AnalyzeResumeResponse,
    summary="Extract skills and compute ATS score from resume text",
    status_code=status.HTTP_200_OK,
    responses={
        422: {"description": "Validation error - resumeText is required"},
    },
)
async def analyze_resume(request: AnalyzeResumeRequest):
    """
    Extract skills and calculate ATS compatibility score from resume text.

    **Request body:**
    - `resumeText` (string, **required**): Raw text extracted from resume PDF

    **Response:**
    - `skills`: List of extracted unique skills
    - `ats_score`: ATS compatibility score (0-100)

    **Business logic reused (unchanged):**
    - `skill_extractor.extract_skills()` - NLP skill extraction with spaCy
    - ATS formula: `min(len(skills) * 10, 100)` - same as original Flask
    """
    resume_text = request.resumeText

    # Reuse existing skill extraction - identical to Flask app.py
    skills = extract_skills(resume_text)

    # Reuse existing ATS formula - identical to Flask app.py
    ats_score = min(len(skills) * 10, 100)

    return AnalyzeResumeResponse(
        skills=skills,
        ats_score=ats_score,
    )