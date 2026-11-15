"""
Pydantic schemas for job matching endpoints.

WHY THIS FILE:
Separates job-matching request/response models from other domains.
Keeps schemas organized by feature for maintainability.
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class JobMatchRequest(BaseModel):
    """Request validation for POST /job-match."""

    resume: str = Field(
        default="",
        description="Resume text to match against the job. The Node server "
                    "sends the raw parsed resume text when available.",
    )
    job: str = Field(
        default="",
        description="Job description text to match against",
    )
    # ---- Step 12: optional additive SBERT-only input ---------------------
    # Retained for backward compatibility. New callers should send raw resume
    # text as `resume`, which makes this field unnecessary.
    resume_semantic: str = Field(
        default="",
        description="Optional richer resume text used ONLY for SBERT semantic "
                    "matching; ignored by TF-IDF/skill extraction.",
    )
    # ---- Main/essential skill detection ----------------------------------
    job_title: str = Field(
        default="",
        description="Optional job title used to resolve title-only essentials",
    )
    # ---- Authoritative skill arrays (v2 scoring contract) ----------------
    candidate_skills: List[str] = Field(
        default_factory=list,
        alias="candidateSkills",
        description="Authoritative candidate skills. When empty, skills are "
                    "extracted from `resume`.",
    )
    required_skills: List[str] = Field(
        default_factory=list,
        alias="requiredSkills",
        description="Authoritative required skills (Job.requiredSkills). When "
                    "empty, skills are inferred from `job`.",
    )
    essential_skills: List[str] = Field(
        default_factory=list,
        alias="essentialSkills",
        description="Authoritative essential skills (Job.essentialSkills). "
                    "When empty, required skills are treated as essential.",
    )
    scoring_version: str = Field(
        default="2.0.0",
        alias="scoringVersion",
        description="Scoring contract version. v2 is the only implemented "
                    "formula; an unsupported value is reported in warnings.",
    )

    class Config:
        populate_by_name = True


class SkillExtractionRequest(BaseModel):
    """Request validation for POST /extract-skills."""

    text: str = Field(default="", description="Text to extract skills from")


class JobMatchResponse(BaseModel):
    """Response for POST /job-match.

    Legacy fields are kept exactly. v2 contract fields are additive.
    """

    similarity: float = Field(
        default=0.0,
        description="Cosine similarity score (0-100)",
    )
    finalScore: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Final match score (0-100), rounded half-up",
    )
    scoringVersion: str = Field(
        default="2.0.0",
        description="Authoritative scoring contract version",
    )
    skillMatchScore: Optional[float] = Field(
        default=None,
        description="Required-skill coverage percentage (0-100), or null when "
                    "the job has no required skills",
    )
    semanticMatchScore: Optional[float] = Field(
        default=None,
        description="Semantic match percentage (0-100) used in the base score",
    )
    baseScore: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Score before the essential-skill penalty",
    )
    matchedSkills: List[str] = Field(
        default_factory=list,
        description="Skills present in both resume and job description",
    )
    missingSkills: List[str] = Field(
        default_factory=list,
        description="Required skills that are missing from the resume",
    )
    missingMainSkills: List[str] = Field(
        default_factory=list,
        description="Essential skills missing from the resume",
    )
    candidateSkills: List[str] = Field(
        default_factory=list,
        description="All skills extracted from the resume",
    )
    requiredSkills: List[str] = Field(
        default_factory=list,
        description="Authoritative required skills used in the denominator",
    )
    essentialSkills: List[str] = Field(
        default_factory=list,
        description="Essential skills used for the penalty",
    )
    mainSkillPenalty: Dict[str, Any] = Field(
        default_factory=dict,
        description="Proportional essential-skill penalty details",
    )
    scoreBreakdown: Dict[str, Any] = Field(
        default_factory=dict,
        description="Formula, steps, source and rounding used by the UI",
    )
    warnings: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Plain-language warnings about missing or inferred inputs",
    )
