"""
Unified candidate ranking engine using ATS + semantic match + experience/projects/education weighting.

WHY THIS FILE:
Provides a comprehensive ranking formula that combines multiple factors:
- ATS score (keyword matching)
- Semantic similarity (SBERT or TF-IDF)
- Experience relevance
- Projects relevance
- Education relevance

WHY THIS APPROACH:
- Multi-factor scoring is more accurate than single-factor
- Weighted formula allows tuning for different job types
- Falls back gracefully when SBERT is unavailable

ALTERNATIVES CONSIDERED:
- Single-factor ranking: less accurate
- ML-based ranking: requires training data
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def calculate_unified_ranking(
    ats_score: float,
    semantic_similarity: float,
    experience_years: Optional[float] = None,
    project_count: Optional[int] = None,
    education_level: Optional[str] = None,
    weights: Optional[dict] = None,
) -> dict:
    """
    Calculate unified ranking score using multiple weighted factors.

    Args:
        ats_score: ATS compatibility score (0-100)
        semantic_similarity: Semantic similarity score (0-100)
        experience_years: Years of relevant experience (optional)
        project_count: Number of relevant projects (optional)
        education_level: Highest education level (optional)
        weights: Custom weights dict (optional, uses defaults if None)

    Returns:
        Dict with:
        - overall: Final weighted score (0-100)
        - breakdown: Individual factor scores
        - weights: Weights used for calculation
    """
    # Default weights
    default_weights = {
        "ats": 0.30,
        "semantic": 0.30,
        "experience": 0.20,
        "projects": 0.10,
        "education": 0.10,
    }

    if weights is None:
        weights = default_weights

    # Normalize weights to sum to 1.0
    total_weight = sum(weights.values())
    if total_weight > 0:
        weights = {k: v / total_weight for k, v in weights.items()}

    # Calculate individual scores
    ats_component = ats_score * weights.get("ats", 0.30)
    semantic_component = semantic_similarity * weights.get("semantic", 0.30)

    # Experience score (0-100)
    experience_score = _calculate_experience_score(experience_years)
    experience_component = experience_score * weights.get("experience", 0.20)

    # Projects score (0-100)
    projects_score = _calculate_projects_score(project_count)
    projects_component = projects_score * weights.get("projects", 0.10)

    # Education score (0-100)
    education_score = _calculate_education_score(education_level)
    education_component = education_score * weights.get("education", 0.10)

    # Overall score
    overall = round(
        ats_component + semantic_component + experience_component
        + projects_component + education_component,
        2,
    )

    return {
        "overall": min(overall, 100),
        "breakdown": {
            "ats": {
                "score": ats_score,
                "weighted": round(ats_component, 2),
                "weight": weights.get("ats", 0.30),
            },
            "semantic": {
                "score": semantic_similarity,
                "weighted": round(semantic_component, 2),
                "weight": weights.get("semantic", 0.30),
            },
            "experience": {
                "score": experience_score,
                "weighted": round(experience_component, 2),
                "weight": weights.get("experience", 0.20),
                "years": experience_years,
            },
            "projects": {
                "score": projects_score,
                "weighted": round(projects_component, 2),
                "weight": weights.get("projects", 0.10),
                "count": project_count,
            },
            "education": {
                "score": education_score,
                "weighted": round(education_component, 2),
                "weight": weights.get("education", 0.10),
                "level": education_level,
            },
        },
        "weights_used": weights,
    }


def _calculate_experience_score(years: Optional[float]) -> float:
    """
    Calculate experience score (0-100).

    - 0 years: 0
    - 1-2 years: 40
    - 3-5 years: 70
    - 6-10 years: 90
    - 10+ years: 100
    """
    if years is None:
        return 50  # Default middle score when unknown

    if years <= 0:
        return 0
    elif years <= 2:
        return 40
    elif years <= 5:
        return 70
    elif years <= 10:
        return 90
    else:
        return 100


def _calculate_projects_score(count: Optional[int]) -> float:
    """
    Calculate projects score (0-100).

    - 0 projects: 0
    - 1-2 projects: 40
    - 3-5 projects: 70
    - 6-10 projects: 90
    - 10+ projects: 100
    """
    if count is None:
        return 50  # Default middle score when unknown

    if count <= 0:
        return 0
    elif count <= 2:
        return 40
    elif count <= 5:
        return 70
    elif count <= 10:
        return 90
    else:
        return 100


def _calculate_education_score(level: Optional[str]) -> float:
    """
    Calculate education score (0-100).

    - None/Unknown: 30
    - High School: 40
    - Associate/Diploma: 55
    - Bachelor's: 70
    - Master's: 85
    - PhD/Doctorate: 100
    """
    if level is None:
        return 30

    level_lower = level.lower()

    if any(term in level_lower for term in ['phd', 'doctorate', 'ph.d']):
        return 100
    elif any(term in level_lower for term in ['master', 'masters', 'ms', 'ma', 'mba']):
        return 85
    elif any(term in level_lower for term in ['bachelor', 'bachelors', 'bs', 'ba', 'b.tech', 'b.e']):
        return 70
    elif any(term in level_lower for term in ['associate', 'diploma']):
        return 55
    elif any(term in level_lower for term in ['high school', 'secondary']):
        return 40
    else:
        return 30