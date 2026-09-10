"""
Pydantic schemas for Resume Builder AI Engine endpoints.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class PersonalInfo(BaseModel):
    fullName: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedIn: str = ""
    github: str = ""
    portfolio: str = ""


class EducationEntry(BaseModel):
    degree: str = ""
    institution: str = ""
    graduationYear: Optional[int] = None
    cgpa: Optional[float] = None
    branch: str = ""


class ExperienceEntry(BaseModel):
    company: str = ""
    role: str = ""
    description: str = ""
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    isCurrent: bool = False
    technologies: List[str] = []


class ProjectEntry(BaseModel):
    title: str = ""
    description: str = ""
    technologies: List[str] = []
    githubUrl: str = ""
    liveDemoUrl: str = ""
    role: str = ""
    duration: str = ""


class CertificateEntry(BaseModel):
    name: str = ""
    issuer: str = ""
    issueDate: Optional[str] = None
    credentialUrl: str = ""


class CodingProfiles(BaseModel):
    github: str = ""
    leetcode: str = ""
    hackerrank: str = ""
    problemsSolved: int = 0
    ratings: dict = {}


class LanguageEntry(BaseModel):
    name: str = ""
    proficiency: str = "Basic"


class LinkEntry(BaseModel):
    title: str = ""
    url: str = ""
    platform: str = "Other"


class ResumeData(BaseModel):
    personalInfo: PersonalInfo = PersonalInfo()
    summary: str = ""
    skills: List[str] = []
    education: List[EducationEntry] = []
    experience: List[ExperienceEntry] = []
    projects: List[ProjectEntry] = []
    certificates: List[CertificateEntry] = []
    codingProfiles: CodingProfiles = CodingProfiles()
    achievements: List[str] = []
    languages: List[LanguageEntry] = []
    links: List[LinkEntry] = []
    templateId: str = "classic-ats"


# ── Request/Response Schemas ──

class GenerateSummaryRequest(BaseModel):
    resumeData: ResumeData
    jobDescription: Optional[str] = None


class GenerateSummaryResponse(BaseModel):
    summary: str = Field(..., description="AI-generated professional summary")
    wordCount: int = 0


class OptimizeSectionRequest(BaseModel):
    section: str = Field(..., description="Section name: summary, experience, projects, etc.")
    content: str = Field(..., description="Current content to optimize")
    resumeData: Optional[ResumeData] = None
    jobDescription: Optional[str] = None


class OptimizeSectionResponse(BaseModel):
    original: str = ""
    optimized: str = ""
    suggestions: List[str] = []


class AtsAnalyzeRequest(BaseModel):
    resumeData: ResumeData
    jobDescription: Optional[str] = None


class AtsAnalyzeResponse(BaseModel):
    atsScore: int = Field(0, ge=0, le=100)
    keywordCoverage: float = 0.0
    matchedKeywords: List[str] = []
    missingKeywords: List[str] = []
    sectionCompleteness: dict = {}
    recommendations: List[str] = []


class JobMatchRequest(BaseModel):
    resumeData: ResumeData
    jobDescription: str


class JobMatchResponse(BaseModel):
    matchScore: float = 0.0
    matchedKeywords: List[str] = []
    missingKeywords: List[str] = []
    recommendations: List[str] = []
