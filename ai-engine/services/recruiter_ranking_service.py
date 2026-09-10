"""
Enhanced Recruiter Candidate Ranking Service

WHY THIS FILE:
Provides AI-powered candidate ranking with detailed explanations.
Ranks candidates using multiple factors and provides transparent reasoning.

WHY THIS APPROACH:
- Multi-factor scoring for accurate ranking
- Explainable AI for recruiter trust
- Categorized recommendations (best/backup/reject)
- Actionable insights for hiring decisions
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


def rank_candidates_with_explanations(
    job_description: str,
    candidates: List[Dict],
) -> Dict:
    """
    Rank candidates with detailed explanations and categorization.
    
    Uses parallel processing for improved performance with large candidate pools.
    
    Args:
        job_description: Job description text
        candidates: List of candidate dicts with id, name, skills, resume_text (optional)
        
    Returns:
        Dict with ranked candidates, explanations, and categories
    """
    from skill_extractor import extract_skills
    from services.skill_gap_service import analyze_skill_gap
    from services.ranking_service import calculate_unified_ranking
    from services.semantic_matcher import compute_semantic_match
    from services.explainable_ai import explain_ranking
    from app.utils.parallel_processing import parallel_analyze_candidates
    
    required_skills = extract_skills(job_description)
    
    if not required_skills:
        return {
            "rankings": [],
            "categories": {"best": [], "backup": [], "reject": []},
            "summary": "No required skills extracted from job description",
            "job_skill_count": 0,
        }
    
    # Use parallel processing for large candidate pools
    if len(candidates) > 5:
        rankings = parallel_analyze_candidates(candidates, job_description)
    else:
        rankings = []
        for candidate in candidates:
            candidate_id = candidate.get("id", candidate.get("_id", ""))
            candidate_name = candidate.get("name", "Unknown")
            candidate_skills = [s.lower() for s in candidate.get("skills", [])]
            
            # Skill gap analysis
            enhanced_gaps = analyze_skill_gap(candidate_skills, required_skills)
            
            # Unified ranking
            ats_score = min(len(candidate_skills) * 10, 100)
            ranking = calculate_unified_ranking(
                ats_score=ats_score,
                semantic_similarity=enhanced_gaps["match_percentage"],
            )
            
            overall_score = round(ranking["overall"])
            
            # Generate explanation
            explanation = _generate_candidate_explanation(
                overall_score, enhanced_gaps, 0, candidate_skills, required_skills
            )
            
            rankings.append({
                "candidateId": candidate_id,
                "candidateName": candidate_name,
                "score": overall_score,
                "matchedSkills": enhanced_gaps["matched"],
                "missingSkills": enhanced_gaps["missing"],
                "matchPercentage": enhanced_gaps["match_percentage"],
                "semanticScore": None,
                "explanation": explanation,
                "breakdown": ranking.get("breakdown", {}),
            })
    
    # Sort by score descending
    rankings.sort(key=lambda r: r["score"], reverse=True)
    
    # Categorize candidates
    categories = _categorize_candidates(rankings)
    
    # Generate summary
    summary = _generate_ranking_summary(rankings, categories, required_skills)
    
    return {
        "rankings": rankings,
        "categories": categories,
        "summary": summary,
        "job_skill_count": len(required_skills),
        "total_candidates": len(rankings),
    }


def _generate_candidate_explanation(
    score: int,
    gap_analysis: Dict,
    semantic_score: float,
    candidate_skills: List[str],
    required_skills: List[str],
) -> Dict:
    """Generate detailed explanation for a candidate's ranking."""
    matched = gap_analysis.get("matched", [])
    missing = gap_analysis.get("missing", [])
    match_pct = gap_analysis.get("match_percentage", 0)
    
    # Strengths
    strengths = []
    if len(matched) >= 5:
        strengths.append(f"Strong skill alignment with {len(matched)} matching skills")
    elif len(matched) >= 3:
        strengths.append(f"Good skill overlap with {len(matched)} matching skills")
    
    if semantic_score and semantic_score >= 70:
        strengths.append(f"High semantic similarity ({semantic_score}%) with job description")
    
    if len(candidate_skills) >= 10:
        strengths.append(f"Broad skill set ({len(candidate_skills)} skills)")
    
    # Weaknesses
    weaknesses = []
    if len(missing) >= 5:
        weaknesses.append(f"Significant skill gaps: missing {len(missing)} required skills")
    elif len(missing) >= 3:
        weaknesses.append(f"Some skill gaps: missing {len(missing)} skills")
    
    if semantic_score and semantic_score < 40:
        weaknesses.append(f"Low semantic alignment ({semantic_score}%) with job description")
    
    # Recommendation
    if score >= 80:
        recommendation = "Strong candidate - recommend scheduling interview"
    elif score >= 60:
        recommendation = "Good candidate - consider for interview"
    elif score >= 40:
        recommendation = "Moderate fit - review skill gaps before proceeding"
    else:
        recommendation = "Weak match - consider other candidates"
    
    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendation": recommendation,
        "match_percentage": match_pct,
        "key_matched_skills": matched[:5],
        "critical_missing_skills": missing[:3],
    }


def _categorize_candidates(rankings: List[Dict]) -> Dict:
    """Categorize candidates into best, backup, and reject groups."""
    best = []
    backup = []
    reject = []
    
    for candidate in rankings:
        score = candidate["score"]
        if score >= 70:
            best.append({
                "candidateId": candidate["candidateId"],
                "candidateName": candidate["candidateName"],
                "score": score,
                "reason": "Strong match with high skill alignment",
            })
        elif score >= 45:
            backup.append({
                "candidateId": candidate["candidateId"],
                "candidateName": candidate["candidateName"],
                "score": score,
                "reason": "Moderate match - may be suitable with some training",
            })
        else:
            reject.append({
                "candidateId": candidate["candidateId"],
                "candidateName": candidate["candidateName"],
                "score": score,
                "reason": "Weak match - significant skill gaps",
            })
    
    return {
        "best": best,
        "backup": backup,
        "reject": reject,
    }


def _generate_ranking_summary(
    rankings: List[Dict],
    categories: Dict,
    required_skills: List[str],
) -> str:
    """Generate a human-readable summary of the ranking results."""
    total = len(rankings)
    best_count = len(categories["best"])
    backup_count = len(categories["backup"])
    reject_count = len(categories["reject"])
    
    if total == 0:
        return "No candidates to rank."
    
    top_candidate = rankings[0] if rankings else None
    
    summary_parts = [
        f"Analyzed {total} candidate(s) against {len(required_skills)} required skills.",
    ]
    
    if best_count > 0:
        summary_parts.append(f"{best_count} strong candidate(s) identified for interview.")
    
    if backup_count > 0:
        summary_parts.append(f"{backup_count} moderate candidate(s) that may be suitable with training.")
    
    if reject_count > 0:
        summary_parts.append(f"{reject_count} candidate(s) with significant skill gaps.")
    
    if top_candidate:
        summary_parts.append(
            f"Top candidate: {top_candidate['candidateName']} "
            f"with {top_candidate['score']}% match score."
        )
    
    return " ".join(summary_parts)
