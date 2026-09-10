"""
Pydantic schemas for the Project Scoring endpoint.

WHY THIS FILE:
Defines the request/response models for POST /project-score.
Separates project scoring schemas from other domains for maintainability.

WHY THIS APPROACH:
- Pydantic v2 models provide automatic request validation
- Clear field definitions make the API contract explicit
- Matches the existing schema pattern in app/schemas/
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class ProjectScoreRequest(BaseModel):
    """Request validation for POST /project-score."""
    title: str = Field(..., description="Project title")
    description: str = Field(default="", description="Project description")
    githubUrl: str = Field(default="", description="GitHub repository URL")
    technologies: List[str] = Field(default_factory=list, description="Technology stack used")
    category: str = Field(default="Other", description="Project category")
    teamSize: int = Field(default=1, ge=1, description="Number of team members")
    role: str = Field(default="", description="Candidate's role in the project")


class ProjectScoreResponse(BaseModel):
    """Response for POST /project-score."""
    technologyScore: int = Field(default=0, ge=0, le=100, description="Technology relevance score (0-100)")
    complexityScore: int = Field(default=0, ge=0, le=100, description="Project complexity score (0-100)")
    documentationScore: int = Field(default=0, ge=0, le=100, description="Documentation quality score (0-100)")
    portfolioScore: int = Field(default=0, ge=0, le=100, description="Overall portfolio score (0-100)")
    recommendation: str = Field(default="", description="AI recommendation based on project analysis")
