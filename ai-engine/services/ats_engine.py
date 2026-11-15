"""
Weighted ATS Scoring Engine v2.0

WHY THIS FILE:
Replaces the basic ATS scoring with configurable weighted scoring.
Uses the weights from Sprint 4 spec:
- Experience: 20%
- Skills: 35% (highest weight)
- Projects: 15%
- Education: 10%
- Keywords: 10%
- Formatting: 10%

WHY THIS APPROACH:
- Configurable weights allow tuning for different job types
- Each section has detailed sub-scoring with explanations
- Output is explainable: shows exactly why each score was given
- Preserves backward compatibility with existing ats_scoring_service.py

ALTERNATIVES CONSIDERED:
- Keeping old flat scoring: not explainable, not weighted
- ML-based scoring: requires training data, less transparent
- Third-party ATS API: adds cost and latency
"""

import re
import logging
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


def calculate_weighted_ats(
    resume_text: str,
    skills: List[str],
    weights: Optional[Dict[str, float]] = None,
) -> Dict:
    """
    Calculate ATS score using configurable weighted formula.
    
    Args:
        resume_text: Raw text extracted from resume
        skills: Extracted skills from the resume
        weights: Dict of category weights (defaults to Sprint 4 spec)
        
    Returns:
        Dict with overall score, section scores with explanations, suggestions
    """
    if not resume_text or not resume_text.strip():
        return {
            "overall": 0,
            "weighted_breakdown": {},
            "explanations": [],
            "suggestions": ["No resume text provided for analysis."],
            "method": "weighted",
        }
    
    # Default weights from Sprint 4 spec
    default_weights = {
        "experience": 0.20,
        "skills": 0.35,
        "projects": 0.15,
        "education": 0.10,
        "keywords": 0.10,
        "formatting": 0.10,
    }
    
    if weights is None:
        weights = default_weights
    
    text_lower = resume_text.lower()
    word_count = len(resume_text.split())
    
    # ──────────────────────────────────────────────────────────────────────────
    # 1. Experience Score (0-100) - Weight: 20%
    # ──────────────────────────────────────────────────────────────────────────
    exp_result = _score_experience(text_lower, resume_text)
    
    # ──────────────────────────────────────────────────────────────────────────
    # 2. Skills Score (0-100) - Weight: 35%
    # ──────────────────────────────────────────────────────────────────────────
    skills_result = _score_skills(skills, text_lower)
    
    # ──────────────────────────────────────────────────────────────────────────
    # 3. Projects Score (0-100) - Weight: 15%
    # ──────────────────────────────────────────────────────────────────────────
    projects_result = _score_projects(text_lower)
    
    # ──────────────────────────────────────────────────────────────────────────
    # 4. Education Score (0-100) - Weight: 10%
    # ──────────────────────────────────────────────────────────────────────────
    edu_result = _score_education(text_lower)
    
    # ──────────────────────────────────────────────────────────────────────────
    # 5. Keywords Score (0-100) - Weight: 10%
    # ──────────────────────────────────────────────────────────────────────────
    keywords_result = _score_keywords(text_lower, skills, word_count)
    
    # ──────────────────────────────────────────────────────────────────────────
    # 6. Formatting Score (0-100) - Weight: 10%
    # ──────────────────────────────────────────────────────────────────────────
    formatting_result = _score_formatting(resume_text, word_count)
    
    # ──────────────────────────────────────────────────────────────────────────
    # Calculate Weighted Overall
    # ──────────────────────────────────────────────────────────────────────────
    weighted_scores = {}
    for category, result in [
        ("experience", exp_result),
        ("skills", skills_result),
        ("projects", projects_result),
        ("education", edu_result),
        ("keywords", keywords_result),
        ("formatting", formatting_result),
    ]:
        weight = weights.get(category, 0)
        weighted_scores[category] = {
            "raw_score": result["score"],
            "weight": weight,
            "weighted_score": round(result["score"] * weight, 2),
            "max_weighted": round(100 * weight, 2),
            "explanations": result["explanations"],
        }
    
    overall = sum(ws["weighted_score"] for ws in weighted_scores.values())
    overall = min(round(overall), 100)
    
    # ──────────────────────────────────────────────────────────────────────────
    # Generate Suggestions
    # ──────────────────────────────────────────────────────────────────────────
    suggestions = _generate_weighted_suggestions(
        exp_result["score"],
        skills_result["score"],
        projects_result["score"],
        edu_result["score"],
        keywords_result["score"],
        formatting_result["score"],
        skills,
        word_count,
    )
    
    # ──────────────────────────────────────────────────────────────────────────
    # Compile Explanations for Explainable AI
    # ──────────────────────────────────────────────────────────────────────────
    explanations = _compile_explanations(
        weighted_scores, overall, skills
    )
    
    return {
        "overall": overall,
        "weighted_breakdown": weighted_scores,
        "explanations": explanations,
        "suggestions": suggestions,
        "method": "weighted",
        "weights_used": weights,
        "metrics": {
            "word_count": word_count,
            "skill_count": len(skills),
        },
    }


def _score_experience(text_lower: str, text_original: str) -> Dict:
    """
    Score experience section quality (0-100).
    
    Checks for:
    - Experience section presence (20 pts)
    - Years of experience mentioned (20 pts)
    - Company names (15 pts)
    - Quantifiable achievements (25 pts)
    - Job titles/roles (20 pts)
    """
    score = 0
    explanations = []
    
    # Experience section presence
    if re.search(r'experience|employment|work history|professional experience', text_lower):
        score += 20
        explanations.append("✓ Experience section found")
    else:
        explanations.append("✗ No experience section detected")
    
    # Years of experience
    year_patterns = [
        r'\d+\+?\s*years?\s*(?:of\s+)?experience',
        r'worked\s+(?:for|at)\s+\d+\+?\s*years?',
        r'\d{4}\s*[-–to]+\s*(?:present|current|\d{4})',
        r'(\d+)\+?\s*years?\s+in',
    ]
    years_found = False
    for pattern in year_patterns:
        if re.search(pattern, text_lower):
            years_found = True
            break
    if years_found:
        score += 20
        explanations.append("✓ Years of experience quantified")
    else:
        explanations.append("✗ No quantified years of experience")
    
    # Company names
    company_patterns = [
        r'(?:at|for|with)\s+[A-Z][A-Za-z\s]+(?:inc|llc|ltd|corp|technologies|solutions|services|group)',
        r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*[-–|]\s*(?:software|engineer|developer|manager|analyst)',
    ]
    companies_found = 0
    for pattern in company_patterns:
        matches = re.findall(pattern, text_original)
        companies_found += len(matches)
    if companies_found >= 2:
        score += 15
        explanations.append(f"✓ {companies_found} company/organization references found")
    elif companies_found >= 1:
        score += 10
        explanations.append(f"✓ {companies_found} company reference found")
    else:
        explanations.append("✗ No company names detected")
    
    # Quantifiable achievements
    quant_patterns = [
        r'\d+%', r'\d+x', r'increased', r'decreased', r'reduced',
        r'improved', r'generated', r'saved', r'managed', r'led',
        r'\$\s*\d+[kKmMbB]?', r'\d+\s*(?:users|customers|clients|projects|team members?)',
    ]
    quant_count = sum(1 for p in quant_patterns if re.search(p, text_lower, re.IGNORECASE))
    if quant_count >= 4:
        score += 25
        explanations.append(f"✓ Strong quantifiable achievements ({quant_count} indicators)")
    elif quant_count >= 2:
        score += 15
        explanations.append(f"✓ Some quantifiable achievements ({quant_count} indicators)")
    elif quant_count >= 1:
        score += 10
        explanations.append("✓ At least one quantifiable achievement found")
    else:
        explanations.append("✗ No quantifiable achievements detected")
    
    # Job titles
    title_patterns = [
        r'(?:software|senior|lead|principal|junior|associate)\s*(?:engineer|developer|architect|manager)',
        r'(?:frontend|backend|full.?stack|data|devops|cloud|ml|ai)\s*(?:engineer|developer|scientist|architect)',
    ]
    titles_found = 0
    for pattern in title_patterns:
        matches = re.findall(pattern, text_lower)
        titles_found += len(matches)
    if titles_found >= 2:
        score += 20
        explanations.append(f"✓ {titles_found} job roles/titles identified")
    elif titles_found >= 1:
        score += 10
        explanations.append(f"✓ {titles_found} job role identified")
    
    return {"score": min(score, 100), "explanations": explanations}


def _score_skills(skills: List[str], text_lower: str) -> Dict:
    """
    Score skills section quality (0-100).
    
    Checks for:
    - Number of skills detected (25 pts)
    - Skills section present (15 pts)
    - Technical skill diversity (20 pts)
    - Soft skills present (15 pts)
    - Skill proficiency levels (15 pts)
    - Relevant certifications (10 pts)
    """
    score = 0
    explanations = []
    
    # Number of skills
    if len(skills) >= 15:
        score += 25
        explanations.append(f"✓ Excellent skill coverage ({len(skills)} skills)")
    elif len(skills) >= 10:
        score += 20
        explanations.append(f"✓ Good skill coverage ({len(skills)} skills)")
    elif len(skills) >= 5:
        score += 15
        explanations.append(f"✓ Basic skill coverage ({len(skills)} skills)")
    elif len(skills) >= 3:
        score += 10
        explanations.append(f"⚠ Limited skills ({len(skills)} skills)")
    else:
        explanations.append("✗ Very few skills detected")
    
    # Skills section present
    if re.search(r'(?:technical\s+)?skills?\s*:?', text_lower):
        score += 15
        explanations.append("✓ Dedicated skills section found")
    else:
        explanations.append("✗ No dedicated skills section")
    
    # Technical diversity
    tech_categories = [
        'programming_languages', 'web_technologies', 'backend_frameworks',
        'databases', 'cloud_devops', 'machine_learning_ai',
    ]
    from skill_extractor import extract_skills_with_categories
    categorized = extract_skills_with_categories(text_lower)
    active_categories = sum(1 for cat in tech_categories if categorized.get(cat, []))
    if active_categories >= 4:
        score += 20
        explanations.append(f"✓ Strong technical diversity across {active_categories} domains")
    elif active_categories >= 2:
        score += 10
        explanations.append(f"✓ Technical skills in {active_categories} domains")
    else:
        explanations.append("⚠ Limited technical diversity")
    
    # Soft skills
    soft_skills = [s for s in skills if s.lower() in [
        'communication', 'teamwork', 'leadership', 'problem solving',
        'time management', 'adaptability', 'creativity', 'collaboration'
    ]]
    if len(soft_skills) >= 3:
        score += 15
        explanations.append(f"✓ Strong soft skills ({len(soft_skills)} detected)")
    elif len(soft_skills) >= 1:
        score += 8
        explanations.append(f"✓ Soft skills present ({len(soft_skills)} detected)")
    else:
        explanations.append("✗ No soft skills detected")
    
    # Skill proficiency
    proficiency_patterns = [
        r'(?:proficient|expert|advanced)\s+in',
        r'(?:experienced|skilled|knowledgeable)\s+(?:in|with)',
        r'(?:working|good|solid)\s+knowledge',
        r'familiar\s+(?:with|in)',
    ]
    prof_count = sum(1 for p in proficiency_patterns if re.search(p, text_lower))
    if prof_count >= 2:
        score += 15
        explanations.append(f"✓ Skill proficiency levels indicated ({prof_count} mentions)")
    elif prof_count >= 1:
        score += 8
        explanations.append("✓ Some skill proficiency levels found")
    
    # Certifications
    if re.search(r'certified|certification|certificate|credential', text_lower):
        score += 10
        explanations.append("✓ Certifications or credentials found")
    
    return {"score": min(score, 100), "explanations": explanations}


def _score_projects(text_lower: str) -> Dict:
    """
    Score projects section quality (0-100).
    
    Checks for:
    - Projects section present (20 pts)
    - Number of projects (20 pts)
    - Technologies used in projects (25 pts)
    - Project descriptions (20 pts)
    - GitHub/portfolio links (15 pts)
    """
    score = 0
    explanations = []
    
    # Projects section
    if re.search(r'projects?\s*:?', text_lower):
        score += 20
        explanations.append("✓ Projects section found")
    else:
        explanations.append("✗ No projects section")
    
    # Number of projects (estimate from bullet points)
    project_bullets = len(re.findall(r'[•\-*\d.]+\s+[A-Z]', text_lower))
    if project_bullets >= 6:
        score += 20
        explanations.append(f"✓ Substantial project experience ({project_bullets} entries)")
    elif project_bullets >= 3:
        score += 15
        explanations.append(f"✓ Multiple projects ({project_bullets} entries)")
    elif project_bullets >= 1:
        score += 8
        explanations.append(f"✓ At least one project ({project_bullets} entries)")
    else:
        explanations.append("✗ No project entries detected")
    
    # Technologies in projects
    from skill_extractor import extract_skills
    tech_skills = extract_skills(text_lower)
    if len(tech_skills) >= 8:
        score += 25
        explanations.append(f"✓ Rich technology usage ({len(tech_skills)} technologies)")
    elif len(tech_skills) >= 5:
        score += 18
        explanations.append(f"✓ Good technology coverage ({len(tech_skills)} technologies)")
    elif len(tech_skills) >= 3:
        score += 10
        explanations.append(f"✓ Some technologies mentioned ({len(tech_skills)})")
    
    # GitHub links
    if re.search(r'github\.com|bitbucket\.org|gitlab\.com', text_lower):
        score += 15
        explanations.append("✓ GitHub/profile links found")
    
    # Project descriptions
    if re.search(r'(?:built|developed|created|designed|implemented|architected)', text_lower):
        score += 20
        explanations.append("✓ Action verbs used in project descriptions")
    
    return {"score": min(score, 100), "explanations": explanations}


def _score_education(text_lower: str) -> Dict:
    """
    Score education section quality (0-100).
    
    Checks for:
    - Education section present (20 pts)
    - Degree level (25 pts)
    - Institution name (20 pts)
    - Graduation year (15 pts)
    - GPA/Academic achievements (20 pts)
    """
    score = 0
    explanations = []
    
    # Education section
    if re.search(r'education|academic|qualifications?', text_lower):
        score += 20
        explanations.append("✓ Education section found")
    else:
        explanations.append("✗ No education section")
    
    # Degree level
    degree_levels = {
        'phd': 25, 'doctorate': 25,
        'master': 20, 'masters': 20, 'mba': 20,
        'bachelor': 15, 'bachelors': 15, 'b.tech': 15,
        'associate': 10, 'diploma': 10,
        'high school': 5,
    }
    highest_level = 0
    highest_name = ""
    for level_name, points in degree_levels.items():
        if level_name in text_lower and points > highest_level:
            highest_level = points
            highest_name = level_name
    if highest_level > 0:
        score += highest_level
        explanations.append(f"✓ Highest education: {highest_name.title()} ({highest_level} pts)")
    else:
        explanations.append("✗ No degree level specified")
    
    # Institution
    if re.search(r'university|college|institute|school|academy', text_lower):
        score += 20
        explanations.append("✓ Institution name found")
    else:
        explanations.append("✗ No institution name")
    
    # Graduation year
    if re.search(r'(?:19|20)\d{2}', text_lower):
        score += 15
        explanations.append("✓ Graduation year found")
    else:
        explanations.append("✗ No graduation year")
    
    # GPA/Achievements
    if re.search(r'gpa|cgpa|[34]\.\d{1,2}\s*(?:/|out of)\s*[45]', text_lower):
        score += 20
        explanations.append("✓ GPA/CGPA mentioned")
    elif re.search(r'honors?|dean|scholarship|distinction', text_lower):
        score += 15
        explanations.append("✓ Academic achievements mentioned")
    
    return {"score": min(score, 100), "explanations": explanations}


def _score_keywords(text_lower: str, skills: List[str], word_count: int) -> Dict:
    """
    Score keyword optimization (0-100).
    
    Checks for:
    - Skill-to-word density (30 pts)
    - Industry buzzwords (25 pts)
    - Role-specific keywords (25 pts)
    - Action verbs (20 pts)
    """
    score = 0
    explanations = []
    
    # Keyword density
    if word_count > 0:
        density = (len(skills) / word_count) * 100
        if 2 <= density <= 8:
            score += 30
            explanations.append(f"✓ Optimal keyword density ({density:.1f}%)")
        elif density > 8:
            score += 15
            explanations.append(f"⚠ High keyword density ({density:.1f}%) - might look keyword-stuffed")
        elif density > 0:
            score += 20
            explanations.append(f"✓ Some keyword presence ({density:.1f}%)")
        else:
            explanations.append("✗ No keywords detected")
    
    # Industry buzzwords
    buzzwords = [
        'agile', 'scrum', 'cloud', 'devops', 'microservices',
        'ci/cd', 'docker', 'kubernetes', 'api', 'rest',
        'machine learning', 'ai', 'data-driven', 'scalable',
        'high-performance', 'optimized', 'automated',
    ]
    buzzword_count = sum(1 for bw in buzzwords if bw in text_lower)
    if buzzword_count >= 5:
        score += 25
        explanations.append(f"✓ Strong industry buzzword usage ({buzzword_count})")
    elif buzzword_count >= 3:
        score += 15
        explanations.append(f"✓ Some industry buzzwords ({buzzword_count})")
    elif buzzword_count >= 1:
        score += 5
    else:
        explanations.append("✗ No industry buzzwords")
    
    # Role-specific keywords
    role_keywords = [
        'full stack', 'frontend', 'backend', 'software engineer',
        'software developer', 'web developer', 'data scientist',
        'devops engineer', 'cloud architect', 'ml engineer',
    ]
    role_count = sum(1 for rk in role_keywords if rk in text_lower)
    if role_count >= 2:
        score += 25
        explanations.append(f"✓ Role-specific keywords found ({role_count})")
    elif role_count >= 1:
        score += 15
        explanations.append(f"✓ Role keyword found")
    
    # Action verbs
    action_verbs = [
        'developed', 'designed', 'implemented', 'built', 'created',
        'managed', 'led', 'delivered', 'optimized', 'improved',
        'architected', 'engineered', 'deployed', 'integrated', 'configured',
        'automated', 'streamlined', 'orchestrated', 'transformed', 'accelerated',
    ]
    verb_count = sum(1 for v in action_verbs if v in text_lower)
    if verb_count >= 5:
        score += 20
        explanations.append(f"✓ Strong action verb usage ({verb_count})")
    elif verb_count >= 3:
        score += 12
        explanations.append(f"✓ Some action verbs ({verb_count})")
    elif verb_count >= 1:
        score += 5
    
    return {"score": min(score, 100), "explanations": explanations}


def _score_formatting(text: str, word_count: int) -> Dict:
    """
    Score formatting and structure (0-100).
    
    Checks for:
    - Appropriate length (25 pts)
    - Contact info present (20 pts)
    - Section headers (20 pts)
    - Bullet points (20 pts)
    - Consistent formatting (15 pts)
    """
    score = 0
    explanations = []
    text_lower = text.lower()
    
    # Length
    if 400 <= word_count <= 800:
        score += 25
        explanations.append(f"✓ Optimal resume length ({word_count} words)")
    elif 250 <= word_count <= 1000:
        score += 15
        explanations.append(f"✓ Acceptable length ({word_count} words)")
    elif word_count > 1000:
        score += 5
        explanations.append(f"⚠ Resume is long ({word_count} words) - consider condensing")
    else:
        explanations.append(f"✗ Resume too short ({word_count} words)")
    
    # Contact info
    has_email = bool(re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text))
    has_phone = bool(re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text))
    contact_score = 0
    if has_email and has_phone:
        contact_score = 20
        explanations.append("✓ Email and phone found")
    elif has_email or has_phone:
        contact_score = 10
        explanations.append("✓ Partial contact info")
    else:
        explanations.append("✗ No contact info found")
    score += contact_score
    
    # Section headers
    sections_found = 0
    section_patterns = [
        'experience', 'education', 'skills', 'projects',
        'certifications', 'achievements', 'summary', 'objective',
    ]
    for pattern in section_patterns:
        if re.search(pattern, text_lower):
            sections_found += 1
    if sections_found >= 5:
        score += 20
        explanations.append(f"✓ Well-structured ({sections_found} sections)")
    elif sections_found >= 3:
        score += 12
        explanations.append(f"✓ {sections_found} sections found")
    else:
        explanations.append(f"⚠ Only {sections_found} sections - add more structure")
    
    # Bullet points
    if re.search(r'[•\-*\d.]\s+', text):
        score += 20
        explanations.append("✓ Bullet points used for readability")
    else:
        explanations.append("✗ No bullet points - use for better ATS parsing")
    
    # Consistent formatting
    # Check for consistent line start patterns
    lines = text.split('\n')
    line_starts = [line.strip()[:1] for line in lines if line.strip()]
    if line_starts:
        unique_starts = len(set(line_starts))
        if unique_starts > 5:
            score += 15
            explanations.append("✓ Varied content structure")
        else:
            score += 5
    else:
        score += 5
    
    return {"score": min(score, 100), "explanations": explanations}


def _generate_weighted_suggestions(
    exp_score: int, skills_score: int, proj_score: int,
    edu_score: int, kw_score: int, fmt_score: int,
    skills: List[str], word_count: int
) -> List[str]:
    """Generate weighted ATS improvement suggestions."""
    suggestions = []
    
    # Experience suggestions
    if exp_score < 60:
        suggestions.append("Add more quantifiable achievements with specific metrics (%, $, time saved).")
        suggestions.append("Include relevant job titles and company names with dates.")
        suggestions.append("Use action verbs like 'developed', 'implemented', 'optimized'.")
    
    # Skills suggestions
    if skills_score < 60:
        suggestions.append(f"Add more relevant skills (currently {len(skills)}). Aim for 10-15+ skills.")
        suggestions.append("Include a mix of technical skills and soft skills.")
        suggestions.append("Add proficiency levels for your key skills.")
    
    # Projects suggestions
    if proj_score < 60:
        suggestions.append("Add a dedicated projects section with 3-5 key projects.")
        suggestions.append("Describe technologies used and your specific contributions.")
        suggestions.append("Include GitHub links or portfolio URLs for your projects.")
    
    # Education suggestions
    if edu_score < 60:
        suggestions.append("Expand education section with degree, institution, and graduation year.")
        suggestions.append("Add GPA if 3.0+ or relevant academic achievements.")
    
    # Keywords suggestions
    if kw_score < 60:
        suggestions.append("Include more industry-specific keywords relevant to your target role.")
        suggestions.append("Use action verbs throughout your experience descriptions.")
    
    # Formatting suggestions
    if fmt_score < 60:
        if word_count < 300:
            suggestions.append("Expand your resume to 300-800 words for better ATS parsing.")
        elif word_count > 800:
            suggestions.append("Condense your resume to 300-800 words.")
        suggestions.append("Add clear section headers: Experience, Education, Skills, Projects.")
        suggestions.append("Use bullet points to structure achievements.")
    
    # General
    if exp_score >= 70 and skills_score >= 70 and fmt_score >= 70:
        suggestions.append("Your resume is well-optimized! Keep it updated with latest achievements.")
    
    return suggestions


def _compile_explanations(
    weighted_scores: Dict, overall: int, skills: List[str]
) -> List[str]:
    """Compile human-readable explanations for the ATS score."""
    explanations = []
    
    # Overall explanation
    if overall >= 85:
        explanations.append(f"Excellent ATS score ({overall}/100). Your resume is well-optimized.")
    elif overall >= 70:
        explanations.append(f"Good ATS score ({overall}/100). Minor improvements recommended.")
    elif overall >= 50:
        explanations.append(f"Moderate ATS score ({overall}/100). Several areas need improvement.")
    else:
        explanations.append(f"Low ATS score ({overall}/100). Significant improvements needed.")
    
    # Breakdown by category
    for category, data in weighted_scores.items():
        raw = data["raw_score"]
        if raw >= 80:
            explanations.append(f"✅ {category.title()}: Strong ({raw}/100)")
        elif raw >= 60:
            explanations.append(f"📊 {category.title()}: Moderate ({raw}/100)")
        else:
            explanations.append(f"⚠️ {category.title()}: Needs improvement ({raw}/100)")
    
    # Skill-specific insights
    if skills:
        from skill_extractor import SKILL_TO_CATEGORY
        strong_skills = skills[:5]
        explanations.append(f"Key strengths: {', '.join(strong_skills)}")
    
    return explanations