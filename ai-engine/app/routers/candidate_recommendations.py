"""
Candidate Job Recommendations Router for IntelliHire AI Engine.

WHY THIS FILE:
Provides AI-powered job recommendations for candidates:
- Semantic job matching
- Career path suggestions
- Skill development recommendations

WHY THIS APPROACH:
- Helps candidates find relevant job opportunities
- Personalized recommendations based on skills and experience
- Actionable career development suggestions
"""

import time
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

from app.utils.response import _execution_time, success_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Candidate Recommendations"])


# ──────────────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────────────

class JobRecommendationsRequest(BaseModel):
    candidate_skills: List[str] = Field(default_factory=list, description="List of candidate's skills")
    experience_years: Optional[float] = Field(default=None, description="Years of experience")
    interests: Optional[List[str]] = Field(default_factory=list, description="Areas of interest")
    jobs: Optional[List[Dict]] = Field(default_factory=list, description="List of available jobs")


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/candidate/job-recommendations",
    summary="Get personalized job recommendations",
)
async def get_job_recommendations(request: JobRecommendationsRequest):
    """
    Get personalized job recommendations for a candidate.
    
    Returns:
    - Recommended jobs with fit scores
    - Career path suggestions
    - Skill development recommendations
    - Summary of recommendations
    """
    start = time.perf_counter()
    
    if not request.candidate_skills:
        raise HTTPException(status_code=400, detail="At least one skill is required")
    
    from services.candidate_recommendations_service import generate_job_recommendations
    
    result = generate_job_recommendations(
        candidate_skills=request.candidate_skills,
        experience_years=request.experience_years,
        interests=request.interests,
        jobs=request.jobs,
    )
    
    return success_response(
        data=result,
        message=f"Generated job recommendations based on {len(request.candidate_skills)} skills",
        execution_time_ms=_execution_time(start),
        model_used="rule-based+sbert",
    )
