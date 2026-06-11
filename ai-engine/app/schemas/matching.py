"""
Pydantic schemas for job matching endpoints.

WHY THIS FILE:
Separates job-matching request/response models from other domains.
Keeps schemas organized by feature for maintainability.
"""

from pydantic import BaseModel, Field
from typing import List


class JobMatchRequest(BaseModel):
    """Request validation for POST /job-match."""
    resume: str = Field(
        default="",
        description="Resume/candidate text to match against the job"
    )
    job: str = Field(
        default="",
        description="Job description text to match against"
    )


class JobMatchResponse(BaseModel):
    """Response for POST /job-match.
    Matches original Flask response structure exactly.
    """
    similarity: float = Field(
        default=0.0,
        description="Cosine similarity score (0-100)"
    )
    finalScore: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Weighted final match score (0-100)"
    )
    matchedSkills: List[str] = Field(
        default_factory=list,
        description="Skills present in both resume and job description"
    )
    missingSkills: List[str] = Field(
        default_factory=list,
        description="Required skills that are missing from the resume"
    )
    candidateSkills: List[str] = Field(
        default_factory=list,
        description="All skills extracted from the resume"
    )
    requiredSkills: List[str] = Field(
        default_factory=list,
        description="All skills extracted from the job description"
    )