"""
Project Scoring router for IntelliHire AI Engine.

WHY THIS FILE:
Handles the POST /project-score endpoint that calculates an AI-powered
project score from project details, technologies, and documentation.

WHY THIS APPROACH:
- APIRouter keeps project endpoints isolated from other domains
- Reuses the project_scoring service for all scoring logic
- Uses the standardized response envelope for consistency
"""

import time
import logging
from fastapi import APIRouter

from schemas.project_schema import (
    ProjectScoreRequest,
    ProjectScoreResponse,
)
from app.utils.response import _execution_time, success_response
from services.project_scoring import calculate_project_score

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Project Scoring"])


@router.post(
    "/project-score",
    summary="Calculate AI-powered project score from project details",
    response_model=ProjectScoreResponse,
)
async def project_score(request: ProjectScoreRequest):
    """
    Calculate an AI-powered project score (0-100) from project details.

    Weights:
    - Technology Relevance: 30%
    - Project Complexity: 30%
    - Documentation Quality: 20%
    - Repository Quality: 20%

    Returns the portfolio score, per-dimension breakdown, and an AI recommendation.
    """
    start = time.perf_counter()

    result = calculate_project_score(
        title=request.title,
        description=request.description,
        github_url=request.githubUrl,
        technologies=request.technologies,
        category=request.category,
        team_size=request.teamSize,
        role=request.role,
    )

    return success_response(
        data=result,
        message="Project score calculated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )
