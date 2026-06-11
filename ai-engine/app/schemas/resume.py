"""
Pydantic schemas for resume analysis endpoints.

WHY THIS FILE:
Separates resume-related request/response models from other domains.
Keeps schemas organized by feature for maintainability.
"""

from pydantic import BaseModel, Field
from typing import List


class AnalyzeResumeRequest(BaseModel):
    """Request validation for POST /analyze-resume."""
    resumeText: str = Field(
        ...,
        min_length=1,
        description="Raw text extracted from a resume PDF"
    )


class AnalyzeResumeResponse(BaseModel):
    """Response for POST /analyze-resume.
    Matches original Flask response structure exactly.
    """
    skills: List[str] = Field(
        default_factory=list,
        description="Extracted unique skills from the resume"
    )
    ats_score: int = Field(
        default=0,
        ge=0,
        le=100,
        description="ATS compatibility score (0-100)"
    )