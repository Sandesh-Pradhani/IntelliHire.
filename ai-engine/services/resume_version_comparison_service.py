"""
Resume Version Comparison Service

WHY THIS FILE:
Provides detailed comparison between resume versions.
Identifies improvements, regressions, and suggestions for each version.

WHY THIS APPROACH:
- Helps candidates track resume improvements
- Identifies what changes helped/hurt ATS scores
- Provides actionable suggestions for each version
- Supports iterative resume optimization
"""

import logging
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)


def compare_resume_versions(
    version_a_text: str,
    version_b_text: str,
    version_a_name: str = "Version A",
    version_b_name: str = "Version B",
) -> Dict:
    """
    Compare two resume versions and provide detailed analysis.
    
    Args:
        version_a_text: Text of the first resume version
        version_b_text: Text of the second resume version
        version_a_name: Name/label for version A
        version_b_name: Name/label for version B
        
    Returns:
        Dict with comparison results, improvements, regressions, and suggestions
    """
    from skill_extractor import extract_skills
    from services.ats_engine import calculate_weighted_ats
    
    # Extract skills from both versions
    skills_a = extract_skills(version_a_text)
    skills_b = extract_skills(version_b_text)
    
    # Calculate ATS scores for both versions
    ats_a = calculate_weighted_ats(version_a_text, skills_a)
    ats_b = calculate_weighted_ats(version_b_text, skills_b)
    
    # Compare metrics
    metrics_comparison = _compare_metrics(version_a_text, version_b_text, skills_a, skills_b)
    
    # Identify changes
    changes = _identify_changes(version_a_text, version_b_text, skills_a, skills_b)
    
    # Analyze improvements
    improvements = _analyze_improvements(ats_a, ats_b, skills_a, skills_b, changes)
    
    # Analyze regressions
    regressions = _analyze_regressions(ats_a, ats_b, skills_a, skills_b, changes)
    
    # Generate version-specific suggestions
    suggestions_a = _generate_version_suggestions(version_a_text, skills_a, ats_a, "older")
    suggestions_b = _generate_version_suggestions(version_b_text, skills_b, ats_b, "newer")
    
    # Overall comparison
    overall = _generate_overall_comparison(
        ats_a, ats_b, version_a_name, version_b_name
    )
    
    return {
        "version_a": {
            "name": version_a_name,
            "ats_score": ats_a["overall"],
            "skills_count": len(skills_a),
            "skills": skills_a,
            "breakdown": ats_a.get("weighted_breakdown", {}),
        },
        "version_b": {
            "name": version_b_name,
            "ats_score": ats_b["overall"],
            "skills_count": len(skills_b),
            "skills": skills_b,
            "breakdown": ats_b.get("weighted_breakdown", {}),
        },
        "comparison": {
            "ats_score_change": ats_b["overall"] - ats_a["overall"],
            "skills_change": len(skills_b) - len(skills_a),
            "metrics": metrics_comparison,
        },
        "changes": changes,
        "improvements": improvements,
        "regressions": regressions,
        "suggestions_a": suggestions_a,
        "suggestions_b": suggestions_b,
        "overall": overall,
    }


def _compare_metrics(
    text_a: str,
    text_b: str,
    skills_a: List[str],
    skills_b: List[str],
) -> Dict:
    """Compare basic metrics between versions."""
    words_a = len(text_a.split())
    words_b = len(text_b.split())
    
    return {
        "word_count": {"version_a": words_a, "version_b": words_b, "change": words_b - words_a},
        "skills_count": {"version_a": len(skills_a), "version_b": len(skills_b), "change": len(skills_b) - len(skills_a)},
        "has_email": {
            "version_a": bool(__import__('re').search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text_a)),
            "version_b": bool(__import__('re').search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text_b)),
        },
        "has_phone": {
            "version_a": bool(__import__('re').search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text_a)),
            "version_b": bool(__import__('re').search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text_b)),
        },
    }


def _identify_changes(
    text_a: str,
    text_b: str,
    skills_a: List[str],
    skills_b: List[str],
) -> Dict:
    """Identify specific changes between versions."""
    skills_a_lower = [s.lower() for s in skills_a]
    skills_b_lower = [s.lower() for s in skills_b]
    
    added_skills = [s for s in skills_b if s.lower() not in skills_a_lower]
    removed_skills = [s for s in skills_a if s.lower() not in skills_b_lower]
    kept_skills = [s for s in skills_b if s.lower() in skills_a_lower]
    
    return {
        "added_skills": added_skills,
        "removed_skills": removed_skills,
        "kept_skills": kept_skills,
        "skill_overlap": len(kept_skills),
        "total_changes": len(added_skills) + len(removed_skills),
    }


def _analyze_improvements(
    ats_a: Dict,
    ats_b: Dict,
    skills_a: List[str],
    skills_b: List[str],
    changes: Dict,
) -> List[Dict]:
    """Analyze improvements from version A to version B."""
    improvements = []
    
    # ATS score improvement
    if ats_b["overall"] > ats_a["overall"]:
        improvements.append({
            "type": "ats_score",
            "message": f"ATS score improved from {ats_a['overall']} to {ats_b['overall']}",
            "impact": "high",
        })
    
    # Skills added
    if changes.get("added_skills"):
        improvements.append({
            "type": "skills",
            "message": f"Added {len(changes['added_skills'])} new skills: {', '.join(changes['added_skills'][:5])}",
            "impact": "medium",
        })
    
    # Section improvements
    for category in ["experience", "skills", "projects", "education"]:
        score_a = ats_a.get("weighted_breakdown", {}).get(category, {}).get("raw_score", 0)
        score_b = ats_b.get("weighted_breakdown", {}).get(category, {}).get("raw_score", 0)
        if score_b > score_a:
            improvements.append({
                "type": f"section_{category}",
                "message": f"{category.title()} section improved from {score_a} to {score_b}",
                "impact": "medium",
            })
    
    return improvements


def _analyze_regressions(
    ats_a: Dict,
    ats_b: Dict,
    skills_a: List[str],
    skills_b: List[str],
    changes: Dict,
) -> List[Dict]:
    """Analyze regressions from version A to version B."""
    regressions = []
    
    # ATS score regression
    if ats_b["overall"] < ats_a["overall"]:
        regressions.append({
            "type": "ats_score",
            "message": f"ATS score decreased from {ats_a['overall']} to {ats_b['overall']}",
            "impact": "high",
        })
    
    # Skills removed
    if changes.get("removed_skills"):
        regressions.append({
            "type": "skills",
            "message": f"Removed {len(changes['removed_skills'])} skills: {', '.join(changes['removed_skills'][:5])}",
            "impact": "medium",
        })
    
    # Section regressions
    for category in ["experience", "skills", "projects", "education"]:
        score_a = ats_a.get("weighted_breakdown", {}).get(category, {}).get("raw_score", 0)
        score_b = ats_b.get("weighted_breakdown", {}).get(category, {}).get("raw_score", 0)
        if score_b < score_a:
            regressions.append({
                "type": f"section_{category}",
                "message": f"{category.title()} section decreased from {score_a} to {score_b}",
                "impact": "medium",
            })
    
    return regressions


def _generate_version_suggestions(
    text: str,
    skills: List[str],
    ats_result: Dict,
    version_label: str,
) -> List[str]:
    """Generate suggestions for a specific version."""
    suggestions = []
    
    if ats_result["overall"] < 70:
        suggestions.append(f"{version_label}: ATS score is below 70. Consider improvements.")
    
    if len(skills) < 10:
        suggestions.append(f"{version_label}: Only {len(skills)} skills detected. Add more relevant skills.")
    
    # Check specific sections
    breakdown = ats_result.get("weighted_breakdown", {})
    for category, data in breakdown.items():
        if data.get("raw_score", 0) < 50:
            suggestions.append(f"{version_label}: {category.title()} section needs improvement.")
    
    return suggestions


def _generate_overall_comparison(
    ats_a: Dict,
    ats_b: Dict,
    version_a_name: str,
    version_b_name: str,
) -> Dict:
    """Generate overall comparison summary."""
    score_a = ats_a["overall"]
    score_b = ats_b["overall"]
    diff = score_b - score_a
    
    if diff > 10:
        verdict = f"{version_b_name} is significantly better"
        recommendation = f"Use {version_b_name} for job applications"
    elif diff > 0:
        verdict = f"{version_b_name} is slightly better"
        recommendation = f"Consider using {version_b_name} but review suggestions"
    elif diff == 0:
        verdict = "Both versions are equal"
        recommendation = "Either version can be used"
    elif diff > -10:
        verdict = f"{version_a_name} is slightly better"
        recommendation = f"Consider using {version_a_name} or improve {version_b_name}"
    else:
        verdict = f"{version_a_name} is significantly better"
        recommendation = f"Use {version_a_name} and review what changed in {version_b_name}"
    
    return {
        "verdict": verdict,
        "recommendation": recommendation,
        "score_difference": diff,
        "winner": version_b_name if diff > 0 else version_a_name if diff < 0 else "tie",
    }
