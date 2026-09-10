"""
Pydantic schemas for the Coding Profile scoring endpoint.

WHY THIS FILE:
Defines the request/response models for POST /coding-score.
Separates coding profile schemas from other domains for maintainability.

WHY THIS APPROACH:
- Pydantic v2 models provide automatic request validation
- Clear field definitions make the API contract explicit
- Matches the existing schema pattern in app/schemas/
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class GitHubStats(BaseModel):
    """GitHub statistics for coding score calculation."""
    repositories: int = Field(default=0, ge=0, description="Number of public repositories")
    followers: int = Field(default=0, ge=0, description="Number of followers")
    stars: int = Field(default=0, ge=0, description="Total stars across repositories")
    languages: List[str] = Field(default_factory=list, description="Programming languages used")
    contributionActivity: Optional[Dict[str, Any]] = Field(
        default=None, description="Contribution activity metrics"
    )


class LeetCodeStats(BaseModel):
    """LeetCode statistics for coding score calculation."""
    problemsSolved: int = Field(default=0, ge=0, description="Total problems solved")
    easy: int = Field(default=0, ge=0, description="Easy problems solved")
    medium: int = Field(default=0, ge=0, description="Medium problems solved")
    hard: int = Field(default=0, ge=0, description="Hard problems solved")
    contestRating: Optional[int] = Field(default=None, ge=0, description="Current contest rating")
    topPercentage: Optional[float] = Field(default=None, ge=0, le=100, description="Top percentage in contests")


class HackerRankStats(BaseModel):
    """HackerRank statistics for coding score calculation."""
    stars: int = Field(default=0, ge=0, description="Total stars earned")
    badges: List[Dict[str, Any]] = Field(default_factory=list, description="Skill badges earned")


class CodingScoreRequest(BaseModel):
    """Request validation for POST /coding-score."""
    github: Optional[GitHubStats] = Field(default=None, description="GitHub statistics")
    leetcode: Optional[LeetCodeStats] = Field(default=None, description="LeetCode statistics")
    hackerrank: Optional[HackerRankStats] = Field(default=None, description="HackerRank statistics")


class CodingScoreResponse(BaseModel):
    """Response for POST /coding-score."""
    codingScore: int = Field(default=0, ge=0, le=100, description="Overall coding score (0-100)")
    recommendation: str = Field(default="", description="AI recommendation based on coding profile")
    breakdown: Dict[str, Any] = Field(default_factory=dict, description="Per-platform score breakdown")