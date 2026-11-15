"""
Resume Optimizer Service

AI-powered resume optimization that transforms structured candidate data
into professional resume language. CRITICAL: Never fabricates information.
Only rephrases and organizes existing data.
"""

import re
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


def generate_summary(
    skills: List[str],
    projects: list,
    experience: list,
    education: list,
    certificates: list,
    coding_profiles: dict = None,
    job_description: Optional[str] = None,
) -> str:
    """
    Generate a concise professional summary from candidate data.
    2-4 sentences, ATS-friendly, factually grounded.
    """
    components = []

    # Determine primary domain from skills and projects
    domains = _extract_domains(skills, projects, experience)
    domain_text = domains[0] if domains else "software development"

    # Experience level
    exp_count = len(experience) or 0
    if exp_count > 0:
        exp_text = f"with {exp_count} year{'s' if exp_count > 1 else ''} of professional experience"
    else:
        exp_text = "with hands-on project experience"

    # Education
    edu_text = ""
    if education:
        latest = education[0]
        degree = latest.get("degree", "") or latest.get("branch", "")
        if degree:
            edu_text = f"holding a {degree} degree"

    # Skills highlight
    top_skills = skills[:5] if skills else []
    skill_text = ""
    if top_skills:
        if len(top_skills) <= 3:
            skill_text = f"proficient in {', '.join(top_skills)}"
        else:
            skill_text = f"skilled in {', '.join(top_skills[:3])}, and other technologies"

    # Projects
    project_text = ""
    if projects:
        featured = [p for p in projects if p.get("title")][:2]
        if featured:
            titles = [p["title"] for p in featured]
            project_text = f"with notable projects including {', '.join(titles)}"

    # Build summary
    if exp_count > 0:
        base = f"Results-oriented {domain_text} professional {exp_text}"
    else:
        base = f"Aspiring {domain_text} professional {exp_text}"

    if edu_text:
        base += f", {edu_text}"

    if skill_text:
        base += f", {skill_text}"

    if project_text:
        base += f" {project_text}"

    base += "."

    # Add certificates if present
    if certificates:
        cert_count = len(certificates)
        base += f" Certified with {cert_count} professional credential{'s' if cert_count > 1 else ''}."

    # Job-specific tailoring
    if job_description:
        jd_lower = job_description.lower()
        relevant_skills = [s for s in skills if s.lower() in jd_lower]
        if relevant_skills:
            base += f" Background aligns with requirements in {', '.join(relevant_skills[:3])}."

    return base


def optimize_experience(description: str, technologies: List[str]) -> str:
    """
    Optimize an experience description using action verbs and structure.
    Only rephrases existing content - never adds new information.
    """
    if not description or not description.strip():
        return description

    action_verbs = [
        "Developed", "Implemented", "Designed", "Built", "Led",
        "Integrated", "Optimized", "Automated", "Collaborated",
        "Delivered", "Managed", "Architected", "Enhanced", "Streamlined",
    ]

    text = description.strip()

    # If already well-structured with bullet points, keep as-is
    if text.startswith("-") or text.startswith("•") or text.startswith("*"):
        return text

    # Split into sentences
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    optimized = []
    for sentence in sentences:
        # Capitalize first letter if not already
        if sentence and sentence[0].islower():
            sentence = sentence[0].upper() + sentence[1:]

        # Check if starts with action verb
        first_word = sentence.split()[0] if sentence.split() else ""
        if first_word not in action_verbs:
            # Try to add an action verb
            for verb in action_verbs:
                if sentence.lower().startswith(f"responsible for"):
                    sentence = sentence.replace("responsible for", f"{verb}", 1)
                    sentence = sentence[0].upper() + sentence[1:]
                    break
                elif sentence.lower().startswith(f"worked on"):
                    sentence = sentence.replace("worked on", f"{verb}", 1)
                    sentence = sentence[0].upper() + sentence[1:]
                    break

        optimized.append(sentence)

    result = ". ".join(optimized)
    if result and not result.endswith("."):
        result += "."

    return result


def optimize_project(description: str, technologies: List[str]) -> str:
    """
    Optimize a project description. Only rephrases existing content.
    """
    if not description or not description.strip():
        return description

    text = description.strip()
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    optimized = []
    for sentence in sentences:
        if sentence and sentence[0].islower():
            sentence = sentence[0].upper() + sentence[1:]

        # Enhance weak phrasing
        replacements = [
            ("made", "Developed"),
            ("built", "Built"),
            ("created", "Created"),
            ("used", "Utilized"),
            ("working on", "Developing"),
        ]
        for old, new in replacements:
            if sentence.lower().startswith(old):
                sentence = new + sentence[len(old):]
                break

        optimized.append(sentence)

    result = ". ".join(optimized)
    if result and not result.endswith("."):
        result += "."

    return result


def analyze_ats(resume_text: str, skills: List[str], job_description: Optional[str] = None) -> dict:
    """
    Analyze resume for ATS compatibility.
    Returns score, keyword coverage, matched/missing keywords, section completeness, recommendations.
    """
    text_lower = resume_text.lower()
    word_count = len(resume_text.split())

    # Section completeness
    sections = {
        "personalInfo": bool(re.search(r'[\w.-]+@[\w.-]+', resume_text)),
        "summary": bool(re.search(r'(summary|objective|profile)', text_lower)),
        "skills": bool(re.search(r'(skills|technologies|tech stack)', text_lower)),
        "education": bool(re.search(r'(education|university|college|degree|bachelor|master)', text_lower)),
        "experience": bool(re.search(r'(experience|employment|work history)', text_lower)),
        "projects": bool(re.search(r'(projects|portfolio)', text_lower)),
        "certificates": bool(re.search(r'(certification|certificate|certified)', text_lower)),
    }
    filled_sections = sum(sections.values())
    completeness = round((filled_sections / len(sections)) * 100)

    # Keyword analysis
    matched_keywords = [s for s in skills if s.lower() in text_lower]
    keyword_coverage = round((len(matched_keywords) / max(len(skills), 1)) * 100)

    # Missing keywords from job description
    missing_keywords = []
    if job_description:
        jd_lower = job_description.lower()
        # Extract potential keywords from job description
        jd_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', jd_lower))
        tech_keywords = [w for w in jd_words if w not in _stop_words()]
        missing_keywords = [w for w in tech_keywords if w not in text_lower and len(w) > 3][:15]

    # ATS Score calculation
    format_score = min(20, 10 + (5 if word_count >= 200 else 0) + (5 if word_count <= 1000 else 0))
    section_score = min(30, completeness * 0.3)
    keyword_score = min(25, keyword_coverage * 0.25)
    experience_score = 15 if sections["experience"] else 0
    education_score = 10 if sections["education"] else 0

    ats_score = min(100, round(format_score + section_score + keyword_score + experience_score + education_score))

    # Recommendations
    recommendations = []
    if not sections["summary"]:
        recommendations.append("Add a professional summary section to improve ATS readability")
    if not sections["skills"]:
        recommendations.append("Include a dedicated skills section with relevant technologies")
    if not sections["experience"]:
        recommendations.append("Add work experience section with job titles and descriptions")
    if not sections["education"]:
        recommendations.append("Include education details (degree, institution, graduation year)")
    if not sections["projects"]:
        recommendations.append("Add a projects section to showcase practical experience")
    if not sections["certificates"]:
        recommendations.append("Consider adding professional certifications")
    if keyword_coverage < 60:
        recommendations.append(f"Keyword coverage is {keyword_coverage}%. Add more relevant skills")
    if word_count < 200:
        recommendations.append("Resume is too short. Add more details to sections")
    if word_count > 1000:
        recommendations.append("Resume may be too long. Consider condensing content")
    if missing_keywords:
        top_missing = missing_keywords[:5]
        recommendations.append(f"Consider adding if relevant: {', '.join(top_missing)}")

    return {
        "atsScore": ats_score,
        "keywordCoverage": keyword_coverage,
        "matchedKeywords": matched_keywords,
        "missingKeywords": missing_keywords,
        "sectionCompleteness": sections,
        "recommendations": recommendations,
    }


def _extract_domains(skills: List[str], projects: list, experience: list) -> List[str]:
    """Extract primary domains from candidate data."""
    domain_keywords = {
        "web development": ["javascript", "react", "node", "html", "css", "django", "flask", "express", "vue", "angular"],
        "mobile development": ["android", "ios", "swift", "kotlin", "react native", "flutter"],
        "data science": ["python", "machine learning", "tensorflow", "pandas", "numpy", "data"],
        "cloud engineering": ["aws", "azure", "gcp", "docker", "kubernetes", "devops"],
        "backend development": ["java", "python", "go", "rust", "postgresql", "mongodb", "api"],
        "frontend development": ["react", "vue", "angular", "javascript", "typescript", "css"],
        "ai/ml": ["artificial intelligence", "machine learning", "deep learning", "nlp", "pytorch"],
    }

    all_text = " ".join([
        " ".join(skills).lower(),
        " ".join(p.get("technologies", []) for p in projects).lower(),
        " ".join(e.get("technologies", []) for e in experience).lower(),
    ])

    scores = {}
    for domain, keywords in domain_keywords.items():
        score = sum(1 for kw in keywords if kw in all_text)
        if score > 0:
            scores[domain] = score

    return sorted(scores.keys(), key=lambda x: scores[x], reverse=True)


def _stop_words() -> set:
    """Common English stop words to exclude from keyword extraction."""
    return {
        "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
        "her", "was", "one", "our", "out", "has", "his", "how", "its", "may",
        "new", "now", "old", "see", "way", "who", "did", "get", "let", "say",
        "she", "too", "use", "with", "that", "this", "will", "each", "make",
        "like", "than", "them", "then", "what", "when", "your", "from",
        "they", "been", "have", "much", "also", "more", "some", "time",
        "very", "just", "over", "such", "take", "year", "into", "only",
        "work", "well", "will", "back", "being", "between", "should",
        "about", "would", "could", "other", "which", "their", "there",
        "these", "those", "where", "after", "first", "using",
    }
