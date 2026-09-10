"""
Recruiter AI Insights, Career Recommendations, and Interview Questions router.

WHY THIS FILE:
Provides AI-powered insights for recruiters, career recommendations for candidates,
and interview question generation. Uses deterministic logic when LLM is not present.

WHY THIS APPROACH:
- Deterministic fallback when LLM is unavailable
- Structured, consistent output format
- Reuses existing skill extraction and matching services
"""

import time
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from app.utils.response import _execution_time, success_response, error_response
from skill_extractor import extract_skills
from ai.skill_gap import skill_gap_analysis
from services.skill_gap_service import analyze_skill_gap

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Insights"])


# ──────────────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────────────

class InsightsRequest(BaseModel):
    resumeText: str = Field(default="", description="Resume text to analyze")
    jobDescription: str = Field(default="", description="Job description for context")


class CareerRecommendationRequest(BaseModel):
    skills: List[str] = Field(default_factory=list, description="List of candidate skills")
    experience_years: Optional[float] = Field(default=None, description="Years of experience")
    interests: List[str] = Field(default_factory=list, description="Areas of interest")


class InterviewQuestionsRequest(BaseModel):
    jobDescription: str = Field(default="", description="Job description to generate questions for")
    skills: List[str] = Field(default_factory=list, description="Required skills")
    difficulty: str = Field(default="medium", description="Question difficulty: easy, medium, hard")


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/insights/recruiter",
    summary="Generate recruiter AI insights from resume and job description",
)
async def recruiter_insights(request: InsightsRequest):
    """
    Generate AI-powered insights for recruiters about a candidate.

    Analyzes the resume against the job description and provides:
    - Overall fit assessment
    - Strengths and weaknesses
    - Key observations
    - Recommended interview focus areas
    """
    start = time.perf_counter()

    if not request.resumeText and not request.jobDescription:
        return success_response(
            data={
                "fit_assessment": "N/A",
                "strengths": [],
                "weaknesses": [],
                "key_observations": ["No data provided for analysis"],
                "interview_focus": [],
            },
            message="No data provided",
            execution_time_ms=_execution_time(start),
            model_used="rule-based",
        )

    # Extract skills
    candidate_skills = extract_skills(request.resumeText) if request.resumeText else []
    required_skills = extract_skills(request.jobDescription) if request.jobDescription else []

    # Skill gap analysis
    gap_analysis = skill_gap_analysis(candidate_skills, required_skills)
    matched = gap_analysis.get("matched", [])
    missing = gap_analysis.get("missing", [])

    # Generate insights
    strengths = _generate_strengths(candidate_skills, matched)
    weaknesses = _generate_weaknesses(missing)
    fit_assessment = _generate_fit_assessment(matched, missing, required_skills)
    key_observations = _generate_key_observations(candidate_skills, required_skills, matched, missing)
    interview_focus = _generate_interview_focus(missing, required_skills)

    return success_response(
        data={
            "fit_assessment": fit_assessment,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "key_observations": key_observations,
            "interview_focus": interview_focus,
            "skill_match": {
                "matched": matched,
                "missing": missing,
                "match_percentage": round((len(matched) / len(required_skills)) * 100, 1) if required_skills else 0,
            },
        },
        message="Recruiter insights generated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/insights/career-recommendation",
    summary="Generate career recommendations based on skills and experience",
)
async def career_recommendation(request: CareerRecommendationRequest):
    """
    Generate career path recommendations based on candidate's skills and experience.

    Provides:
    - Recommended roles
    - Skills to develop
    - Career progression suggestions
    """
    start = time.perf_counter()

    if not request.skills:
        return success_response(
            data={
                "recommended_roles": [],
                "skills_to_develop": [],
                "career_progression": [],
            },
            message="No skills provided",
            execution_time_ms=_execution_time(start),
            model_used="rule-based",
        )

    skills_lower = [s.lower() for s in request.skills]

    # Role recommendations based on skills
    recommended_roles = _get_recommended_roles(skills_lower, request.experience_years)

    # Skills to develop
    skills_to_develop = _get_skills_to_develop(skills_lower)

    # Career progression
    career_progression = _get_career_progression(skills_lower, request.experience_years)

    return success_response(
        data={
            "recommended_roles": recommended_roles,
            "skills_to_develop": skills_to_develop,
            "career_progression": career_progression,
        },
        message="Career recommendations generated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/insights/interview-questions",
    summary="Generate interview questions based on job description and skills",
)
async def interview_questions(request: InterviewQuestionsRequest):
    """
    Generate interview questions based on job requirements.

    Provides questions categorized by:
    - Technical skills
    - Experience/behavioral
    - Problem-solving
    - Difficulty level
    """
    start = time.perf_counter()

    if not request.jobDescription and not request.skills:
        return success_response(
            data={
                "technical_questions": [],
                "behavioral_questions": [],
                "problem_solving_questions": [],
            },
            message="No job description or skills provided",
            execution_time_ms=_execution_time(start),
            model_used="rule-based",
        )

    # Extract skills from job description if not provided
    skills = request.skills if request.skills else extract_skills(request.jobDescription)

    # Generate questions
    technical_questions = _generate_technical_questions(skills, request.difficulty)
    behavioral_questions = _generate_behavioral_questions()
    problem_solving_questions = _generate_problem_solving_questions(skills, request.difficulty)

    return success_response(
        data={
            "technical_questions": technical_questions,
            "behavioral_questions": behavioral_questions,
            "problem_solving_questions": problem_solving_questions,
            "total_questions": len(technical_questions) + len(behavioral_questions) + len(problem_solving_questions),
        },
        message="Interview questions generated",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


# ──────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ──────────────────────────────────────────────────────────────────────────────

def _generate_strengths(candidate_skills: list[str], matched_skills: list[str]) -> list[str]:
    """Generate strength statements based on matched skills."""
    strengths = []

    if len(matched_skills) >= 5:
        strengths.append(f"Strong skill set with {len(matched_skills)} relevant skills matching the job requirements")
    elif len(matched_skills) >= 3:
        strengths.append(f"Good foundational skills with {len(matched_skills)} relevant skills")

    if any(s.lower() in ['python', 'javascript', 'java', 'typescript'] for s in candidate_skills):
        strengths.append("Proficiency in in-demand programming languages")

    if any(s.lower() in ['react', 'nodejs', 'docker', 'aws'] for s in candidate_skills):
        strengths.append("Experience with modern development tools and frameworks")

    if not strengths:
        strengths.append("Candidate has skills that can be developed further")

    return strengths


def _generate_weaknesses(missing_skills: list[str]) -> list[str]:
    """Generate weakness statements based on missing skills."""
    weaknesses = []

    if len(missing_skills) >= 5:
        weaknesses.append(f"Significant skill gap: missing {len(missing_skills)} required skills")
    elif len(missing_skills) >= 3:
        weaknesses.append(f"Moderate skill gap: missing {len(missing_skills)} required skills")
    elif missing_skills:
        weaknesses.append(f"Minor skill gap: missing {len(missing_skills)} skill(s)")

    if not weaknesses:
        weaknesses.append("No significant skill gaps identified")

    return weaknesses


def _generate_fit_assessment(matched: list[str], missing: list[str], required: list[str]) -> str:
    """Generate overall fit assessment."""
    if not required:
        return "Unable to assess fit - no job requirements provided"

    match_pct = (len(matched) / len(required)) * 100 if required else 0

    if match_pct >= 80:
        return f"Excellent fit ({match_pct:.0f}% skill match). Candidate closely matches job requirements."
    elif match_pct >= 60:
        return f"Good fit ({match_pct:.0f}% skill match). Candidate meets most requirements with some gaps."
    elif match_pct >= 40:
        return f"Moderate fit ({match_pct:.0f}% skill match). Candidate has some relevant skills but significant gaps exist."
    else:
        return f"Low fit ({match_pct:.0f}% skill match). Candidate lacks most required skills for this role."


def _generate_key_observations(
    candidate_skills: list[str],
    required_skills: list[str],
    matched: list[str],
    missing: list[str],
) -> list[str]:
    """Generate key observations about the candidate-job match."""
    observations = []

    if candidate_skills and required_skills:
        observations.append(f"Candidate has {len(candidate_skills)} skills, job requires {len(required_skills)} skills")
        observations.append(f"Match rate: {len(matched)}/{len(required_skills)} required skills found")

    if missing:
        observations.append(f"Key missing skills: {', '.join(missing[:5])}")

    if matched:
        observations.append(f"Strong areas: {', '.join(matched[:5])}")

    return observations


def _generate_interview_focus(missing_skills: list[str], required_skills: list[str]) -> list[str]:
    """Generate interview focus areas based on skill gaps."""
    focus = []

    if missing_skills:
        focus.append(f"Assess ability to learn missing skills: {', '.join(missing_skills[:3])}")

    if required_skills:
        focus.append(f"Verify depth of knowledge in: {', '.join(required_skills[:3])}")

    focus.append("Evaluate problem-solving approach and cultural fit")
    focus.append("Discuss past projects and team collaboration experience")

    return focus


def _get_recommended_roles(skills: list[str], experience_years: Optional[float]) -> list[dict]:
    """Get recommended job roles based on skills."""
    role_skills_map = {
        "Frontend Developer": ["react", "javascript", "html", "css", "typescript"],
        "Backend Developer": ["python", "nodejs", "java", "sql", "mongodb"],
        "Full Stack Developer": ["react", "nodejs", "python", "javascript", "sql", "mongodb"],
        "Data Scientist": ["python", "machine learning", "sql", "tensorflow", "pytorch"],
        "DevOps Engineer": ["docker", "kubernetes", "aws", "ci/cd", "linux"],
        "Mobile Developer": ["react native", "flutter", "swift", "kotlin", "java"],
        "Machine Learning Engineer": ["python", "machine learning", "deep learning", "tensorflow", "pytorch"],
        "Cloud Architect": ["aws", "azure", "gcp", "docker", "kubernetes"],
    }

    recommendations = []
    for role, required in role_skills_map.items():
        match_count = sum(1 for s in required if s in skills)
        if match_count >= 2:
            match_pct = round((match_count / len(required)) * 100)
            level = "Senior" if (experience_years or 0) >= 5 else "Mid-level" if (experience_years or 0) >= 2 else "Junior"
            recommendations.append({
                "role": f"{level} {role}",
                "match_percentage": match_pct,
                "matching_skills": [s for s in required if s in skills],
            })

    # Sort by match percentage
    recommendations.sort(key=lambda r: r["match_percentage"], reverse=True)

    return recommendations[:5]


def _get_skills_to_develop(skills: list[str]) -> list[dict]:
    """Get skills the candidate should develop next."""
    from services.skill_gap_service import SKILL_RELATIONSHIPS

    recommendations = []
    for skill in skills:
        related = SKILL_RELATIONSHIPS.get(skill, [])
        for rel in related:
            if rel.lower() not in skills:
                recommendations.append({
                    "skill": rel,
                    "based_on": skill,
                    "reason": f"Natural progression from {skill}",
                })

    # Remove duplicates
    seen = set()
    unique = []
    for rec in recommendations:
        if rec["skill"].lower() not in seen:
            seen.add(rec["skill"].lower())
            unique.append(rec)

    return unique[:5]


def _get_career_progression(skills: list[str], experience_years: Optional[float]) -> list[str]:
    """Generate career progression suggestions."""
    progression = []

    if experience_years is None:
        progression.append("Build a strong portfolio of projects to demonstrate your skills")
        progression.append("Consider contributing to open-source projects")
        progression.append("Network with professionals in your target industry")
    elif experience_years < 2:
        progression.append("Focus on deepening your technical skills and building real-world projects")
        progression.append("Seek mentorship from senior developers")
        progression.append("Consider certifications to validate your skills")
    elif experience_years < 5:
        progression.append("Consider specializing in a high-demand area (cloud, AI, security)")
        progression.append("Develop leadership and mentoring skills")
        progression.append("Start contributing to architecture and design decisions")
    else:
        progression.append("Consider moving into technical leadership or architecture roles")
        progression.append("Share your expertise through blogging, speaking, or mentoring")
        progression.append("Explore management or principal engineer career paths")

    return progression


def _generate_technical_questions(skills: list[str], difficulty: str) -> list[dict]:
    """Generate technical interview questions based on skills."""
    questions = []

    question_templates = {
        "python": {
            "easy": "Explain the difference between lists and tuples in Python.",
            "medium": "How does Python's garbage collection work? Explain reference counting.",
            "hard": "Implement a decorator that caches function results with a TTL (time-to-live).",
        },
        "javascript": {
            "easy": "What is the difference between let, const, and var in JavaScript?",
            "medium": "Explain how closures work in JavaScript with a practical example.",
            "hard": "Implement a Promise-based rate limiter that limits concurrent API calls.",
        },
        "react": {
            "easy": "What is the virtual DOM and how does React use it?",
            "medium": "Explain the useEffect hook and its dependency array. What happens with empty vs missing deps?",
            "hard": "Implement a custom hook for infinite scrolling with proper cleanup and error handling.",
        },
        "nodejs": {
            "easy": "What is the event loop in Node.js?",
            "medium": "Explain how you would handle errors in an Express.js application.",
            "hard": "Design a rate-limiting middleware for Express that works across multiple server instances.",
        },
        "sql": {
            "easy": "What is the difference between INNER JOIN and LEFT JOIN?",
            "medium": "Write a query to find the top 5 highest-paid employees in each department.",
            "hard": "Design a database schema for a real-time chat application and optimize it for high throughput.",
        },
        "mongodb": {
            "easy": "What is the difference between SQL and NoSQL databases?",
            "medium": "Explain how indexing works in MongoDB and when to use compound indexes.",
            "hard": "Design a MongoDB schema for a social media feed that supports efficient pagination.",
        },
        "docker": {
            "easy": "What is the difference between a Docker image and a container?",
            "medium": "Explain how Docker multi-stage builds work and why they are useful.",
            "hard": "Design a Docker Compose setup for a microservices application with service discovery.",
        },
        "aws": {
            "easy": "What are the main services offered by AWS?",
            "medium": "Explain the difference between vertical and horizontal scaling in AWS.",
            "hard": "Design a highly available, fault-tolerant architecture for a web application on AWS.",
        },
        "machine learning": {
            "easy": "What is the difference between supervised and unsupervised learning?",
            "medium": "Explain the bias-variance tradeoff in machine learning models.",
            "hard": "Design a recommendation system that handles the cold-start problem.",
        },
    }

    for skill in skills:
        skill_lower = skill.lower()
        if skill_lower in question_templates:
            template = question_templates[skill_lower]
            q = template.get(difficulty, template.get("medium", ""))
            if q:
                questions.append({
                    "skill": skill,
                    "difficulty": difficulty,
                    "question": q,
                })

    # Add general technical questions if not enough skill-specific ones
    if len(questions) < 3:
        general_questions = {
            "easy": "Explain the concept of RESTful APIs and their principles.",
            "medium": "Describe the differences between monolithic and microservices architecture.",
            "hard": "Design a URL shortening service like bit.ly. Cover the system design, database schema, and API.",
        }
        questions.append({
            "skill": "general",
            "difficulty": difficulty,
            "question": general_questions.get(difficulty, general_questions["medium"]),
        })

    return questions


def _generate_behavioral_questions() -> list[dict]:
    """Generate behavioral interview questions."""
    questions = [
        {
            "category": "Teamwork",
            "question": "Tell me about a time you had a conflict with a team member. How did you resolve it?",
        },
        {
            "category": "Leadership",
            "question": "Describe a situation where you took the lead on a project. What was the outcome?",
        },
        {
            "category": "Problem-Solving",
            "question": "Tell me about a challenging technical problem you solved. What was your approach?",
        },
        {
            "category": "Failure",
            "question": "Describe a project that didn't go as planned. What did you learn from it?",
        },
        {
            "category": "Adaptability",
            "question": "Tell me about a time you had to learn a new technology quickly. How did you approach it?",
        },
        {
            "category": "Communication",
            "question": "Describe a situation where you had to explain a complex technical concept to a non-technical audience.",
        },
    ]
    return questions


def _generate_problem_solving_questions(skills: list[str], difficulty: str) -> list[dict]:
    """Generate problem-solving interview questions."""
    questions = [
        {
            "type": "Algorithm",
            "difficulty": difficulty,
            "question": "Given an array of integers, find two numbers that add up to a specific target. Optimize for time complexity.",
        },
        {
            "type": "System Design",
            "difficulty": difficulty,
            "question": "Design a real-time collaborative document editing system (like Google Docs).",
        },
        {
            "type": "Data Structures",
            "difficulty": difficulty,
            "question": "Implement a Least Recently Used (LRU) cache with O(1) get and put operations.",
        },
    ]

    # Add skill-specific problem-solving
    if any(s.lower() in ['python', 'javascript', 'java'] for s in skills):
        questions.append({
            "type": "Debugging",
            "difficulty": difficulty,
            "question": "Given a piece of code with a race condition, identify the bug and fix it.",
        })

    return questions