"""
Resume analysis router for IntelliHire AI Engine.

WHY THIS FILE:
Handles resume text analysis, skill extraction, ATS scoring, and PDF parsing.
Uses existing business logic from skill_extractor.py - NO algorithms rewritten.

WHY THIS APPROACH:
APIRouter keeps endpoints organized by domain and allows modular
inclusion in the main FastAPI app.
"""

import time
import logging
import os
from fastapi import APIRouter, HTTPException, UploadFile, File, status
from pydantic import BaseModel, Field
from typing import List, Optional

from app.schemas.resume import AnalyzeResumeRequest, AnalyzeResumeResponse
from app.utils.response import _execution_time, success_response, error_response
from services.resume_parser_service import parse_resume_full, extract_resume_text
from services.ats_scoring_service import calculate_ats_score

# Reuse existing business logic - unchanged from Flask era
from skill_extractor import extract_skills

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Resume Analysis"])


# ──────────────────────────────────────────────────────────────────────────────
# Additional Schemas
# ──────────────────────────────────────────────────────────────────────────────

class AtsBreakdownResponse(BaseModel):
    overall: int = Field(..., ge=0, le=100, description="Overall ATS score")
    breakdown: dict = Field(default_factory=dict, description="Category breakdown")
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")
    metrics: dict = Field(default_factory=dict, description="Resume metrics")


class ParseResumeResponse(BaseModel):
    name: Optional[str] = Field(default=None, description="Candidate name")
    email: Optional[str] = Field(default=None, description="Email address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    skills: List[str] = Field(default_factory=list, description="Extracted skills")
    experience: List[dict] = Field(default_factory=list, description="Work experience entries")
    education: List[dict] = Field(default_factory=list, description="Education entries")
    projects: List[dict] = Field(default_factory=list, description="Project entries")
    certificates: List[str] = Field(default_factory=list, description="Certifications")
    github: Optional[str] = Field(default=None, description="GitHub URL")
    linkedin: Optional[str] = Field(default=None, description="LinkedIn URL")
    portfolio: Optional[str] = Field(default=None, description="Portfolio URL")
    languages: List[str] = Field(default_factory=list, description="Languages")
    achievements: List[str] = Field(default_factory=list, description="Achievements")


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/analyze-resume",
    summary="Extract skills and compute ATS score from resume text",
    status_code=status.HTTP_200_OK,
)
async def analyze_resume(request: AnalyzeResumeRequest):
    """
    Extract skills and calculate ATS compatibility score from resume text.
    Returns standard response envelope with execution_time and model_used.
    """
    start = time.perf_counter()
    resume_text = request.resumeText

    if not resume_text or not resume_text.strip():
        raise HTTPException(status_code=422, detail="resumeText is required")

    # Reuse existing skill extraction - identical to Flask app.py
    skills = extract_skills(resume_text)

    # Use new ATS scoring service with breakdown
    ats_result = calculate_ats_score(resume_text, skills)

    return success_response(
        data={
            "skills": skills,
            "ats_score": ats_result["overall"],
            "ats_breakdown": ats_result["breakdown"],
            "suggestions": ats_result["suggestions"],
            "metrics": ats_result["metrics"],
        },
        message="Resume analyzed successfully",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/resume/parse",
    summary="Parse resume PDF into structured JSON",
)
async def parse_resume(file: UploadFile = File(...)):
    """
    Upload a resume PDF and get full structured JSON extraction.

    Extract fields: name, email, phone, skills, experience, education,
    projects, certificates, GitHub, LinkedIn, portfolio, languages, achievements.

    **Requires:** multipart/form-data with a PDF file in the 'file' field.
    """
    start = time.perf_counter()

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save uploaded file temporarily
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)

        # Parse the resume
        parsed = parse_resume_full(file_path)

        return success_response(
            data=parsed,
            message="Resume parsed successfully",
            execution_time_ms=_execution_time(start),
            model_used="rule-based",
        )
    except Exception as e:
        logger.error(f"Failed to parse resume {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass


@router.post(
    "/resume/ats-breakdown",
    summary="Get detailed ATS breakdown with suggestions",
)
async def ats_breakdown(request: AnalyzeResumeRequest):
    """
    Analyze resume and get detailed ATS breakdown by category
    (keywords, format, education, experience, skills) with actionable suggestions.

    **Request body:**
    - `resumeText` (string, **required**): Raw text extracted from resume PDF
    """
    start = time.perf_counter()

    if not request.resumeText or not request.resumeText.strip():
        raise HTTPException(status_code=422, detail="resumeText is required")

    skills = extract_skills(request.resumeText)
    ats_result = calculate_ats_score(request.resumeText, skills)

    return success_response(
        data=ats_result,
        message="ATS breakdown generated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )