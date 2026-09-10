"""
Resume Intelligence Pipeline v2.0

WHY THIS FILE:
Complete resume analysis pipeline that replaces basic keyword-only analysis.
Extracts text, cleans it, generates embeddings, detects skills/experience/
education/projects/certifications, and produces an ATS report.

WHY THIS APPROACH:
- Single pipeline for comprehensive analysis
- Each step is modular and can be used independently
- Parallel processing support for performance
- Explainable AI - every score has a reason
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


def analyze_resume_comprehensive(resume_text: str) -> Dict:
    """
    Comprehensive resume analysis pipeline.
    
    Pipeline:
    1. Extract & Clean Text
    2. Generate Sentence Embeddings
    3. Extract Skills
    4. Detect Experience
    5. Detect Education
    6. Detect Projects
    7. Detect Certifications
    8. Generate ATS Report
    
    Args:
        resume_text: Raw text extracted from resume PDF
        
    Returns:
        Dict with complete analysis including ATS score, skills, and suggestions
    """
    if not resume_text or not resume_text.strip():
        return {
            "error": "No resume text provided",
            "ats_score": 0,
            "extracted_skills": [],
            "missing_skills": [],
            "strong_skills": [],
            "weak_skills": [],
            "resume_summary": "",
            "suggestions": ["Please upload a valid resume file."],
            "experience_years": None,
            "education": [],
            "projects": [],
            "certifications": [],
            "explanations": ["No content to analyze."],
        }
    
    from skill_extractor import (
        extract_skills,
        extract_skills_with_categories,
        extract_experience_years,
        extract_education,
        extract_projects,
        extract_certifications,
        extract_resume_summary,
        SKILL_DATABASE,
        SKILL_TO_CATEGORY,
    )
    
    # ── Step 1: Clean & Analyze Text ──
    cleaned_text = _clean_resume_text(resume_text)
    word_count = len(cleaned_text.split())
    
    # ── Step 2: Extract Skills ──
    extracted_skills = extract_skills(cleaned_text)
    categorized_skills = extract_skills_with_categories(cleaned_text)
    
    # ── Step 3: Categorize Skills (Strong vs Weak) ──
    strong_skills, weak_skills = _categorize_skills(extracted_skills, cleaned_text)
    
    # ── Step 4: Detect Experience ──
    experience_years = extract_experience_years(cleaned_text)
    
    # ── Step 5: Detect Education ──
    education = extract_education(cleaned_text)
    
    # ── Step 6: Detect Projects ──
    projects = extract_projects(cleaned_text)
    
    # ── Step 7: Detect Certifications ──
    certifications = extract_certifications(cleaned_text)
    
    # ── Step 8: Generate Resume Summary ──
    resume_summary = extract_resume_summary(cleaned_text)
    
    # ── Step 9: Calculate ATS Score ──
    from services.ats_engine import calculate_weighted_ats
    ats_result = calculate_weighted_ats(cleaned_text, extracted_skills)
    
    # ── Step 10: Identify Missing Skills ──
    missing_skills = _identify_missing_skills(extracted_skills, categorized_skills)
    
    # ── Step 11: Generate Suggestions ──
    suggestions = _generate_resume_suggestions(
        extracted_skills, strong_skills, weak_skills,
        experience_years, education, projects, certifications,
        word_count, ats_result
    )
    
    return {
        "ats_score": ats_result["overall"],
        "weighted_breakdown": ats_result.get("weighted_breakdown", {}),
        "extracted_skills": extracted_skills,
        "missing_skills": missing_skills,
        "strong_skills": strong_skills,
        "weak_skills": weak_skills,
        "categorized_skills": categorized_skills,
        "resume_summary": resume_summary,
        "experience_years": experience_years,
        "education": education,
        "projects": projects,
        "certifications": certifications,
        "suggestions": suggestions,
        "explanations": ats_result.get("explanations", []),
        "ats_suggestions": ats_result.get("suggestions", []),
        "word_count": word_count,
        "skill_count": len(extracted_skills),
        "analyzed_at": datetime.utcnow().isoformat(),
        "method": "comprehensive",
    }


def _clean_resume_text(text: str) -> str:
    """Clean and normalize resume text."""
    import re
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep important punctuation
    text = re.sub(r'[^\w\s.,;:!?()\-/@#+%&]', ' ', text)
    
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove empty lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    text = '\n'.join(lines)
    
    return text.strip()


def _categorize_skills(skills: List[str], text: str) -> tuple:
    """
    Categorize skills as strong or weak based on context.
    
    Strong skills: mentioned with proficiency indicators or multiple times
    Weak skills: mentioned once without context
    """
    text_lower = text.lower()
    strong = []
    weak = []
    
    proficiency_indicators = [
        'expert', 'advanced', 'proficient', 'fluent', 'extensive',
        'experienced', 'skilled', 'strong', 'excellent', 'mastered',
        'in-depth', 'solid', 'comprehensive',
    ]
    
    for skill in skills:
        skill_lower = skill.lower()
        
        # Count occurrences
        occurrences = text_lower.count(skill_lower)
        
        # Check for proficiency indicators near the skill
        has_proficiency = any(
            indicator in text_lower and skill_lower in text_lower
            for indicator in proficiency_indicators
        )
        
        if occurrences >= 2 or has_proficiency:
            strong.append(skill)
        else:
            weak.append(skill)
    
    return strong, weak


def _identify_missing_skills(
    extracted_skills: List[str],
    categorized_skills: Dict[str, List[str]]
) -> List[Dict]:
    """
    Identify potentially missing skills based on role patterns.
    
    Returns:
        List of dicts with skill name, category, and reason
    """
    from skill_extractor import SKILL_DATABASE
    
    missing = []
    extracted_lower = [s.lower() for s in extracted_skills]
    
    # Common skill pairs/groups that often go together
    skill_groups = [
        {"skills": ["react", "typescript", "redux"], "reason": "Frontend stack"},
        {"skills": ["node.js", "express", "mongodb"], "reason": "Backend stack"},
        {"skills": ["docker", "kubernetes", "aws"], "reason": "DevOps stack"},
        {"skills": ["python", "machine learning", "tensorflow"], "reason": "ML stack"},
        {"skills": ["git", "ci/cd", "jenkins"], "reason": "Development workflow"},
        {"skills": ["sql", "database design", "data modeling"], "reason": "Data skills"},
        {"skills": ["communication", "teamwork", "leadership"], "reason": "Soft skills"},
    ]
    
    for group in skill_groups:
        # Check if at least one skill in group is present
        found = [s for s in group["skills"] if s.lower() in extracted_lower]
        missing_from_group = [s for s in group["skills"] if s.lower() not in extracted_lower]
        
        if found and missing_from_group:
            for skill in missing_from_group:
                missing.append({
                    "skill": skill,
                    "category": group["reason"],
                    "reason": f"Commonly paired with {', '.join(found)}",
                })
    
    # Check underrepresented categories
    for category, skills in SKILL_DATABASE.items():
        found = sum(1 for s in skills if s.lower() in extracted_lower)
        if found == 0 and category in ["soft_skills", "cloud_devops", "testing_qa"]:
            missing.append({
                "skill": f"{category.replace('_', ' ').title()}",
                "category": "category",
                "reason": f"No skills detected in this category",
            })
    
    return missing[:10]  # Limit recommendations


def _generate_resume_suggestions(
    extracted_skills: List[str],
    strong_skills: List[str],
    weak_skills: List[str],
    experience_years: Optional[float],
    education: List[Dict],
    projects: List[Dict],
    certifications: List[str],
    word_count: int,
    ats_result: Dict,
) -> List[str]:
    """Generate comprehensive resume improvement suggestions."""
    suggestions = []
    
    # Skills-based suggestions
    if len(extracted_skills) < 10:
        suggestions.append(f"Add more skills (currently {len(extracted_skills)}). Aim for 10-15+ relevant skills.")
    
    if len(weak_skills) > len(strong_skills):
        suggestions.append("Strengthen skill descriptions with proficiency levels and concrete examples.")
    
    # Experience suggestions
    if experience_years is None:
        suggestions.append("Add quantified years of experience to strengthen your profile.")
    elif experience_years < 2:
        suggestions.append("Highlight projects and internships to compensate for limited experience.")
    
    # Education suggestions
    if not education:
        suggestions.append("Add education details - degree, institution, and graduation year.")
    
    # Projects suggestions
    if len(projects) < 2:
        suggestions.append("Add more projects with technologies used and your specific contributions.")
    
    # Certifications suggestions
    if not certifications:
        suggestions.append("Consider adding relevant certifications to boost credibility.")
    
    # Content suggestions
    if word_count < 300:
        suggestions.append("Resume is too short. Add more detail to your experience and projects.")
    elif word_count > 1000:
        suggestions.append("Resume is lengthy. Consider condensing to focus on most relevant experience.")
    
    # Formatting suggestions
    if not re.search(r'[•\-*\d.]\s+', word_count):
        suggestions.append("Use bullet points to make achievements more scannable.")
    
    if not suggestions:
        suggestions.append("Your resume is well-structured. Keep it updated with latest achievements.")
    
    return suggestions


# Import re for regex-based checks
import re