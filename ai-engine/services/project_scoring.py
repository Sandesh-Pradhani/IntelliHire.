"""
Project Scoring Service

WHY THIS FILE:
Calculates an AI-powered project score (0-100) based on technology relevance,
project complexity, and documentation quality. This score becomes part of the
candidate's overall AI evaluation.

WHY THIS APPROACH:
- Weighted formula: Technology 30%, Complexity 30%, Documentation 20%, Repository 20%
- Each dimension is scored using realistic thresholds
- Missing data is handled gracefully with fallback scoring
- Returns a recommendation string based on the overall score

ALTERNATIVES CONSIDERED:
- ML-based scoring: requires training data, over-engineered for this use case
- Simple average: ignores dimension-specific value differences
"""

import logging
import re
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Score weights as specified in project requirements
TECHNOLOGY_WEIGHT = 0.30
COMPLEXITY_WEIGHT = 0.30
DOCUMENTATION_WEIGHT = 0.20
REPOSITORY_WEIGHT = 0.20

# Trending technologies that receive bonus scoring
HIGH_VALUE_TECH = {
    'react', 'vue', 'angular', 'nextjs', 'nuxtjs', 'svelte',
    'nodejs', 'python', 'java', 'go', 'rust', 'typescript',
    'fastapi', 'django', 'flask', 'express', 'spring',
    'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas',
    'graphql', 'rest', 'grpc',
    'machine-learning', 'deep-learning', 'nlp', 'computer-vision',
    'react-native', 'flutter', 'swift', 'kotlin',
    'tailwindcss', 'bootstrap', 'sass',
    'git', 'ci/cd', 'github-actions', 'jenkins',
    'figma', 'sketch',
}

# Category complexity multipliers
CATEGORY_MULTIPLIERS = {
    'AI/ML': 1.3,
    'Data Science': 1.2,
    'Full Stack': 1.1,
    'Backend': 1.1,
    'Mobile Development': 1.1,
    'DevOps': 1.2,
    'Frontend': 1.0,
    'Web Development': 1.0,
    'Other': 1.0,
}


def calculate_project_score(
    title: str,
    description: str = "",
    github_url: str = "",
    technologies: List[str] = None,
    category: str = "Other",
    team_size: int = 1,
    role: str = "",
) -> Dict[str, Any]:
    """
    Calculate the AI-powered project score from project details.

    Args:
        title: Project title
        description: Project description
        github_url: GitHub repository URL
        technologies: List of technologies used
        category: Project category
        team_size: Number of team members
        role: Candidate's role in the project

    Returns:
        Dict with:
        - technologyScore: Technology relevance score (0-100)
        - complexityScore: Project complexity score (0-100)
        - documentationScore: Documentation quality score (0-100)
        - portfolioScore: Overall portfolio score (0-100)
        - recommendation: AI recommendation string
    """
    if technologies is None:
        technologies = []

    tech_score = _score_technology(technologies, category)
    complexity_score = _score_complexity(title, description, technologies, category, team_size, role)
    doc_score = _score_documentation(title, description)
    repo_score = _score_repository(github_url, technologies)

    # Calculate weighted overall score
    portfolio_score = round(
        tech_score * TECHNOLOGY_WEIGHT +
        complexity_score * COMPLEXITY_WEIGHT +
        doc_score * DOCUMENTATION_WEIGHT +
        repo_score * REPOSITORY_WEIGHT
    )

    portfolio_score = min(max(portfolio_score, 0), 100)

    recommendation = _generate_recommendation(
        portfolio_score, tech_score, complexity_score, doc_score, repo_score
    )

    return {
        "technologyScore": tech_score,
        "complexityScore": complexity_score,
        "documentationScore": doc_score,
        "portfolioScore": portfolio_score,
        "recommendation": recommendation,
    }


def _score_technology(technologies: List[str], category: str) -> int:
    """
    Score technology relevance (0-100).

    Factors:
    - Number of technologies (30% of tech score)
    - High-value technology usage (50% of tech score)
    - Category alignment (20% of tech score)
    """
    if not technologies:
        return 10

    # Number of technologies score: 0 = 0, 8+ = 100
    count_score = min(len(technologies) * 12.5, 100)

    # High-value technology score
    tech_set = {t.lower().replace(' ', '').replace('-', '') for t in technologies}
    high_value_matches = sum(
        1 for ht in HIGH_VALUE_TECH
        if any(ht.replace('-', '') in t for t in tech_set)
    )
    value_score = min(high_value_matches * 20, 100)

    # Category alignment bonus
    category_multiplier = CATEGORY_MULTIPLIERS.get(category, 1.0)
    category_bonus = min(80 * category_multiplier, 100) if category != 'Other' else 50

    tech_score = round(
        count_score * 0.30 +
        value_score * 0.50 +
        category_bonus * 0.20
    )

    return min(max(tech_score, 0), 100)


def _score_complexity(
    title: str,
    description: str,
    technologies: List[str],
    category: str,
    team_size: int,
    role: str,
) -> int:
    """
    Score project complexity (0-100).

    Factors:
    - Technology stack depth (30% of complexity score)
    - Category complexity (25% of complexity score)
    - Team collaboration (20% of complexity score)
    - Role significance (15% of complexity score)
    - Description detail (10% of complexity score)
    """
    # Technology depth: more unique techs = more complex
    tech_depth = min(len(technologies) * 12, 100)

    # Category complexity
    cat_multiplier = CATEGORY_MULTIPLIERS.get(category, 1.0)
    cat_score = min(round(70 * cat_multiplier), 100)

    # Team collaboration: solo = 40, 5+ = 100
    team_score = min(40 + (team_size - 1) * 15, 100)

    # Role significance
    role_lower = role.lower() if role else ''
    if any(w in role_lower for w in ['lead', 'architect', 'owner', 'creator', 'founder']):
        role_score = 90
    elif any(w in role_lower for w in ['senior', 'main', 'primary']):
        role_score = 75
    elif any(w in role_lower for w in ['developer', 'engineer', 'contributor']):
        role_score = 60
    elif role:
        role_score = 50
    else:
        role_score = 30

    # Description detail
    desc_words = len(description.split()) if description else 0
    desc_score = min(desc_words * 1.5, 100)

    complexity_score = round(
        tech_depth * 0.30 +
        cat_score * 0.25 +
        team_score * 0.20 +
        role_score * 0.15 +
        desc_score * 0.10
    )

    return min(max(complexity_score, 0), 100)


def _score_documentation(title: str, description: str) -> int:
    """
    Score documentation quality (0-100).

    Factors:
    - Description length and detail (60% of doc score)
    - Title quality (20% of doc score)
    - Structured content indicators (20% of doc score)
    """
    # Description length: 0 words = 0, 100+ words = 100
    desc_words = len(description.split()) if description else 0
    length_score = min(desc_words, 100)

    # Title quality: length and specificity
    title_len = len(title) if title else 0
    if title_len > 30:
        title_score = 90
    elif title_len > 15:
        title_score = 70
    elif title_len > 5:
        title_score = 50
    else:
        title_score = 20

    # Structured content: check for lists, sections, technical terms
    structured_indicators = 0
    if description:
        if re.search(r'[-•*]\s', description):
            structured_indicators += 1
        if re.search(r'\n\n', description):
            structured_indicators += 1
        if re.search(r'(?:features?|tech|stack|built|using|includes?)', description, re.IGNORECASE):
            structured_indicators += 1
        if re.search(r'(?:https?://|\.com|\.org|\.io)', description):
            structured_indicators += 1
    structure_score = min(structured_indicators * 25, 100)

    doc_score = round(
        length_score * 0.60 +
        title_score * 0.20 +
        structure_score * 0.20
    )

    return min(max(doc_score, 0), 100)


def _score_repository(github_url: str, technologies: List[str]) -> int:
    """
    Score repository quality (placeholder for GitHub API integration).

    Current approach: score based on URL validity and technology alignment.
    Future: will integrate GitHub API for stars, commits, contributors.

    Factors:
    - GitHub URL presence (50% of repo score)
    - URL quality (25% of repo score)
    - Technology-GitHub alignment (25% of repo score)
    """
    if not github_url:
        return 0

    # URL presence score
    presence_score = 60

    # URL quality: valid GitHub URL format
    if re.match(r'https?://github\.com/[\w.-]+/[\w.-]+', github_url):
        url_score = 100
    elif 'github.com' in github_url:
        url_score = 70
    else:
        url_score = 30

    # Technology-GitHub alignment (placeholder: score based on tech count)
    alignment_score = min(len(technologies) * 15, 100) if technologies else 30

    repo_score = round(
        presence_score * 0.50 +
        url_score * 0.25 +
        alignment_score * 0.25
    )

    return min(max(repo_score, 0), 100)


def _generate_recommendation(
    overall: int,
    tech_score: int,
    complexity_score: int,
    doc_score: int,
    repo_score: int,
) -> str:
    """
    Generate an AI recommendation based on the project score and dimension strengths.
    """
    if overall >= 85:
        return "Outstanding project with strong technical depth, complexity, and documentation. Excellent portfolio piece."
    elif overall >= 70:
        return "Strong project demonstrating solid technical skills. Well-rounded across all dimensions."
    elif overall >= 55:
        return "Good project with room for improvement. Consider enhancing documentation and adding more technologies."
    elif overall >= 40:
        return "Decent project foundation. Focus on improving description detail and GitHub repository quality."
    elif overall >= 25:
        return "Early-stage project. Add more technologies, detailed description, and a GitHub link to improve score."
    else:
        return "Project needs significant improvement. Add technologies, comprehensive description, and repository links."
