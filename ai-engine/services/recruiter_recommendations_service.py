"""
Recruiter Candidate Recommendations Service

WHY THIS FILE:
Provides AI-powered recommendations for recruiters on candidate selection.
Categorizes candidates into best, backup, and reject groups with explanations.

WHY THIS APPROACH:
- Data-driven hiring decisions
- Transparent candidate categorization
- Actionable recommendations for recruiters
- Reduces hiring bias with AI insights
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


def generate_recruiter_recommendations(
    job_description: str,
    candidates: List[Dict],
    threshold_best: float = 70,
    threshold_backup: float = 45,
) -> Dict:
    """
    Generate recruiter recommendations for candidate selection.
    
    Args:
        job_description: Job description text
        candidates: List of candidate data
        threshold_best: Score threshold for "best" candidates
        threshold_backup: Score threshold for "backup" candidates
        
    Returns:
        Dict with categorized candidates, hiring strategy, and insights
    """
    from skill_extractor import extract_skills
    from services.skill_gap_service import analyze_skill_gap
    from services.ranking_service import calculate_unified_ranking
    
    required_skills = extract_skills(job_description)
    
    if not required_skills:
        return {
            "best_candidates": [],
            "backup_candidates": [],
            "reject_candidates": [],
            "hiring_strategy": "No required skills extracted from job description",
            "interview_focus": [],
            "candidate_insights": {},
        }
    
    scored_candidates = []
    
    for candidate in candidates:
        candidate_id = candidate.get("id", candidate.get("_id", ""))
        candidate_name = candidate.get("name", "Unknown")
        candidate_skills = [s.lower() for s in candidate.get("skills", [])]
        
        # Skill gap analysis
        gap_analysis = analyze_skill_gap(candidate_skills, required_skills)
        
        # Unified ranking
        ats_score = min(len(candidate_skills) * 10, 100)
        ranking = calculate_unified_ranking(
            ats_score=ats_score,
            semantic_similarity=gap_analysis["match_percentage"],
        )
        
        overall_score = round(ranking["overall"])
        
        # Generate candidate insight
        insight = _generate_candidate_insight(
            overall_score, gap_analysis, candidate_skills, required_skills
        )
        
        scored_candidates.append({
            "candidateId": candidate_id,
            "candidateName": candidate_name,
            "score": overall_score,
            "matchedSkills": gap_analysis["matched"],
            "missingSkills": gap_analysis["missing"],
            "matchPercentage": gap_analysis["match_percentage"],
            "insight": insight,
        })
    
    # Sort by score
    scored_candidates.sort(key=lambda c: c["score"], reverse=True)
    
    # Categorize
    best_candidates = [c for c in scored_candidates if c["score"] >= threshold_best]
    backup_candidates = [
        c for c in scored_candidates 
        if threshold_backup <= c["score"] < threshold_best
    ]
    reject_candidates = [c for c in scored_candidates if c["score"] < threshold_backup]
    
    # Generate hiring strategy
    hiring_strategy = _generate_hiring_strategy(
        best_candidates, backup_candidates, reject_candidates, required_skills
    )
    
    # Generate interview focus areas
    interview_focus = _generate_interview_focus(
        best_candidates, backup_candidates, required_skills
    )
    
    # Generate candidate insights summary
    candidate_insights = _generate_candidate_insights_summary(
        best_candidates, backup_candidates, reject_candidates
    )
    
    return {
        "best_candidates": best_candidates,
        "backup_candidates": backup_candidates,
        "reject_candidates": reject_candidates,
        "hiring_strategy": hiring_strategy,
        "interview_focus": interview_focus,
        "candidate_insights": candidate_insights,
        "total_candidates": len(scored_candidates),
        "thresholds": {
            "best": threshold_best,
            "backup": threshold_backup,
        },
    }


def _generate_candidate_insight(
    score: int,
    gap_analysis: Dict,
    candidate_skills: List[str],
    required_skills: List[str],
) -> Dict:
    """Generate detailed insight for a candidate."""
    matched = gap_analysis.get("matched", [])
    missing = gap_analysis.get("missing", [])
    match_pct = gap_analysis.get("match_percentage", 0)
    
    # Strengths
    strengths = []
    if len(matched) >= 5:
        strengths.append(f"Strong skill alignment ({len(matched)} matching skills)")
    if match_pct >= 70:
        strengths.append("Meets most job requirements")
    if len(candidate_skills) >= 10:
        strengths.append("Diverse skill set")
    
    # Gaps
    gaps = []
    if len(missing) >= 5:
        gaps.append(f"Significant skill gaps ({len(missing)} missing skills)")
    elif len(missing) >= 3:
        gaps.append(f"Some skill gaps ({len(missing)} missing skills)")
    
    # Training needs
    training_needs = []
    for skill in missing[:3]:
        training_needs.append(f"Training in {skill}")
    
    return {
        "strengths": strengths,
        "gaps": gaps,
        "training_needs": training_needs,
        "readiness": "immediate" if score >= 70 else "with_training" if score >= 45 else "not_ready",
    }


def _generate_hiring_strategy(
    best: List[Dict],
    backup: List[Dict],
    reject: List[Dict],
    required_skills: List[str],
) -> str:
    """Generate hiring strategy recommendation."""
    total = len(best) + len(backup) + len(reject)
    
    if total == 0:
        return "No candidates analyzed."
    
    if best:
        return (
            f"Recommend interviewing {len(best)} top candidate(s) immediately. "
            f"Consider {len(backup)} backup candidates if top picks are unavailable. "
            f"Focus interviews on verifying depth in: {', '.join(required_skills[:3])}."
        )
    elif backup:
        return (
            f"No immediate hires identified. Consider {len(backup)} moderate candidates "
            f"with targeted training. Assess trainability and cultural fit during interviews."
        )
    else:
        return (
            f"No suitable candidates found. Consider expanding recruitment reach "
            f"or adjusting job requirements. Current skill requirements: {', '.join(required_skills[:5])}."
        )


def _generate_interview_focus(
    best: List[Dict],
    backup: List[Dict],
    required_skills: List[str],
) -> List[str]:
    """Generate interview focus areas."""
    focus = []
    
    if best:
        top_candidate = best[0]
        if top_candidate.get("missingSkills"):
            focus.append(
                f"Verify ability to learn missing skills: {', '.join(top_candidate['missingSkills'][:3])}"
            )
        focus.append(f"Assess depth of knowledge in: {', '.join(top_candidate.get('matchedSkills', [])[:3])}")
    
    if backup:
        focus.append("Evaluate trainability and learning speed")
        focus.append("Assess cultural fit and team collaboration")
    
    focus.append("Discuss past projects and problem-solving approach")
    focus.append("Verify communication and soft skills")
    
    return focus[:6]


def _generate_candidate_insights_summary(
    best: List[Dict],
    backup: List[Dict],
    reject: List[Dict],
) -> Dict:
    """Generate summary insights for candidate groups."""
    return {
        "best_count": len(best),
        "backup_count": len(backup),
        "reject_count": len(reject),
        "best_avg_score": round(
            sum(c["score"] for c in best) / len(best), 1
        ) if best else 0,
        "backup_avg_score": round(
            sum(c["score"] for c in backup) / len(backup), 1
        ) if backup else 0,
        "top_skills_in_pool": _get_top_skills(best + backup),
        "common_gaps": _get_common_gaps(reject),
    }


def _get_top_skills(candidates: List[Dict]) -> List[str]:
    """Get most common skills across candidates."""
    from collections import Counter
    
    all_skills = []
    for c in candidates:
        all_skills.extend(c.get("matchedSkills", []))
    
    return [skill for skill, _ in Counter(all_skills).most_common(5)]


def _get_common_gaps(candidates: List[Dict]) -> List[str]:
    """Get most common skill gaps across rejected candidates."""
    from collections import Counter
    
    all_missing = []
    for c in candidates:
        all_missing.extend(c.get("missingSkills", []))
    
    return [skill for skill, _ in Counter(all_missing).most_common(5)]
