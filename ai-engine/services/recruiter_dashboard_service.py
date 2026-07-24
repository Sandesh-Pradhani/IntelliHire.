"""
Recruiter AI Dashboard Analytics Service

WHY THIS FILE:
Provides comprehensive analytics for recruiter dashboards.
Aggregates candidate data, skill trends, and hiring insights.

WHY THIS APPROACH:
- Aggregated metrics for data-driven hiring decisions
- Skill gap analysis across candidate pool
- Trend analysis for recruitment strategy
- Actionable insights for recruiters
"""

import logging
from typing import List, Dict, Optional
from collections import Counter
from datetime import datetime

logger = logging.getLogger(__name__)


def generate_dashboard_analytics(
    candidates: List[Dict],
    jobs: List[Dict],
    resumes: List[Dict],
) -> Dict:
    """
    Generate comprehensive dashboard analytics for recruiters.
    
    Args:
        candidates: List of candidate data
        jobs: List of job postings
        resumes: List of resume data
        
    Returns:
        Dict with analytics metrics, trends, and insights
    """
    # Candidate pool analysis
    candidate_analysis = _analyze_candidate_pool(candidates, resumes)
    
    # Skill trends
    skill_trends = _analyze_skill_trends(candidates, resumes, jobs)
    
    # Job-candidate matching overview
    matching_overview = _analyze_matching_overview(candidates, jobs, resumes)
    
    # Hiring funnel metrics
    funnel_metrics = _calculate_funnel_metrics(candidates, resumes)
    
    # Generate insights
    insights = _generate_hiring_insights(
        candidate_analysis, skill_trends, matching_overview, funnel_metrics
    )
    
    return {
        "candidate_analysis": candidate_analysis,
        "skill_trends": skill_trends,
        "matching_overview": matching_overview,
        "funnel_metrics": funnel_metrics,
        "insights": insights,
        "generated_at": datetime.utcnow().isoformat(),
    }


def _analyze_candidate_pool(candidates: List[Dict], resumes: List[Dict]) -> Dict:
    """Analyze the candidate pool composition."""
    total_candidates = len(candidates)
    
    # ATS score distribution
    ats_scores = [r.get("atsScore", 0) for r in resumes if r.get("atsScore")]
    
    avg_ats_score = round(sum(ats_scores) / len(ats_scores), 1) if ats_scores else 0
    
    # Score distribution
    score_ranges = {"excellent": 0, "good": 0, "moderate": 0, "low": 0}
    for score in ats_scores:
        if score >= 80:
            score_ranges["excellent"] += 1
        elif score >= 60:
            score_ranges["good"] += 1
        elif score >= 40:
            score_ranges["moderate"] += 1
        else:
            score_ranges["low"] += 1
    
    # Skill frequency
    all_skills = []
    for r in resumes:
        all_skills.extend(r.get("extractedSkills", []))
    
    skill_frequency = dict(Counter(all_skills).most_common(20))
    
    return {
        "total_candidates": total_candidates,
        "average_ats_score": avg_ats_score,
        "score_distribution": score_ranges,
        "top_skills": skill_frequency,
        "resumes_with_skills": sum(1 for r in resumes if r.get("extractedSkills")),
    }


def _analyze_skill_trends(
    candidates: List[Dict],
    resumes: List[Dict],
    jobs: List[Dict],
) -> Dict:
    """Analyze skill trends across candidates and jobs."""
    # Candidate skills
    candidate_skills = []
    for r in resumes:
        candidate_skills.extend(r.get("extractedSkills", []))
    
    # Required skills from jobs
    required_skills = []
    for job in jobs:
        required_skills.extend(job.get("requiredSkills", []))
    
    # Skill supply vs demand
    candidate_skill_counts = Counter(candidate_skills)
    required_skill_counts = Counter(required_skills)
    
    # In-demand skills (high demand, low supply)
    in_demand = []
    for skill, demand in required_skill_counts.most_common(10):
        supply = candidate_skill_counts.get(skill, 0)
        if supply < demand * 0.5:  # Less than 50% supply
            in_demand.append({
                "skill": skill,
                "demand": demand,
                "supply": supply,
                "gap": demand - supply,
            })
    
    # surplus skills (high supply, low demand)
    surplus = []
    for skill, supply in candidate_skill_counts.most_common(10):
        demand = required_skill_counts.get(skill, 0)
        if supply > demand * 2:  # More than 200% supply
            surplus.append({
                "skill": skill,
                "supply": supply,
                "demand": demand,
                "surplus": supply - demand,
            })
    
    return {
        "in_demand_skills": in_demand,
        "surplus_skills": surplus,
        "total_candidate_skills": len(candidate_skills),
        "total_required_skills": len(required_skills),
        "unique_candidate_skills": len(set(candidate_skills)),
        "unique_required_skills": len(set(required_skills)),
    }


def _analyze_matching_overview(
    candidates: List[Dict],
    jobs: List[Dict],
    resumes: List[Dict],
) -> Dict:
    """Analyze job-candidate matching overview."""
    total_jobs = len(jobs)
    total_candidates = len(candidates)
    
    # Average match potential (based on skill overlap)
    from skill_extractor import extract_skills
    
    match_potentials = []
    for job in jobs:
        job_skills = extract_skills(f"{job.get('title', '')} {job.get('description', '')}")
        for resume in resumes:
            candidate_skills = resume.get("extractedSkills", [])
            if job_skills and candidate_skills:
                matched = sum(1 for s in job_skills if s.lower() in [c.lower() for c in candidate_skills])
                match_pct = round((matched / len(job_skills)) * 100, 1)
                match_potentials.append(match_pct)
    
    avg_match = round(sum(match_potentials) / len(match_potentials), 1) if match_potentials else 0
    
    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "average_match_potential": avg_match,
        "jobs_with_candidates": min(total_jobs, total_candidates),
        "candidates_per_job": round(total_candidates / total_jobs, 1) if total_jobs > 0 else 0,
    }


def _calculate_funnel_metrics(candidates: List[Dict], resumes: List[Dict]) -> Dict:
    """Calculate hiring funnel metrics."""
    total_candidates = len(candidates)
    
    # Candidates with resumes
    candidates_with_resumes = sum(1 for c in candidates if any(
        r.get("userId") == c.get("_id") for r in resumes
    ))
    
    # Candidates with high ATS scores
    high_ats_candidates = sum(1 for r in resumes if r.get("atsScore", 0) >= 70)
    
    return {
        "total_candidates": total_candidates,
        "candidates_with_resumes": candidates_with_resumes,
        "resume_upload_rate": round(
            (candidates_with_resumes / total_candidates * 100), 1
        ) if total_candidates > 0 else 0,
        "high_ats_candidates": high_ats_candidates,
        "high_ats_rate": round(
            (high_ats_candidates / total_candidates * 100), 1
        ) if total_candidates > 0 else 0,
    }


def _generate_hiring_insights(
    candidate_analysis: Dict,
    skill_trends: Dict,
    matching_overview: Dict,
    funnel_metrics: Dict,
) -> List[Dict]:
    """Generate actionable hiring insights."""
    insights = []
    
    # Candidate pool insights
    avg_ats = candidate_analysis.get("average_ats_score", 0)
    if avg_ats >= 70:
        insights.append({
            "type": "positive",
            "category": "candidate_quality",
            "message": f"Strong candidate pool with average ATS score of {avg_ats}%",
            "action": "Consider scheduling interviews with top candidates",
        })
    elif avg_ats < 50:
        insights.append({
            "type": "warning",
            "category": "candidate_quality",
            "message": f"Candidate pool has low average ATS score of {avg_ats}%",
            "action": "Consider expanding recruitment reach or updating job requirements",
        })
    
    # Skill gap insights
    in_demand = skill_trends.get("in_demand_skills", [])
    if in_demand:
        top_gap = in_demand[0]
        insights.append({
            "type": "info",
            "category": "skill_gaps",
            "message": f"Highest skill gap: {top_gap['skill']} (demand: {top_gap['demand']}, supply: {top_gap['supply']})",
            "action": f"Consider offering training for {top_gap['skill']} or adjusting job requirements",
        })
    
    # Matching insights
    avg_match = matching_overview.get("average_match_potential", 0)
    if avg_match < 40:
        insights.append({
            "type": "warning",
            "category": "matching",
            "message": f"Low average match potential ({avg_match}%) between candidates and jobs",
            "action": "Review job descriptions or candidate screening criteria",
        })
    
    # Funnel insights
    upload_rate = funnel_metrics.get("resume_upload_rate", 0)
    if upload_rate < 50:
        insights.append({
            "type": "warning",
            "category": "funnel",
            "message": f"Low resume upload rate ({upload_rate}%)",
            "action": "Send reminders to candidates to upload their resumes",
        })
    
    return insights
