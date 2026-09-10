"""
Resume Suggestions & Comparison Router for IntelliHire AI Engine.

WHY THIS FILE:
Provides AI-powered resume improvement suggestions and version comparison:
- Missing keywords detection
- Weak points identification
- Formatting recommendations
- Resume version comparison

WHY THIS APPROACH:
- Helps candidates improve their resumes iteratively
- Data-driven suggestions for ATS optimization
- Version comparison for tracking improvements
"""

import time
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.utils.response import _execution_time, success_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Resume Suggestions"])


# ──────────────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────────────

class ResumeSuggestionsRequest(BaseModel):
    resumeText: str = Field(..., description="Resume text to analyze")
    jobDescription: Optional[str] = Field(default=None, description="Optional job description for targeted suggestions")


class VersionComparisonRequest(BaseModel):
    version_a_text: str = Field(..., description="Text of the first resume version")
    version_b_text: str = Field(..., description="Text of the second resume version")
    version_a_name: str = Field(default="Version A", description="Name/label for version A")
    version_b_name: str = Field(default="Version B", description="Name/label for version B")


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/resume/suggestions",
    summary="Get resume improvement suggestions",
)
async def get_resume_suggestions(request: ResumeSuggestionsRequest):
    """
    Get detailed resume improvement suggestions.
    
    Returns:
    - Missing keywords that should be added
    - Weak points that need improvement
    - Formatting issues to fix
    - Content suggestions
    - Priority actions
    """
    start = time.perf_counter()
    
    if not request.resumeText or not request.resumeText.strip():
        raise HTTPException(status_code=422, detail="resumeText is required")
    
    from services.resume_suggestions_service import generate_resume_suggestions
    
    result = generate_resume_suggestions(
        resume_text=request.resumeText,
        job_description=request.jobDescription,
    )
    
    return success_response(
        data=result,
        message="Resume suggestions generated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/resume/compare-versions",
    summary="Compare two resume versions",
)
async def compare_resume_versions(request: VersionComparisonRequest):
    """
    Compare two resume versions and provide detailed analysis.
    
    Returns:
    - ATS score comparison
    - Skills added/removed
    - Improvements identified
    - Regressions identified
    - Version-specific suggestions
    - Overall recommendation
    """
    start = time.perf_counter()
    
    if not request.version_a_text or not request.version_a_text.strip():
        raise HTTPException(status_code=422, detail="version_a_text is required")
    
    if not request.version_b_text or not request.version_b_text.strip():
        raise HTTPException(status_code=422, detail="version_b_text is required")
    
    from services.resume_version_comparison_service import compare_resume_versions
    
    result = compare_resume_versions(
        version_a_text=request.version_a_text,
        version_b_text=request.version_b_text,
        version_a_name=request.version_a_name,
        version_b_name=request.version_b_name,
    )
    
    return success_response(
        data=result,
        message="Resume versions compared successfully",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )
