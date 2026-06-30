"""
Advanced ATS scoring service with breakdown fields and suggestions.

WHY THIS FILE:
Provides detailed ATS (Applicant Tracking System) scoring with breakdown
by category (keywords, format, education, experience, skills) and actionable
suggestions for improvement.

WHY THIS APPROACH:
- Deterministic scoring based on resume content analysis
- Breakdown by category helps candidates understand weak areas
- Suggestions are actionable and specific
- Overall score is meaningful and reproducible

ALTERNATIVES CONSIDERED:
- ML-based scoring: requires training data, less transparent
- Third-party ATS API: adds cost, latency, and dependency
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def calculate_ats_score(resume_text: str, skills: list[str]) -> dict:
    """
    Calculate comprehensive ATS score with breakdown and suggestions.

    Args:
        resume_text: Raw text extracted from resume
        skills: List of extracted skills from the resume

    Returns:
        Dict with:
        - overall: Overall ATS score (0-100)
        - breakdown: Dict with category scores
        - suggestions: List of actionable improvement suggestions
        - keyword_density: Keyword density metrics
    """
    text_lower = resume_text.lower()
    word_count = len(resume_text.split())
    char_count = len(resume_text)

    # ──────────────────────────────────────────────────────────────────────────
    # 1. Keyword Score (0-30 points)
    # ──────────────────────────────────────────────────────────────────────────
    keyword_score = _calculate_keyword_score(text_lower, skills, word_count)

    # ──────────────────────────────────────────────────────────────────────────
    # 2. Format Score (0-20 points)
    # ──────────────────────────────────────────────────────────────────────────
    format_score = _calculate_format_score(resume_text, word_count)

    # ──────────────────────────────────────────────────────────────────────────
    # 3. Education Score (0-20 points)
    # ──────────────────────────────────────────────────────────────────────────
    education_score = _calculate_education_score(text_lower)

    # ──────────────────────────────────────────────────────────────────────────
    # 4. Experience Score (0-20 points)
    # ──────────────────────────────────────────────────────────────────────────
    experience_score = _calculate_experience_score(text_lower)

    # ──────────────────────────────────────────────────────────────────────────
    # 5. Skills Score (0-10 points)
    # ──────────────────────────────────────────────────────────────────────────
    skills_score = _calculate_skills_score(skills)

    # ──────────────────────────────────────────────────────────────────────────
    # Overall Score
    # ──────────────────────────────────────────────────────────────────────────
    overall = min(keyword_score + format_score + education_score + experience_score + skills_score, 100)

    # ──────────────────────────────────────────────────────────────────────────
    # Suggestions
    # ──────────────────────────────────────────────────────────────────────────
    suggestions = _generate_suggestions(
        keyword_score, format_score, education_score,
        experience_score, skills_score, skills, word_count, text_lower
    )

    return {
        "overall": overall,
        "breakdown": {
            "keywords": keyword_score,
            "format": format_score,
            "education": education_score,
            "experience": experience_score,
            "skills": skills_score,
        },
        "suggestions": suggestions,
        "metrics": {
            "word_count": word_count,
            "char_count": char_count,
            "skill_count": len(skills),
        },
    }


def _calculate_keyword_score(text: str, skills: list[str], word_count: int) -> int:
    """
    Calculate keyword density and relevance score (0-30).

    Factors:
    - Number of skills found (up to 15 points)
    - Keyword density relative to document length (up to 10 points)
    - Presence of industry buzzwords (up to 5 points)
    """
    score = 0

    # Points for skills found
    skill_points = min(len(skills) * 3, 15)
    score += skill_points

    # Points for keyword density (skills per 100 words)
    if word_count > 0:
        density = (len(skills) / word_count) * 100
        if 2 <= density <= 8:
            score += 10  # Ideal density
        elif density > 0:
            score += 5   # Some density

    # Points for industry buzzwords
    buzzwords = [
        'team', 'leadership', 'communication', 'problem-solving',
        'analytical', 'collaboration', 'agile', 'scrum',
        'results-driven', 'cross-functional', 'stakeholder',
        'strategic', 'innovation', 'optimization', 'scalable',
    ]
    buzzword_count = sum(1 for bw in buzzwords if bw in text)
    score += min(buzzword_count, 5)

    return min(score, 30)


def _calculate_format_score(text: str, word_count: int) -> int:
    """
    Calculate format and structure score (0-20).

    Factors:
    - Appropriate length (300-800 words: 5 points)
    - Has email (3 points)
    - Has phone (3 points)
    - Has section headers (up to 5 points)
    - Has bullet points or structured lists (4 points)
    """
    score = 0
    text_lower = text.lower()

    # Length check
    if 300 <= word_count <= 800:
        score += 5
    elif word_count > 100:
        score += 3

    # Contact info
    if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
        score += 3
    if re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text):
        score += 3

    # Section headers
    sections_found = 0
    section_patterns = [
        r'experience', r'education', r'skills', r'projects',
        r'certifications?', r'achievements?', r'summary', r'objective',
    ]
    for pattern in section_patterns:
        if re.search(pattern, text_lower):
            sections_found += 1
    score += min(sections_found, 5)

    # Bullet points or structured lists
    if re.search(r'[•\-*\d.]\s+', text):
        score += 4

    return min(score, 20)


def _calculate_education_score(text: str) -> int:
    """
    Calculate education section score (0-20).

    Factors:
    - Has education section (5 points)
    - Has degree mentioned (5 points)
    - Has institution name (5 points)
    - Has graduation year (5 points)
    """
    score = 0

    # Education section
    if re.search(r'education|academic|qualifications', text):
        score += 5

    # Degree types
    degree_patterns = [
        r'bachelor', r'master', r'ph\.?d', r'doctorate',
        r'b\.?s\.?c', r'm\.?s\.?c', r'b\.?a\.?', r'm\.?b\.?a\.?',
        r'b\.?tech', r'm\.?tech', r'associate', r'diploma',
        r'high school', r'secondary',
    ]
    for pattern in degree_patterns:
        if re.search(pattern, text):
            score += 5
            break

    # Institution
    institution_patterns = [
        r'university', r'college', r'institute', r'school',
        r'academy', r'polytechnic',
    ]
    for pattern in institution_patterns:
        if re.search(pattern, text):
            score += 5
            break

    # Year (graduation year)
    if re.search(r'(?:19|20)\d{2}', text):
        score += 5

    return min(score, 20)


def _calculate_experience_score(text: str) -> int:
    """
    Calculate experience section score (0-20).

    Factors:
    - Has experience section (5 points)
    - Has years of experience mentioned (5 points)
    - Has company names (5 points)
    - Has quantifiable achievements (5 points)
    """
    score = 0

    # Experience section
    if re.search(r'experience|employment|work history', text):
        score += 5

    # Years of experience
    year_patterns = [
        r'\d+\+?\s*years?\s*(?:of\s+)?experience',
        r'worked\s+(?:for|at)\s+\d+\+?\s*years?',
        r'\d{4}\s*[-–to]+\s*(?:present|current|\d{4})',
    ]
    for pattern in year_patterns:
        if re.search(pattern, text):
            score += 5
            break

    # Company names (look for common company indicators)
    company_patterns = [
        r'(?:at|for|with)\s+[A-Z][A-Za-z\s]+(?:inc|llc|ltd|corp|technologies|solutions|services|group)',
        r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*[-–|]\s*(?:software|engineer|developer|manager|analyst)',
    ]
    for pattern in company_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            score += 5
            break

    # Quantifiable achievements
    quantifiable_patterns = [
        r'\d+%', r'\d+x', r'increased', r'decreased', r'reduced',
        r'improved', r'generated', r'saved', r'managed', r'led',
        r'\$\s*\d+[kKmMbB]?', r'\d+\s*(?:users|customers|clients|projects|team members?)',
    ]
    quantifiable_count = sum(1 for p in quantifiable_patterns if re.search(p, text, re.IGNORECASE))
    if quantifiable_count >= 3:
        score += 5
    elif quantifiable_count >= 1:
        score += 3

    return min(score, 20)


def _calculate_skills_score(skills: list[str]) -> int:
    """
    Calculate skills section score (0-10).

    Factors:
    - Number of skills (up to 5 points)
    - Diversity of skills (up to 5 points)
    """
    score = 0

    # Number of skills
    if len(skills) >= 10:
        score += 5
    elif len(skills) >= 5:
        score += 3
    elif len(skills) >= 3:
        score += 1

    # Diversity (check for both technical and soft skills)
    technical_keywords = [
        'python', 'java', 'javascript', 'react', 'node', 'sql', 'mongodb',
        'aws', 'docker', 'git', 'api', 'html', 'css', 'typescript',
        'machine learning', 'data', 'cloud', 'devops',
    ]
    soft_skills = [
        'communication', 'teamwork', 'leadership', 'problem.solving',
        'time management', 'adaptability', 'creativity', 'collaboration',
    ]

    has_technical = any(s.lower() in technical_keywords for s in skills)
    has_soft = any(
        any(ss in s.lower() for ss in soft_skills)
        for s in skills
    )

    if has_technical and has_soft:
        score += 5
    elif has_technical or has_soft:
        score += 3

    return min(score, 10)


def _generate_suggestions(
    keyword_score: int, format_score: int, education_score: int,
    experience_score: int, skills_score: int, skills: list[str],
    word_count: int, text: str
) -> list[str]:
    """
    Generate actionable suggestions based on score breakdown.

    Returns a list of specific, actionable suggestions.
    """
    suggestions = []

    # Keyword suggestions
    if keyword_score < 20:
        if len(skills) < 5:
            suggestions.append("Add more relevant skills to your resume. Aim for at least 10 skills relevant to your target role.")
        suggestions.append("Include industry-specific keywords and buzzwords like 'agile', 'cross-functional', and 'stakeholder management'.")

    # Format suggestions
    if format_score < 12:
        if word_count < 300:
            suggestions.append("Your resume is too short. Aim for 300-800 words to provide sufficient detail about your experience.")
        elif word_count > 800:
            suggestions.append("Your resume is too long. Consider condensing to 300-800 words for better ATS parsing.")
        if not re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
            suggestions.append("Add your email address to the top of your resume.")
        if not re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text):
            suggestions.append("Add your phone number to the top of your resume.")
        suggestions.append("Use clear section headers (Experience, Education, Skills, Projects) to improve ATS parsing.")
        suggestions.append("Use bullet points to structure your achievements and responsibilities.")

    # Education suggestions
    if education_score < 10:
        suggestions.append("Add or expand your education section with degree, institution, and graduation year.")

    # Experience suggestions
    if experience_score < 10:
        suggestions.append("Add quantifiable achievements (e.g., 'Increased revenue by 20%', 'Managed team of 5').")
        suggestions.append("Include specific years of experience and company names.")

    # Skills suggestions
    if skills_score < 5:
        suggestions.append("Include a mix of technical skills and soft skills for a well-rounded profile.")

    # General suggestions
    if not suggestions:
        suggestions.append("Your resume is well-optimized for ATS. Keep it updated with your latest achievements.")

    return suggestions