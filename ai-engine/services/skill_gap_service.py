"""
Enhanced skill gap analysis with matched/missing/recommended skills + roadmap + difficulty.

WHY THIS FILE:
Provides comprehensive skill gap analysis that goes beyond simple matching.
Includes difficulty ratings, learning roadmaps, and recommended skills.

WHY THIS APPROACH:
- Deterministic analysis based on skill databases
- Difficulty ratings help prioritize learning
- Roadmap provides actionable next steps
- Recommended skills suggest what to learn next

ALTERNATIVES CONSIDERED:
- LLM-based analysis: expensive, inconsistent
- Simple matching: lacks depth and actionable insights
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Skill Difficulty Database
# ──────────────────────────────────────────────────────────────────────────────

SKILL_DIFFICULTY = {
    # Beginner-friendly
    "python": "beginner",
    "html": "beginner",
    "css": "beginner",
    "javascript": "beginner",
    "sql": "beginner",
    "git": "beginner",
    "java": "intermediate",
    "react": "intermediate",
    "nodejs": "intermediate",
    "mongodb": "intermediate",
    "typescript": "intermediate",
    "express": "intermediate",
    "docker": "intermediate",
    "aws": "intermediate",
    "rest api": "intermediate",
    "machine learning": "advanced",
    "deep learning": "advanced",
    "kubernetes": "advanced",
    "tensorflow": "advanced",
    "pytorch": "advanced",
    "nlp": "advanced",
    "computer vision": "advanced",
    "system design": "advanced",
    "microservices": "advanced",
}

# ──────────────────────────────────────────────────────────────────────────────
# Skill Relationships (for recommendations)
# ──────────────────────────────────────────────────────────────────────────────

SKILL_RELATIONSHIPS = {
    "python": ["machine learning", "deep learning", "nlp", "data science", "django", "flask"],
    "javascript": ["react", "nodejs", "typescript", "vue", "angular"],
    "react": ["typescript", "next.js", "redux", "graphql"],
    "nodejs": ["express", "mongodb", "typescript", "graphql"],
    "java": ["spring", "microservices", "kubernetes", "docker"],
    "sql": ["mongodb", "postgresql", "database design", "data modeling"],
    "docker": ["kubernetes", "ci/cd", "devops", "aws"],
    "aws": ["docker", "kubernetes", "terraform", "ci/cd"],
    "machine learning": ["deep learning", "nlp", "computer vision", "tensorflow", "pytorch"],
    "html": ["css", "javascript", "react", "responsive design"],
    "css": ["sass", "tailwind", "bootstrap", "responsive design"],
}


def analyze_skill_gap(
    candidate_skills: list[str],
    required_skills: list[str],
) -> dict:
    """
    Enhanced skill gap analysis with matched/missing/recommended skills,
    difficulty ratings, and learning roadmap.

    Args:
        candidate_skills: List of skills the candidate has
        required_skills: List of skills required for the job

    Returns:
        Dict with:
        - matched: Skills present in both
        - missing: Required skills missing from candidate
        - match_percentage: Percentage of required skills matched
        - missing_difficulty: Difficulty breakdown of missing skills
        - recommended_skills: Skills the candidate should learn next
        - roadmap: Ordered learning roadmap for missing skills
    """
    candidate_lower = [s.lower() for s in candidate_skills]
    required_lower = [s.lower() for s in required_skills]

    matched = []
    missing = []

    for skill in required_skills:
        if skill.lower() in candidate_lower:
            matched.append(skill)
        else:
            missing.append(skill)

    # Match percentage
    match_percentage = round((len(matched) / len(required_skills)) * 100, 1) if required_skills else 0

    # Difficulty breakdown of missing skills
    missing_difficulty = _analyze_difficulty(missing)

    # Recommended skills (skills the candidate should learn next)
    recommended_skills = _get_recommended_skills(candidate_skills, required_skills)

    # Learning roadmap
    roadmap = _build_roadmap(missing, missing_difficulty)

    return {
        "matched": matched,
        "missing": missing,
        "match_percentage": match_percentage,
        "missing_difficulty": missing_difficulty,
        "recommended_skills": recommended_skills,
        "roadmap": roadmap,
    }


def _analyze_difficulty(skills: list[str]) -> dict:
    """
    Analyze the difficulty distribution of a list of skills.

    Returns dict with counts and lists for each difficulty level.
    """
    levels = {"beginner": [], "intermediate": [], "advanced": [], "unknown": []}

    for skill in skills:
        difficulty = SKILL_DIFFICULTY.get(skill.lower(), "unknown")
        levels[difficulty].append(skill)

    return {
        "beginner": {"count": len(levels["beginner"]), "skills": levels["beginner"]},
        "intermediate": {"count": len(levels["intermediate"]), "skills": levels["intermediate"]},
        "advanced": {"count": len(levels["advanced"]), "skills": levels["advanced"]},
        "unknown": {"count": len(levels["unknown"]), "skills": levels["unknown"]},
    }


def _get_recommended_skills(
    candidate_skills: list[str],
    required_skills: list[str],
    max_recommendations: int = 5,
) -> list[dict]:
    """
    Get recommended skills based on candidate's current skills and job requirements.

    Recommends skills that:
    1. Are related to the candidate's existing skills
    2. Are not already in the candidate's skill set
    3. Are relevant to the job requirements
    """
    candidate_lower = [s.lower() for s in candidate_skills]
    required_lower = [s.lower() for s in required_skills]

    recommendations = []

    # Find related skills for each candidate skill
    for skill in candidate_skills:
        related = SKILL_RELATIONSHIPS.get(skill.lower(), [])
        for rel in related:
            if rel.lower() not in candidate_lower and rel.lower() not in required_lower:
                recommendations.append({
                    "skill": rel,
                    "based_on": skill,
                    "reason": f"Related to your {skill} expertise",
                    "difficulty": SKILL_DIFFICULTY.get(rel.lower(), "unknown"),
                })

    # Add missing required skills as recommendations
    for skill in required_skills:
        if skill.lower() not in candidate_lower:
            recommendations.append({
                "skill": skill,
                "based_on": "job_requirement",
                "reason": f"Required for the target role",
                "difficulty": SKILL_DIFFICULTY.get(skill.lower(), "unknown"),
            })

    # Remove duplicates (keep first occurrence)
    seen = set()
    unique_recommendations = []
    for rec in recommendations:
        if rec["skill"].lower() not in seen:
            seen.add(rec["skill"].lower())
            unique_recommendations.append(rec)

    return unique_recommendations[:max_recommendations]


def _build_roadmap(
    missing_skills: list[str],
    difficulty_analysis: dict,
) -> list[dict]:
    """
    Build an ordered learning roadmap for missing skills.

    Skills are ordered by difficulty (beginner first, then intermediate, then advanced).
    """
    roadmap = []

    # Order: beginner -> intermediate -> advanced -> unknown
    difficulty_order = ["beginner", "intermediate", "advanced", "unknown"]

    for level in difficulty_order:
        for skill in difficulty_analysis.get(level, {}).get("skills", []):
            roadmap.append({
                "skill": skill,
                "difficulty": level,
                "estimated_time": _estimate_learning_time(level),
                "priority": "high" if level == "beginner" else "medium" if level == "intermediate" else "low",
            })

    return roadmap


def _estimate_learning_time(difficulty: str) -> str:
    """Estimate learning time based on difficulty level."""
    estimates = {
        "beginner": "1-2 weeks",
        "intermediate": "3-6 weeks",
        "advanced": "2-4 months",
        "unknown": "Varies",
    }
    return estimates.get(difficulty, "Varies")