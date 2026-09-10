"""
Explainable AI Wrapper

WHY THIS FILE:
Ensures every AI response includes human-readable explanations.
Never returns just a score - always explains WHY.

WHY THIS APPROACH:
- Wraps all AI responses with explanation generation
- Consistent explanation format across all modules
- Helps recruiters and candidates understand AI decisions
- Builds trust in the AI system
"""

import logging
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)


def explain_ats_score(ats_result: Dict) -> Dict:
    """
    Add human-readable explanations to ATS score.
    
    Args:
        ats_result: Raw ATS result from ats_engine
        
    Returns:
        ATS result with added explanations
    """
    overall = ats_result.get("overall", 0)
    breakdown = ats_result.get("weighted_breakdown", {})
    
    explanations = []
    
    # Overall explanation
    if overall >= 85:
        explanations.append({
            "type": "positive",
            "message": f"Excellent ATS score of {overall}/100. Your resume is well-optimized for automated screening.",
            "detail": "Recruiters will see a well-structured resume that clearly presents your qualifications."
        })
    elif overall >= 70:
        explanations.append({
            "type": "positive",
            "message": f"Good ATS score of {overall}/100. Minor improvements can make it excellent.",
            "detail": "Focus on the areas with lower scores below to improve your resume's ATS compatibility."
        })
    elif overall >= 50:
        explanations.append({
            "type": "warning",
            "message": f"Moderate ATS score of {overall}/100. Several areas need attention.",
            "detail": "Your resume may be filtered out by some ATS systems. Review the suggestions below."
        })
    else:
        explanations.append({
            "type": "negative",
            "message": f"Low ATS score of {overall}/100. Significant improvements recommended.",
            "detail": "Your resume needs restructuring to pass ATS filters. Follow the suggestions carefully."
        })
    
    # Category explanations
    for category, data in breakdown.items():
        raw_score = data.get("raw_score", 0)
        weight = data.get("weight", 0)
        category_name = category.replace("_", " ").title()
        
        if raw_score >= 80:
            explanations.append({
                "type": "positive",
                "message": f"✅ {category_name}: Strong ({raw_score}/100, weighted {data.get('weighted_score', 0)}/{data.get('max_weighted', 0)})",
                "detail": f"This section contributes well to your overall score."
            })
        elif raw_score >= 60:
            explanations.append({
                "type": "info",
                "message": f"📊 {category_name}: Moderate ({raw_score}/100, weighted {data.get('weighted_score', 0)}/{data.get('max_weighted', 0)})",
                "detail": f"Improving this area would boost your overall score."
            })
        else:
            explanations.append({
                "type": "negative",
                "message": f"⚠️ {category_name}: Needs improvement ({raw_score}/100, weighted {data.get('weighted_score', 0)}/{data.get('max_weighted', 0)})",
                "detail": f"This is a weak area. See suggestions for improvement."
            })
    
    # Add detailed explanations from scoring
    for category, data in breakdown.items():
        for exp in data.get("explanations", []):
            explanations.append({
                "type": "detail",
                "message": exp,
                "category": category,
            })
    
    ats_result["explanations"] = explanations
    return ats_result


def explain_job_match(match_result: Dict) -> Dict:
    """
    Add human-readable explanations to job match result.
    
    Args:
        match_result: Raw match result from semantic_matcher
        
    Returns:
        Match result with added explanations
    """
    similarity = match_result.get("similarity_score", 0)
    analysis = match_result.get("analysis", {})
    
    explanations = []
    
    # Overall match explanation
    if similarity >= 80:
        explanations.append({
            "type": "positive",
            "message": f"Excellent match ({similarity}%). The candidate's profile strongly aligns with this role.",
            "detail": "Semantic analysis shows high overlap in skills, experience, and domain terminology."
        })
    elif similarity >= 65:
        explanations.append({
            "type": "positive",
            "message": f"Good match ({similarity}%). The candidate meets most requirements.",
            "detail": "Some areas of misalignment exist but overall profile is relevant."
        })
    elif similarity >= 45:
        explanations.append({
            "type": "warning",
            "message": f"Moderate match ({similarity}%). Some skills align but significant gaps exist.",
            "detail": "Consider if the candidate's transferable skills compensate for missing requirements."
        })
    else:
        explanations.append({
            "type": "negative",
            "message": f"Weak match ({similarity}%). The candidate lacks most required qualifications.",
            "detail": "Significant skill gaps and low semantic alignment with the job description."
        })
    
    # Skill match explanation
    matched = analysis.get("matched_skills", [])
    missing = analysis.get("missing_skills", [])
    
    if matched:
        explanations.append({
            "type": "positive",
            "message": f"✓ Matched skills ({len(matched)}): {', '.join(matched[:5])}",
            "detail": "These skills directly match the job requirements."
        })
    
    if missing:
        explanations.append({
            "type": "negative",
            "message": f"✗ Missing skills ({len(missing)}): {', '.join(missing[:5])}",
            "detail": "These required skills were not found in the candidate's profile."
        })
    
    # Method explanation
    method = match_result.get("method", "unknown")
    model_used = match_result.get("model_used", "unknown")
    explanations.append({
        "type": "info",
        "message": f"Analysis method: {method} (model: {model_used})",
        "detail": "Semantic matching uses AI to understand context beyond simple keywords."
    })
    
    match_result["explanations"] = explanations
    return match_result


def explain_skill_gap(gap_result: Dict) -> Dict:
    """
    Add human-readable explanations to skill gap analysis.
    
    Args:
        gap_result: Raw skill gap result
        
    Returns:
        Gap result with added explanations
    """
    explanations = []
    
    match_pct = gap_result.get("match_percentage", 0)
    matched = gap_result.get("matched", [])
    missing = gap_result.get("missing", [])
    
    if match_pct >= 80:
        explanations.append({
            "type": "positive",
            "message": f"Strong skill match ({match_pct}%). The candidate has most required skills.",
            "detail": f"Only {len(missing)} skill(s) need to be developed."
        })
    elif match_pct >= 60:
        explanations.append({
            "type": "info",
            "message": f"Good skill match ({match_pct}%). Some skills need development.",
            "detail": f"Focus on learning the {len(missing)} missing skills to become a strong candidate."
        })
    elif match_pct >= 40:
        explanations.append({
            "type": "warning",
            "message": f"Moderate skill match ({match_pct}%). Significant skill gaps exist.",
            "detail": f"Consider upskilling in {len(missing)} areas to improve job prospects."
        })
    else:
        explanations.append({
            "type": "negative",
            "message": f"Low skill match ({match_pct}%). Major skill gaps identified.",
            "detail": f"A comprehensive learning plan is needed to acquire the {len(missing)} missing skills."
        })
    
    # Roadmap explanation
    roadmap = gap_result.get("roadmap", [])
    if roadmap:
        explanations.append({
            "type": "info",
            "message": f"Learning roadmap created with {len(roadmap)} steps.",
            "detail": "Follow the roadmap in order: beginner skills first, then intermediate, then advanced."
        })
    
    gap_result["explanations"] = explanations
    return gap_result


def explain_ranking(rankings: List[Dict]) -> List[Dict]:
    """
    Add human-readable explanations to candidate rankings.
    
    Args:
        rankings: List of ranked candidates
        
    Returns:
        Rankings with added explanations for each candidate
    """
    for i, candidate in enumerate(rankings):
        score = candidate.get("score", 0)
        matched = candidate.get("matchedSkills", [])
        missing = candidate.get("missingSkills", [])
        
        explanations = []
        
        # Position explanation
        position = i + 1
        if position == 1:
            explanations.append(f"Top candidate with score {score}/100")
        elif position <= 3:
            explanations.append(f"Strong candidate ranked #{position} with score {score}/100")
        else:
            explanations.append(f"Candidate ranked #{position} with score {score}/100")
        
        # Skill explanation
        if matched:
            explanations.append(f"Has {len(matched)} matching skills: {', '.join(matched[:5])}")
        if missing:
            explanations.append(f"Missing {len(missing)} required skills: {', '.join(missing[:5])}")
        
        # Recommendation
        if score >= 80:
            explanations.append("Recommendation: Strong candidate - schedule interview")
        elif score >= 60:
            explanations.append("Recommendation: Consider for interview")
        elif score >= 40:
            explanations.append("Recommendation: Review skill gaps before proceeding")
        else:
            explanations.append("Recommendation: Low match - consider other candidates")
        
        candidate["explanations"] = explanations
    
    return rankings


def explain_career_insights(insights: Dict) -> Dict:
    """
    Add human-readable explanations to career insights.
    
    Args:
        insights: Raw career insights result
        
    Returns:
        Insights with added explanations
    """
    explanations = []
    
    roles = insights.get("recommended_roles", [])
    skills_to_develop = insights.get("skills_to_develop", [])
    progression = insights.get("career_progression", [])
    
    if roles:
        top_role = roles[0]
        explanations.append({
            "type": "positive",
            "message": f"Best matching role: {top_role.get('role', 'N/A')} ({top_role.get('match_percentage', 0)}% match)",
            "detail": "This role aligns best with your current skill set."
        })
    
    if skills_to_develop:
        explanations.append({
            "type": "info",
            "message": f"Recommended skills to develop: {len(skills_to_develop)} identified",
            "detail": "These skills will improve your career prospects and open new opportunities."
        })
    
    if progression:
        explanations.append({
            "type": "info",
            "message": f"Career progression: {len(progression)} steps identified",
            "detail": "Follow these steps to advance in your career path."
        })
    
    insights["explanations"] = explanations
    return insights


def explain_resume_suggestions(suggestions: Dict) -> Dict:
    """
    Add human-readable explanations to resume suggestions.
    
    Args:
        suggestions: Raw resume suggestions result
        
    Returns:
        Suggestions with added explanations
    """
    explanations = []
    
    for category, items in suggestions.items():
        if items and category != "explanations":
            explanations.append({
                "type": "info",
                "message": f"{category.replace('_', ' ').title()}: {len(items)} suggestion(s)",
                "detail": f"Review the {len(items)} suggestions in this category."
            })
    
    suggestions["explanations"] = explanations
    return suggestions