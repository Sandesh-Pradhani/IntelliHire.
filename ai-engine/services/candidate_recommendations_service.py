"""
Candidate Job Recommendations Service

WHY THIS FILE:
Provides semantic job recommendations for candidates based on their
skills, experience, and career goals.

WHY THIS APPROACH:
- Semantic matching for accurate job-candidate fit
- Career-aligned recommendations
- Skill-based job suggestions
- Personalized recommendations
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


def generate_job_recommendations(
    candidate_skills: List[str],
    experience_years: Optional[float] = None,
    interests: Optional[List[str]] = None,
    jobs: Optional[List[Dict]] = None,
) -> Dict:
    """
    Generate personalized job recommendations for a candidate.
    
    Args:
        candidate_skills: List of candidate's skills
        experience_years: Years of experience
        interests: Areas of interest
        jobs: List of available jobs to recommend from
        
    Returns:
        Dict with recommended jobs, match scores, and career suggestions
    """
    if not candidate_skills:
        return {
            "recommended_jobs": [],
            "career_suggestions": [],
            "skill_development": [],
            "summary": "No skills provided for analysis",
        }
    
    # Score available jobs if provided
    recommended_jobs = []
    if jobs:
        recommended_jobs = _score_jobs_for_candidate(
            candidate_skills, experience_years, jobs
        )
    
    # Generate career suggestions
    career_suggestions = _generate_career_suggestions(
        candidate_skills, experience_years, interests
    )
    
    # Skill development recommendations
    skill_development = _recommend_skill_development(
        candidate_skills, experience_years
    )
    
    # Generate summary
    summary = _generate_recommendation_summary(
        recommended_jobs, career_suggestions, candidate_skills
    )
    
    return {
        "recommended_jobs": recommended_jobs[:10],  # Top 10 recommendations
        "career_suggestions": career_suggestions,
        "skill_development": skill_development,
        "summary": summary,
        "total_jobs_analyzed": len(jobs) if jobs else 0,
    }


def _score_jobs_for_candidate(
    candidate_skills: List[str],
    experience_years: Optional[float],
    jobs: List[Dict],
) -> List[Dict]:
    """Score and rank jobs for a candidate."""
    from skill_extractor import extract_skills
    
    scored_jobs = []
    
    for job in jobs:
        job_title = job.get("title", "")
        job_description = job.get("description", "")
        job_skills = job.get("requiredSkills", []) or extract_skills(f"{job_title} {job_description}")
        
        if not job_skills:
            continue
        
        # Calculate skill match
        candidate_lower = [s.lower() for s in candidate_skills]
        job_lower = [s.lower() for s in job_skills]
        
        matched = [s for s in job_skills if s.lower() in candidate_lower]
        missing = [s for s in job_skills if s.lower() not in candidate_lower]
        
        match_percentage = round((len(matched) / len(job_skills)) * 100, 1) if job_skills else 0
        
        # Calculate overall fit score
        fit_score = _calculate_fit_score(
            match_percentage, len(matched), len(missing), experience_years
        )
        
        # Generate match reasons
        reasons = _generate_match_reasons(matched, missing, match_percentage)
        
        scored_jobs.append({
            "job_id": job.get("_id", ""),
            "job_title": job_title,
            "company": job.get("company", ""),
            "location": job.get("location", ""),
            "fit_score": fit_score,
            "match_percentage": match_percentage,
            "matched_skills": matched,
            "missing_skills": missing,
            "reasons": reasons,
            "salary_range": job.get("salaryRange", ""),
            "job_type": job.get("jobType", ""),
        })
    
    # Sort by fit score
    scored_jobs.sort(key=lambda j: j["fit_score"], reverse=True)
    
    return scored_jobs


def _calculate_fit_score(
    match_percentage: float,
    matched_count: int,
    missing_count: int,
    experience_years: Optional[float],
) -> int:
    """Calculate overall fit score for a job."""
    # Base score from skill match
    base_score = match_percentage * 0.6
    
    # Experience bonus
    experience_bonus = 0
    if experience_years is not None:
        if experience_years >= 5:
            experience_bonus = 15
        elif experience_years >= 3:
            experience_bonus = 10
        elif experience_years >= 1:
            experience_bonus = 5
    
    # Skill count bonus
    skill_bonus = min(matched_count * 2, 15)
    
    # Gap penalty
    gap_penalty = min(missing_count * 3, 20)
    
    overall = base_score + experience_bonus + skill_bonus - gap_penalty
    return min(max(round(overall), 0), 100)


def _generate_match_reasons(
    matched: List[str],
    missing: List[str],
    match_percentage: float,
) -> List[str]:
    """Generate reasons for job match."""
    reasons = []
    
    if match_percentage >= 80:
        reasons.append("Excellent skill alignment with job requirements")
    elif match_percentage >= 60:
        reasons.append("Good skill match with most requirements met")
    elif match_percentage >= 40:
        reasons.append("Moderate match - some skills align well")
    else:
        reasons.append("Limited skill overlap - may need significant upskilling")
    
    if matched:
        reasons.append(f"Strong in: {', '.join(matched[:3])}")
    
    if missing:
        reasons.append(f"Needs development: {', '.join(missing[:3])}")
    
    return reasons


def _generate_career_suggestions(
    candidate_skills: List[str],
    experience_years: Optional[float],
    interests: Optional[List[str]],
) -> List[Dict]:
    """Generate career path suggestions."""
    suggestions = []
    
    # Determine career level
    if experience_years is None or experience_years < 2:
        level = "entry"
    elif experience_years < 5:
        level = "mid"
    else:
        level = "senior"
    
    # Skill-based role suggestions
    role_mapping = {
        "react": {"role": "Frontend Developer", "level": level},
        "nodejs": {"role": "Backend Developer", "level": level},
        "python": {"role": "Python Developer", "level": level},
        "java": {"role": "Java Developer", "level": level},
        "docker": {"role": "DevOps Engineer", "level": level},
        "machine learning": {"role": "ML Engineer", "level": level},
        "sql": {"role": "Data Analyst", "level": level},
    }
    
    for skill in candidate_skills:
        if skill.lower() in role_mapping:
            role_info = role_mapping[skill.lower()]
            suggestions.append({
                "role": f"{role_info['level'].title()} {role_info['role']}",
                "based_on_skill": skill,
                "match_strength": "strong" if skill.lower() in ["react", "python", "java"] else "moderate",
            })
    
    # Remove duplicates
    seen = set()
    unique_suggestions = []
    for s in suggestions:
        if s["role"] not in seen:
            seen.add(s["role"])
            unique_suggestions.append(s)
    
    return unique_suggestions[:5]


def _recommend_skill_development(
    candidate_skills: List[str],
    experience_years: Optional[float],
) -> List[Dict]:
    """Recommend skills to develop."""
    from services.skill_gap_service import SKILL_RELATIONSHIPS, SKILL_DIFFICULTY
    
    recommendations = []
    
    for skill in candidate_skills:
        related = SKILL_RELATIONSHIPS.get(skill.lower(), [])
        for rel in related:
            if rel.lower() not in [s.lower() for s in candidate_skills]:
                recommendations.append({
                    "skill": rel,
                    "based_on": skill,
                    "difficulty": SKILL_DIFFICULTY.get(rel.lower(), "unknown"),
                    "reason": f"Natural progression from {skill}",
                    "priority": "high" if rel.lower() in ["typescript", "docker", "aws"] else "medium",
                })
    
    # Remove duplicates
    seen = set()
    unique_recs = []
    for rec in recommendations:
        if rec["skill"].lower() not in seen:
            seen.add(rec["skill"].lower())
            unique_recs.append(rec)
    
    return unique_recs[:5]


def _generate_recommendation_summary(
    recommended_jobs: List[Dict],
    career_suggestions: List[Dict],
    candidate_skills: List[str],
) -> str:
    """Generate a summary of recommendations."""
    parts = []
    
    if recommended_jobs:
        top_job = recommended_jobs[0]
        parts.append(
            f"Found {len(recommended_jobs)} matching jobs. "
            f"Best match: {top_job.get('job_title', 'N/A')} "
            f"with {top_job.get('match_percentage', 0)}% skill alignment."
        )
    
    if career_suggestions:
        parts.append(
            f"Based on your {len(candidate_skills)} skills, "
            f"consider roles like: {', '.join([s['role'] for s in career_suggestions[:3]])}."
        )
    
    if not parts:
        return "Upload your resume to get personalized job recommendations."
    
    return " ".join(parts)
