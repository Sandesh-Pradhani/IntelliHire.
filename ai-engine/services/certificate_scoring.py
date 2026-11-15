from datetime import date
from typing import List, Optional


def _normalize(values: List[str]) -> List[str]:
    return [value.strip().lower() for value in values if value and value.strip()]


def _skill_relevance(skills: List[str], job_required_skills: List[str]) -> int:
    normalized_skills = _normalize(skills)
    normalized_required = _normalize(job_required_skills)
    if normalized_required:
        matches = len(set(normalized_skills).intersection(normalized_required))
        return round((matches / len(set(normalized_required))) * 100)
    return min(len(normalized_skills) * 20, 100)


def _verification_score(status: str) -> int:
    scores = {
        "verified": 100,
        "pending": 60,
        "unverified": 35,
        "expired": 20,
    }
    return scores.get(status, 35)


def _freshness_score(issue_date: Optional[date], expiry_date: Optional[date], status: str) -> int:
    today = date.today()
    if status == "expired" or (expiry_date and expiry_date < today):
        return 10
    if not issue_date:
        return 45
    age_months = max(0, (today - issue_date).days / 30)
    return max(30, round(100 - age_months * 1.5))


def _issuer_category_score(issuer: str, category: str) -> int:
    score = 35
    if issuer and issuer.strip():
        score += 35
    if category and category.strip() and category != "Other":
        score += 30
    return min(score, 100)


def calculate_certificate_score(
    title: str,
    issuer: str,
    category: str = "Other",
    skills: Optional[List[str]] = None,
    description: str = "",
    verification_status: str = "unverified",
    issue_date: Optional[date] = None,
    expiry_date: Optional[date] = None,
    job_required_skills: Optional[List[str]] = None,
):
    skills = skills or []
    job_required_skills = job_required_skills or []
    effective_status = "expired" if expiry_date and expiry_date < date.today() else verification_status

    relevance_score = _skill_relevance(skills, job_required_skills)
    verification_contribution = _verification_score(effective_status)
    freshness_contribution = _freshness_score(issue_date, expiry_date, effective_status)
    issuer_category_contribution = _issuer_category_score(issuer, category)

    certificate_score = round(
        relevance_score * 0.50
        + verification_contribution * 0.20
        + freshness_contribution * 0.15
        + issuer_category_contribution * 0.15
    )

    if certificate_score >= 80:
        recommendation = "High certificate contribution with strong role relevance."
    elif certificate_score >= 60:
        recommendation = "Useful certificate contribution; add evidence or role-aligned skills to improve it."
    else:
        recommendation = "Limited certificate contribution for this evaluation context."

    return {
        "certificateScore": min(certificate_score, 100),
        "relevanceScore": relevance_score,
        "verificationContribution": verification_contribution,
        "skillContribution": relevance_score,
        "freshnessContribution": freshness_contribution,
        "recommendation": recommendation,
    }
