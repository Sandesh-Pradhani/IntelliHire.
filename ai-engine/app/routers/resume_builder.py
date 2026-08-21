"""
Resume Builder AI Router

Provides AI endpoints for:
- Professional summary generation
- Section optimization
- ATS analysis
- Job-specific matching
"""

import time
import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.resume_builder_schema import (
    GenerateSummaryRequest,
    GenerateSummaryResponse,
    OptimizeSectionRequest,
    OptimizeSectionResponse,
    AtsAnalyzeRequest,
    AtsAnalyzeResponse,
    JobMatchRequest,
    JobMatchResponse,
)
from app.utils.response import _execution_time, success_response
from services.resume_optimizer import (
    generate_summary,
    optimize_experience,
    optimize_project,
    analyze_ats,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Resume Builder"])


@router.post(
    "/resume-builder/generate-summary",
    summary="Generate professional summary from structured resume data",
)
async def generate_resume_summary(request: GenerateSummaryRequest):
    """
    Generate a concise, ATS-friendly professional summary based on
    the candidate's skills, projects, experience, education, and certificates.

    **CRITICAL:** Only uses information present in the resume data.
    Never fabricates achievements, metrics, or experience.
    """
    start = time.perf_counter()

    data = request.resumeData

    summary_text = generate_summary(
        skills=data.skills,
        projects=[p.dict() for p in data.projects],
        experience=[e.dict() for e in data.experience],
        education=[e.dict() for e in data.education],
        certificates=[c.dict() for c in data.certificates],
        coding_profiles=data.codingProfiles.dict() if data.codingProfiles else None,
        job_description=request.jobDescription,
    )

    word_count = len(summary_text.split())

    return success_response(
        data={
            "summary": summary_text,
            "wordCount": word_count,
        },
        message="Summary generated successfully",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/resume-builder/optimize-section",
    summary="Optimize a specific resume section",
)
async def optimize_resume_section(request: OptimizeSectionRequest):
    """
    Optimize a resume section by improving language, structure, and readability.

    **CRITICAL:** Only rephrases existing content. Never adds new information
    or fabricates details.
    """
    start = time.perf_counter()

    section = request.section.lower()
    content = request.content

    if section == "experience":
        optimized = optimize_experience(content, [])
        suggestions = [
            "Used action verbs to strengthen descriptions",
            "Improved sentence structure for clarity",
        ]
    elif section == "projects":
        optimized = optimize_project(content, [])
        suggestions = [
            "Enhanced project description clarity",
            "Used professional language",
        ]
    elif section == "summary":
        optimized = content.strip()
        suggestions = ["Summary should be concise and ATS-friendly"]
    else:
        optimized = content
        suggestions = ["Section content preserved as-is"]

    return success_response(
        data={
            "original": content,
            "optimized": optimized,
            "suggestions": suggestions,
        },
        message="Section optimized",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/resume-builder/ats-analyze",
    summary="Full ATS analysis of structured resume",
)
async def ats_analyze(request: AtsAnalyzeRequest):
    """
    Analyze the resume for ATS compatibility including:
    - Overall ATS score (0-100)
    - Keyword coverage percentage
    - Matched and missing keywords
    - Section completeness
    - Actionable recommendations
    """
    start = time.perf_counter()

    data = request.resumeData

    # Build plain text from resume data
    lines = []
    if data.personalInfo.fullName:
        lines.append(data.personalInfo.fullName)
    if data.personalInfo.email:
        lines.append(data.personalInfo.email)
    if data.summary:
        lines.append("PROFESSIONAL SUMMARY")
        lines.append(data.summary)
    if data.skills:
        lines.append("SKILLS")
        lines.append(", ".join(data.skills))
    if data.education:
        lines.append("EDUCATION")
        for e in data.education:
            lines.append(f"{e.degree} - {e.institution}")
    if data.experience:
        lines.append("EXPERIENCE")
        for e in data.experience:
            lines.append(f"{e.role} at {e.company}")
            if e.description:
                lines.append(e.description)
    if data.projects:
        lines.append("PROJECTS")
        for p in data.projects:
            lines.append(p.title)
            if p.description:
                lines.append(p.description)
    if data.certificates:
        lines.append("CERTIFICATIONS")
        for c in data.certificates:
            lines.append(f"{c.name} - {c.issuer}")
    if data.achievements:
        lines.append("ACHIEVEMENTS")
        lines.extend(data.achievements)

    resume_text = "\n".join(lines)

    result = analyze_ats(
        resume_text=resume_text,
        skills=data.skills,
        job_description=request.jobDescription,
    )

    return success_response(
        data=result,
        message="ATS analysis completed",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/resume-builder/job-match",
    summary="Compare resume against job description",
)
async def job_match_analysis(request: JobMatchRequest):
    """
    Compare the candidate's resume against a job description.
    Returns match score, matched/missing keywords, and recommendations.
    """
    start = time.perf_counter()

    data = request.resumeData
    job_desc = request.jobDescription

    # Build resume text
    lines = []
    if data.summary:
        lines.append(data.summary)
    if data.skills:
        lines.append(", ".join(data.skills))
    for e in data.experience:
        if e.description:
            lines.append(e.description)
    for p in data.projects:
        if p.description:
            lines.append(p.description)

    resume_text = " ".join(lines).lower()
    job_lower = job_desc.lower()

    # Extract job keywords
    import re
    job_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', job_lower))
    stop_words = {"the", "and", "for", "are", "but", "not", "you", "all", "can",
                  "has", "how", "its", "may", "new", "now", "see", "way", "who",
                  "did", "get", "let", "say", "use", "with", "that", "this", "will",
                  "each", "make", "like", "than", "them", "then", "what", "when",
                  "your", "from", "they", "been", "have", "much", "also", "more",
                  "some", "time", "very", "just", "over", "such", "take", "year",
                  "into", "only", "work", "well", "back", "being", "between",
                  "should", "about", "would", "could", "other", "which", "their",
                  "there", "these", "those", "where", "after", "first", "using"}

    tech_keywords = [w for w in job_words if w not in stop_words and len(w) > 3]

    matched = [w for w in tech_keywords if w in resume_text]
    missing = [w for w in tech_keywords if w not in resume_text and len(w) > 3][:15]

    match_score = round((len(matched) / max(len(tech_keywords), 1)) * 100, 1)

    recommendations = []
    if match_score < 50:
        recommendations.append("Low keyword match. Review job description for key requirements")
    if missing:
        top_missing = missing[:5]
        recommendations.append(f"Consider adding if relevant: {', '.join(top_missing)}")
    if not data.summary:
        recommendations.append("Add a professional summary tailored to this role")

    return success_response(
        data={
            "matchScore": match_score,
            "matchedKeywords": matched,
            "missingKeywords": missing,
            "recommendations": recommendations,
        },
        message="Job match analysis completed",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )
