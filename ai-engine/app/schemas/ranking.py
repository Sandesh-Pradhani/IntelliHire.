"""
Pydantic schemas for candidate ranking endpoints.

WHY THIS FILE:
Separates ranking request/response models from other domains.
Keeps schemas organized by feature for maintainability.

NOTE on _id field:
Pydantic v2 does not allow field names with leading underscores.
The Candidate model uses 'id' as the Python attribute name with
alias '_id' for JSON serialization/deserialization.
This preserves the original Flask API contract where the field
is named '_id' in JSON.
"""

from pydantic import BaseModel, Field
from typing import List


class Candidate(BaseModel):
    """A single candidate to be ranked.
    Accepts '_id' in JSON but uses 'id' as the Python attribute.
    """
    id: str = Field(
        default="",
        alias="_id",
        description="Candidate's unique identifier (JSON field: _id)"
    )
    name: str = Field(
        default="Unknown",
        description="Candidate's display name"
    )
    skills: List[str] = Field(
        default_factory=list,
        description="List of candidate's skills"
    )

    model_config = {"populate_by_name": True}


class RankCandidatesRequest(BaseModel):
    """Request validation for POST /rank-candidates."""
    jobDescription: str = Field(
        default="",
        description="Job description text to rank candidates against"
    )
    candidates: List[Candidate] = Field(
        default_factory=list,
        description="List of candidates to rank"
    )


class CandidateRanking(BaseModel):
    """A single candidate ranking entry in the response."""
    candidateId: str = Field(
        default="",
        description="Unique identifier for the candidate"
    )
    candidateName: str = Field(
        default="Unknown",
        description="Display name of the candidate"
    )
    score: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Match score percentage (0-100)"
    )
    matchedSkills: List[str] = Field(
        default_factory=list,
        description="Skills matched with job requirements"
    )
    missingSkills: List[str] = Field(
        default_factory=list,
        description="Required skills that the candidate lacks"
    )


class RankCandidatesResponse(BaseModel):
    """Response for POST /rank-candidates.
    Matches original Flask response structure exactly.
    """
    rankings: List[CandidateRanking] = Field(
        default_factory=list,
        description="Candidates sorted by match score (descending)"
    )