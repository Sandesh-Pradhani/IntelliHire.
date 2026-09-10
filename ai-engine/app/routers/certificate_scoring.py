import logging
import time
from fastapi import APIRouter

from schemas.certificate_schema import CertificateScoreRequest, CertificateScoreResponse
from app.utils.response import _execution_time, success_response
from services.certificate_scoring import calculate_certificate_score

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Certificate Relevance and Evidence Scoring"])


@router.post(
    "/certificate-score",
    summary="Calculate certificate relevance and evidence score",
    response_model=CertificateScoreResponse,
)
async def certificate_score(request: CertificateScoreRequest):
    start = time.perf_counter()
    result = calculate_certificate_score(
        title=request.title,
        issuer=request.issuer,
        category=request.category,
        skills=request.skills,
        description=request.description,
        verification_status=request.verificationStatus,
        issue_date=request.issueDate,
        expiry_date=request.expiryDate,
        job_required_skills=request.jobRequiredSkills,
    )
    return success_response(
        data=result,
        message="Certificate relevance and evidence score calculated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )
