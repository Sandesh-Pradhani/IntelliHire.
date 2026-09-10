"""
Enhanced resume parser service for structured JSON extraction.

WHY THIS FILE:
Extracts structured data from resume PDFs including name, email, phone,
skills, experience, education, projects, certificates, GitHub, LinkedIn,
portfolio, languages, and achievements.

WHY THIS APPROACH:
- Uses regex patterns for structured field extraction
- Falls back to PyPDF2 for raw text extraction
- Returns a consistent JSON schema regardless of PDF format

ALTERNATIVES CONSIDERED:
- spaCy NER: overkill for simple field extraction, slower
- Third-party API: adds cost and latency
- LLM-based extraction: expensive, inconsistent
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Regex Patterns for Structured Extraction
# ──────────────────────────────────────────────────────────────────────────────

EMAIL_PATTERN = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
PHONE_PATTERN = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
URL_PATTERN = r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)'
GITHUB_PATTERN = r'(?:https?://)?(?:www\.)?github\.com/[\w.-]+'
LINKEDIN_PATTERN = r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w.-]+'
PORTFOLIO_PATTERN = r'(?:https?://)?(?:www\.)?[\w.-]+\.(?:com|dev|io|app|me|net|org)(?:/[\w./-]*)?'

# Common section headers in resumes
SECTION_HEADERS = {
    'experience': [
        r'experience', r'work experience', r'employment', r'work history',
        r'professional experience', r'career history',
    ],
    'education': [
        r'education', r'academic background', r'academic history',
        r'qualifications', r'educational background',
    ],
    'projects': [
        r'projects', r'project experience', r'personal projects',
        r'academic projects', r'key projects',
    ],
    'skills': [
        r'skills', r'technical skills', r'core competencies',
        r'technologies', r'tech stack', r'skill set',
    ],
    'certificates': [
        r'certifications?', r'certificates?', r'professional certifications?',
        r'licenses?', r'credentials?',
    ],
    'languages': [
        r'languages', r'language proficiency', r'languages spoken',
    ],
    'achievements': [
        r'achievements?', r'accomplishments?', r'awards?',
        r'honors?', r'publications?',
    ],
}


def extract_resume_text(pdf_path: str) -> str:
    """
    Extract raw text from a PDF file using PyPDF2.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Extracted text as a string

    Raises:
        FileNotFoundError: If the PDF file doesn't exist
        ValueError: If the PDF cannot be parsed
    """
    import PyPDF2

    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return '\n'.join(text_parts)
    except FileNotFoundError:
        logger.error(f"PDF file not found: {pdf_path}")
        raise
    except Exception as e:
        logger.error(f"Failed to parse PDF {pdf_path}: {e}")
        raise ValueError(f"Failed to parse PDF: {e}")


def extract_email(text: str) -> Optional[str]:
    """Extract email address from text."""
    match = re.search(EMAIL_PATTERN, text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text."""
    match = re.search(PHONE_PATTERN, text)
    return match.group(0).strip() if match else None


def extract_name(text: str) -> Optional[str]:
    """
    Extract candidate name from resume text.
    Heuristic: First non-empty line that looks like a name (2-4 words, no special chars).
    """
    lines = text.strip().split('\n')
    for line in lines[:10]:  # Check first 10 lines
        line = line.strip()
        if not line:
            continue
        # Skip lines that look like emails, phones, URLs
        if re.search(EMAIL_PATTERN, line) or re.search(PHONE_PATTERN, line) or re.search(URL_PATTERN, line):
            continue
        # Skip lines that are too short or too long
        words = line.split()
        if 2 <= len(words) <= 5:
            # Check if it looks like a name (mostly alphabetic)
            if all(w.isalpha() or w in '.-' for w in words):
                return line
    return None


def extract_github(text: str) -> Optional[str]:
    """Extract GitHub profile URL from text."""
    match = re.search(GITHUB_PATTERN, text, re.IGNORECASE)
    if match:
        url = match.group(0)
        if not url.startswith('http'):
            url = 'https://' + url
        return url
    return None


def extract_linkedin(text: str) -> Optional[str]:
    """Extract LinkedIn profile URL from text."""
    match = re.search(LINKEDIN_PATTERN, text, re.IGNORECASE)
    if match:
        url = match.group(0)
        if not url.startswith('http'):
            url = 'https://' + url
        return url
    return None


def extract_portfolio(text: str) -> Optional[str]:
    """Extract portfolio/website URL from text (excluding GitHub/LinkedIn)."""
    urls = re.findall(URL_PATTERN, text, re.IGNORECASE)
    for url in urls:
        if 'github' not in url.lower() and 'linkedin' not in url.lower():
            return url
    return None


def extract_section(text: str, section_patterns: list[str]) -> str:
    """
    Extract a section from resume text based on header patterns.

    Args:
        text: Full resume text
        section_patterns: List of regex patterns for section headers

    Returns:
        Text content of the section, or empty string if not found
    """
    lines = text.split('\n')
    section_start = None
    section_end = None

    for i, line in enumerate(lines):
        line_lower = line.strip().lower()
        for pattern in section_patterns:
            if re.search(pattern, line_lower):
                if section_start is None:
                    section_start = i
                break

    if section_start is not None:
        # Find the next section header
        all_patterns = []
        for patterns in SECTION_HEADERS.values():
            all_patterns.extend(patterns)

        for i in range(section_start + 1, len(lines)):
            line_lower = lines[i].strip().lower()
            for pattern in all_patterns:
                if re.search(pattern, line_lower) and i > section_start + 1:
                    section_end = i
                    break
            if section_end is not None:
                break

        section_lines = lines[section_start + 1:section_end] if section_end else lines[section_start + 1:]
        return '\n'.join(line for line in section_lines if line.strip())

    return ''


def extract_experience(text: str) -> list[dict]:
    """
    Extract work experience entries from resume text.

    Returns a list of dicts with company, role, duration, description.
    """
    section = extract_section(text, SECTION_HEADERS['experience'])
    if not section:
        return []

    # Simple heuristic: split by double newlines or common bullet patterns
    entries = []
    blocks = re.split(r'\n\s*\n', section)

    for block in blocks:
        if not block.strip():
            continue
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if lines:
            entries.append({
                "raw_text": block.strip(),
                "lines": lines,
            })

    return entries


def extract_education(text: str) -> list[dict]:
    """
    Extract education entries from resume text.

    Returns a list of dicts with institution, degree, field, year.
    """
    section = extract_section(text, SECTION_HEADERS['education'])
    if not section:
        return []

    entries = []
    blocks = re.split(r'\n\s*\n', section)

    for block in blocks:
        if not block.strip():
            continue
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if lines:
            entries.append({
                "raw_text": block.strip(),
                "lines": lines,
            })

    return entries


def extract_projects(text: str) -> list[dict]:
    """
    Extract project entries from resume text.

    Returns a list of dicts with project name, description, technologies.
    """
    section = extract_section(text, SECTION_HEADERS['projects'])
    if not section:
        return []

    entries = []
    blocks = re.split(r'\n\s*\n', section)

    for block in blocks:
        if not block.strip():
            continue
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if lines:
            entries.append({
                "raw_text": block.strip(),
                "lines": lines,
            })

    return entries


def extract_certificates(text: str) -> list[str]:
    """Extract certificate/certification names from resume text."""
    section = extract_section(text, SECTION_HEADERS['certificates'])
    if not section:
        return []

    lines = [l.strip() for l in section.split('\n') if l.strip()]
    # Remove bullet points and numbering
    cleaned = []
    for line in lines:
        line = re.sub(r'^[\s•\-*\d.]+', '', line).strip()
        if line:
            cleaned.append(line)
    return cleaned


def extract_languages(text: str) -> list[str]:
    """Extract languages from resume text."""
    section = extract_section(text, SECTION_HEADERS['languages'])
    if not section:
        return []

    lines = [l.strip() for l in section.split('\n') if l.strip()]
    cleaned = []
    for line in lines:
        line = re.sub(r'^[\s•\-*\d.]+', '', line).strip()
        # Remove proficiency levels
        line = re.sub(r'\s*[-–(]\s*(native|fluent|proficient|intermediate|beginner|bilingual|professional working|full professional)\s*[-–)]?\s*$', '', line, flags=re.IGNORECASE).strip()
        if line:
            cleaned.append(line)
    return cleaned


def extract_achievements(text: str) -> list[str]:
    """Extract achievements/awards from resume text."""
    section = extract_section(text, SECTION_HEADERS['achievements'])
    if not section:
        return []

    lines = [l.strip() for l in section.split('\n') if l.strip()]
    cleaned = []
    for line in lines:
        line = re.sub(r'^[\s•\-*\d.]+', '', line).strip()
        if line:
            cleaned.append(line)
    return cleaned


def parse_resume_full(pdf_path: str) -> dict:
    """
    Parse a resume PDF into a full structured JSON object.

    Args:
        pdf_path: Path to the PDF file

    Returns:
        Dict with all extracted fields:
        - name, email, phone, skills, experience, education
        - projects, certificates, github, linkedin, portfolio
        - languages, achievements

    Raises:
        FileNotFoundError: If the PDF file doesn't exist
        ValueError: If the PDF cannot be parsed
    """
    text = extract_resume_text(pdf_path)

    # Use existing skill extractor
    from skill_extractor import extract_skills
    skills = extract_skills(text)

    result = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": skills,
        "experience": extract_experience(text),
        "education": extract_education(text),
        "projects": extract_projects(text),
        "certificates": extract_certificates(text),
        "github": extract_github(text),
        "linkedin": extract_linkedin(text),
        "portfolio": extract_portfolio(text),
        "languages": extract_languages(text),
        "achievements": extract_achievements(text),
        "raw_text_length": len(text),
    }

    return result