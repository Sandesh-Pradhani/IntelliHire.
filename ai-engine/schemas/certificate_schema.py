from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class CertificateScoreRequest(BaseModel):
    title: str = Field(..., description="Certificate title")
    issuer: str = Field(..., description="Issuing organization")
    category: str = Field(default="Other", description="Certificate category")
    skills: List[str] = Field(default_factory=list, description="Skills covered by the certificate")
    description: str = Field(default="", description="Certificate description")
    verificationStatus: str = Field(default="unverified", description="Evidence workflow status")
    issueDate: Optional[date] = Field(default=None, description="Certificate issue date")
    expiryDate: Optional[date] = Field(default=None, description="Certificate expiry date")
    jobRequiredSkills: List[str] = Field(default_factory=list, description="Optional job-required skills")


class CertificateScoreResponse(BaseModel):
    certificateScore: int = Field(default=0, ge=0, le=100, description="Candidate-profile contribution score")
    relevanceScore: int = Field(default=0, ge=0, le=100, description="Job or skill relevance score")
    verificationContribution: int = Field(default=0, ge=0, le=100, description="Evidence workflow contribution")
    skillContribution: int = Field(default=0, ge=0, le=100, description="Skill match contribution")
    freshnessContribution: int = Field(default=0, ge=0, le=100, description="Freshness contribution")
    recommendation: str = Field(default="", description="Profile guidance based on certificate contribution")
