"""
Resume Suggestions Service

WHY THIS FILE:
Provides detailed resume improvement suggestions including missing keywords,
weak points identification, and formatting recommendations.

WHY THIS APPROACH:
- Actionable suggestions for resume improvement
- Keyword optimization for ATS systems
- Formatting recommendations for better readability
- Weak point identification with specific fixes
"""

import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


def generate_resume_suggestions(
    resume_text: str,
    job_description: Optional[str] = None,
) -> Dict:
    """
    Generate comprehensive resume improvement suggestions.
    
    Args:
        resume_text: Resume text to analyze
        job_description: Optional job description for targeted suggestions
        
    Returns:
        Dict with suggestions categorized by type
    """
    if not resume_text or not resume_text.strip():
        return {
            "missing_keywords": [],
            "weak_points": [],
            "formatting_issues": [],
            "content_suggestions": [],
            "overall_score": 0,
            "priority_actions": [],
        }
    
    # Extract skills from resume
    from skill_extractor import extract_skills
    resume_skills = extract_skills(resume_text)
    
    # Extract job requirements if provided
    job_skills = []
    if job_description:
        job_skills = extract_skills(job_description)
    
    # Generate suggestions by category
    missing_keywords = _find_missing_keywords(resume_text, resume_skills, job_skills)
    weak_points = _identify_weak_points(resume_text, resume_skills)
    formatting_issues = _check_formatting(resume_text)
    content_suggestions = _generate_content_suggestions(resume_text, resume_skills)
    
    # Calculate overall score
    overall_score = _calculate_suggestion_score(
        missing_keywords, weak_points, formatting_issues, content_suggestions
    )
    
    # Generate priority actions
    priority_actions = _generate_priority_actions(
        missing_keywords, weak_points, formatting_issues, content_suggestions
    )
    
    return {
        "missing_keywords": missing_keywords,
        "weak_points": weak_points,
        "formatting_issues": formatting_issues,
        "content_suggestions": content_suggestions,
        "overall_score": overall_score,
        "priority_actions": priority_actions,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
    }


def _find_missing_keywords(
    resume_text: str,
    resume_skills: List[str],
    job_skills: List[str],
) -> List[Dict]:
    """Find missing keywords that should be in the resume."""
    missing = []
    resume_lower = resume_text.lower()
    
    # Check for missing job-specific skills
    for skill in job_skills:
        if skill.lower() not in [s.lower() for s in resume_skills]:
            missing.append({
                "keyword": skill,
                "type": "skill",
                "importance": "high",
                "reason": f"Required skill not found in resume",
                "suggestion": f"Add '{skill}' to your skills section or experience",
            })
    
    # Check for common ATS keywords
    ats_keywords = [
        "experience", "skills", "education", "projects", "achievements",
        "certifications", "summary", "objective", "contact",
    ]
    
    for keyword in ats_keywords:
        if keyword not in resume_lower:
            missing.append({
                "keyword": keyword,
                "type": "section",
                "importance": "medium",
                "reason": f"Missing '{keyword}' section",
                "suggestion": f"Add a '{keyword.title()}' section to your resume",
            })
    
    # Check for action verbs
    action_verbs = [
        "developed", "implemented", "designed", "built", "created",
        "managed", "led", "improved", "optimized", "delivered",
    ]
    
    has_action_verbs = any(verb in resume_lower for verb in action_verbs)
    if not has_action_verbs:
        missing.append({
            "keyword": "action verbs",
            "type": "language",
            "importance": "high",
            "reason": "No action verbs found in experience descriptions",
            "suggestion": "Start bullet points with action verbs like 'Developed', 'Implemented', 'Led'",
        })
    
    return missing[:15]  # Limit to top 15


def _identify_weak_points(resume_text: str, skills: List[str]) -> List[Dict]:
    """Identify weak points in the resume."""
    weak_points = []
    resume_lower = resume_text.lower()
    word_count = len(resume_text.split())
    
    # Check for quantifiable achievements
    quant_patterns = [
        r'\d+%', r'\d+x', r'increased', r'decreased', r'reduced',
        r'improved', r'generated', r'saved', r'\$\d+',
    ]
    
    quant_count = sum(1 for p in quant_patterns if re.search(p, resume_lower))
    if quant_count < 3:
        weak_points.append({
            "area": "quantifiable achievements",
            "severity": "high",
            "issue": f"Only {quant_count} quantifiable achievement(s) found",
            "fix": "Add metrics like 'Increased sales by 20%' or 'Reduced load time by 50%'",
        })
    
    # Check for length
    if word_count < 300:
        weak_points.append({
            "area": "content length",
            "severity": "medium",
            "issue": f"Resume is too short ({word_count} words)",
            "fix": "Expand experience and project descriptions to 400-800 words",
        })
    elif word_count > 1000:
        weak_points.append({
            "area": "content length",
            "severity": "medium",
            "issue": f"Resume is too long ({word_count} words)",
            "fix": "Condense to focus on most relevant experience (400-800 words)",
        })
    
    # Check for skills depth
    if len(skills) < 8:
        weak_points.append({
            "area": "skill coverage",
            "severity": "high",
            "issue": f"Only {len(skills)} skills detected",
            "fix": "Add more relevant technical and soft skills (aim for 10-15+)",
        })
    
    # Check for project descriptions
    project_indicators = ['built', 'developed', 'created', 'designed', 'implemented']
    has_project_verbs = any(verb in resume_lower for verb in project_indicators)
    if not has_project_verbs:
        weak_points.append({
            "area": "project descriptions",
            "severity": "medium",
            "issue": "No project-related action verbs found",
            "fix": "Use verbs like 'Built', 'Developed', 'Designed' in project descriptions",
        })
    
    return weak_points


def _check_formatting(resume_text: str) -> List[Dict]:
    """Check formatting issues in the resume."""
    issues = []
    
    # Check for bullet points
    if not re.search(r'[•\-*\d.]\s+', resume_text):
        issues.append({
            "issue": "No bullet points found",
            "severity": "medium",
            "fix": "Use bullet points (•, -, *) to structure achievements",
        })
    
    # Check for section headers
    sections = ['experience', 'education', 'skills', 'projects']
    found_sections = sum(1 for s in sections if s in resume_text.lower())
    if found_sections < 3:
        issues.append({
            "issue": f"Only {found_sections} standard sections found",
            "severity": "medium",
            "fix": "Add clear section headers: Experience, Education, Skills, Projects",
        })
    
    # Check for contact info
    has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text))
    has_phone = bool(re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text))
    
    if not has_email:
        issues.append({
            "issue": "No email address found",
            "severity": "high",
            "fix": "Add your email address at the top of the resume",
        })
    
    if not has_phone:
        issues.append({
            "issue": "No phone number found",
            "severity": "medium",
            "fix": "Add your phone number in the contact section",
        })
    
    # Check for consistent formatting
    lines = resume_text.split('\n')
    if len(lines) < 10:
        issues.append({
            "issue": "Resume has very few lines",
            "severity": "low",
            "fix": "Use line breaks to separate sections and improve readability",
        })
    
    return issues


def _generate_content_suggestions(
    resume_text: str,
    skills: List[str],
) -> List[Dict]:
    """Generate content improvement suggestions."""
    suggestions = []
    resume_lower = resume_text.lower()
    
    # Check for summary/objective
    if not re.search(r'summary|objective|profile', resume_lower):
        suggestions.append({
            "type": "summary",
            "suggestion": "Add a professional summary at the top of your resume",
            "benefit": "Helps recruiters quickly understand your qualifications",
        })
    
    # Check for certifications
    if not re.search(r'certified|certification|certificate|credential', resume_lower):
        suggestions.append({
            "type": "certifications",
            "suggestion": "Consider adding relevant certifications",
            "benefit": "Certifications validate your skills and boost credibility",
        })
    
    # Check for GitHub/portfolio links
    if not re.search(r'github\.com|portfolio|linkedin', resume_lower):
        suggestions.append({
            "type": "links",
            "suggestion": "Add links to GitHub, portfolio, or LinkedIn profile",
            "benefit": "Provides proof of your work and technical abilities",
        })
    
    # Check for education details
    if not re.search(r'gpa|cgpa|university|college|degree', resume_lower):
        suggestions.append({
            "type": "education",
            "suggestion": "Add education details with GPA if 3.0+",
            "benefit": "Strong education section improves ATS scoring",
        })
    
    return suggestions


def _calculate_suggestion_score(
    missing_keywords: List[Dict],
    weak_points: List[Dict],
    formatting_issues: List[Dict],
    content_suggestions: List[Dict],
) -> int:
    """Calculate an overall suggestion score (0-100)."""
    score = 100
    
    # Deduct for missing keywords
    high_importance_missing = sum(1 for k in missing_keywords if k.get("importance") == "high")
    score -= min(high_importance_missing * 5, 30)
    
    # Deduct for weak points
    high_severity_weak = sum(1 for w in weak_points if w.get("severity") == "high")
    score -= min(high_severity_weak * 8, 30)
    
    # Deduct for formatting issues
    score -= min(len(formatting_issues) * 3, 20)
    
    # Deduct for content suggestions
    score -= min(len(content_suggestions) * 2, 20)
    
    return max(score, 0)


def _generate_priority_actions(
    missing_keywords: List[Dict],
    weak_points: List[Dict],
    formatting_issues: List[Dict],
    content_suggestions: List[Dict],
) -> List[Dict]:
    """Generate prioritized action items."""
    actions = []
    
    # High priority from missing keywords
    for kw in missing_keywords[:3]:
        if kw.get("importance") == "high":
            actions.append({
                "priority": "high",
                "action": kw.get("suggestion", ""),
                "reason": kw.get("reason", ""),
            })
    
    # High priority from weak points
    for wp in weak_points[:2]:
        if wp.get("severity") == "high":
            actions.append({
                "priority": "high",
                "action": wp.get("fix", ""),
                "reason": wp.get("issue", ""),
            })
    
    # Medium priority from formatting
    for fi in formatting_issues[:2]:
        if fi.get("severity") in ["high", "medium"]:
            actions.append({
                "priority": "medium",
                "action": fi.get("fix", ""),
                "reason": fi.get("issue", ""),
            })
    
    # Low priority from content suggestions
    for cs in content_suggestions[:2]:
        actions.append({
            "priority": "low",
            "action": cs.get("suggestion", ""),
            "reason": cs.get("benefit", ""),
        })
    
    return actions[:8]  # Limit to top 8 actions
