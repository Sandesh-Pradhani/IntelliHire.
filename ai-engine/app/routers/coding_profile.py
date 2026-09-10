"""
Coding Profile scoring router for IntelliHire AI Engine.

WHY THIS FILE:
Handles the POST /coding-score endpoint that calculates a unified coding score
from GitHub, LeetCode, and HackerRank statistics. Also provides the unified
candidate score endpoint that integrates coding into the overall evaluation.

WHY THIS APPROACH:
- APIRouter keeps coding endpoints isolated from other domains
- Reuses the coding_scoring service for all scoring logic
- Uses the standardized response envelope for consistency
"""

import time
import logging
from fastapi import APIRouter

from app.schemas.coding_profile import (
    CodingScoreRequest,
    CodingScoreResponse,
)
from app.utils.response import _execution_time, success_response
from services.coding_scoring import (
    calculate_coding_score,
    calculate_unified_candidate_score,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Coding Profile"])


@router.post(
    "/coding-score",
    summary="Calculate coding score from GitHub, LeetCode, and HackerRank stats",
    response_model=CodingScoreResponse,
)
async def coding_score(request: CodingScoreRequest):
    """
    Calculate a unified coding score (0-100) from platform statistics.

    Weights:
    - GitHub: 40%
    - LeetCode: 40%
    - HackerRank: 20%

    Returns the coding score, an AI recommendation, and a per-platform breakdown.
    """
    start = time.perf_counter()

    github = request.github.model_dump() if request.github else None
    leetcode = request.leetcode.model_dump() if request.leetcode else None
    hackerrank = request.hackerrank.model_dump() if request.hackerrank else None

    result = calculate_coding_score(
        github=github,
        leetcode=leetcode,
        hackerrank=hackerrank,
    )

    return success_response(
        data=result,
        message="Coding score calculated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/unified-score",
    summary="Calculate unified candidate score with coding, project, and certificate integration",
)
async def unified_score(request: dict):
    """
    Calculate the unified candidate score integrating ATS, Semantic, Academic,
    Coding, Project, and Certificate scores.

    Weights (V5.4):
    - Semantic: 28%
    - ATS: 18%
    - Academic: 14%
    - Coding: 18%
    - Projects: 14%
    - Certificates: 8%
    """
    start = time.perf_counter()

    ats_score = request.get("atsScore", 0)
    semantic_score = request.get("semanticScore", 0)
    academic_score = request.get("academicScore", 0)
    coding_score = request.get("codingScore", 0)
    project_score = request.get("projectScore", 0)
    certificate_score = request.get("certificateScore", 0)

    result = calculate_unified_candidate_score(
        ats_score=ats_score,
        semantic_score=semantic_score,
        academic_score=academic_score,
        coding_score=coding_score,
        project_score=project_score,
        certificate_score=certificate_score,
    )

    return success_response(
        data=result,
        message="Unified candidate score calculated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )
