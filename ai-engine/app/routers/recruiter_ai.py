"""
Recruiter AI Router for IntelliHire AI Engine.

WHY THIS FILE:
Provides AI-powered endpoints for recruiter workflows:
- Enhanced candidate ranking with explanations
- Dashboard analytics
- Candidate recommendations (best/backup/reject)
- Resume suggestions for candidates

WHY THIS APPROACH:
- Separates recruiter-specific endpoints from general AI endpoints
- Each endpoint reuses existing services for business logic
- Standard response envelope for consistency
"""

import time
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

from app.utils.response import _execution_time, success_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Recruiter AI"])


# ──────────────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────────────

class EnhancedRankingRequest(BaseModel):
    jobDescription: str = Field(default="", description="Job description text")
    candidates: List[Dict] = Field(default_factory=list, description="List of candidate data")


class RecruiterRecommendationsRequest(BaseModel):
    jobDescription: str = Field(default="", description="Job description text")
    candidates: List[Dict] = Field(default_factory=list, description="List of candidate data")
    threshold_best: float = Field(default=70, description="Score threshold for best candidates")
    threshold_backup: float = Field(default=45, description="Score threshold for backup candidates")


class DashboardAnalyticsRequest(BaseModel):
    candidates: List[Dict] = Field(default_factory=list, description="List of candidate data")
    jobs: List[Dict] = Field(default_factory=list, description="List of job postings")
    resumes: List[Dict] = Field(default_factory=list, description="List of resume data")


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/recruiter/rank-candidates-enhanced",
    summary="Enhanced candidate ranking with explanations",
)
async def rank_candidates_enhanced(request: EnhancedRankingRequest):
    """
    Rank candidates with detailed explanations and categorization.
    
    Returns ranked candidates with:
    - Overall scores
    - Matched/missing skills
    - Detailed explanations
    - Category recommendations (best/backup/reject)
    """
    start = time.perf_counter()
    
    if not request.candidates:
        raise HTTPException(status_code=400, detail="At least one candidate is required")
    
    from services.recruiter_ranking_service import rank_candidates_with_explanations
    
    result = rank_candidates_with_explanations(
        job_description=request.jobDescription,
        candidates=request.candidates,
    )
    
    return success_response(
        data=result,
        message=f"Ranked {len(request.candidates)} candidates with explanations",
        execution_time_ms=_execution_time(start),
        model_used="rule-based+sbert",
    )


@router.post(
    "/recruiter/recommendations",
    summary="Get recruiter candidate recommendations (best/backup/reject)",
)
async def get_recruiter_recommendations(request: RecruiterRecommendationsRequest):
    """
    Get AI-powered recommendations for candidate selection.
    
    Categorizes candidates into:
    - Best: Ready for immediate interview
    - Backup: Suitable with training
    - Reject: Significant skill gaps
    """
    start = time.perf_counter()
    
    if not request.candidates:
        raise HTTPException(status_code=400, detail="At least one candidate is required")
    
    from services.recruiter_recommendations_service import generate_recruiter_recommendations
    
    result = generate_recruiter_recommendations(
        job_description=request.jobDescription,
        candidates=request.candidates,
        threshold_best=request.threshold_best,
        threshold_backup=request.threshold_backup,
    )
    
    return success_response(
        data=result,
        message=f"Generated recommendations for {len(request.candidates)} candidates",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/recruiter/dashboard-analytics",
    summary="Get recruiter dashboard analytics",
)
async def get_dashboard_analytics(request: DashboardAnalyticsRequest):
    """
    Get comprehensive analytics for recruiter dashboard.
    
    Returns:
    - Candidate pool analysis
    - Skill trends
    - Job-candidate matching overview
    - Hiring funnel metrics
    - Actionable insights
    """
    start = time.perf_counter()
    
    from services.recruiter_dashboard_service import generate_dashboard_analytics
    
    result = generate_dashboard_analytics(
        candidates=request.candidates,
        jobs=request.jobs,
        resumes=request.resumes,
    )
    
    return success_response(
        data=result,
        message="Dashboard analytics generated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )
