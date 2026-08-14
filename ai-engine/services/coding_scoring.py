"""
Coding Profile Scoring Service

WHY THIS FILE:
Calculates a unified coding score (0-100) from GitHub, LeetCode, and HackerRank
statistics. This score becomes part of the candidate's overall AI evaluation.

WHY THIS APPROACH:
- Weighted formula: GitHub 40%, LeetCode 40%, HackerRank 20%
- Each platform score is normalized to 0-100 using realistic thresholds
- Missing platforms are handled gracefully (weight redistributed)
- Returns a recommendation string based on the overall score

ALTERNATIVES CONSIDERED:
- ML-based scoring: requires training data, over-engineered for this use case
- Simple average: ignores platform-specific value differences
"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Platform weights as specified in the project requirements
GITHUB_WEIGHT = 0.40
LEETCODE_WEIGHT = 0.40
HACKERRANK_WEIGHT = 0.20


def calculate_coding_score(
    github: Optional[Dict[str, Any]] = None,
    leetcode: Optional[Dict[str, Any]] = None,
    hackerrank: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Calculate the unified coding score from platform statistics.

    Args:
        github: GitHub stats dict (repositories, followers, stars, languages, contributionActivity)
        leetcode: LeetCode stats dict (problemsSolved, easy, medium, hard, contestRating, topPercentage)
        hackerrank: HackerRank stats dict (stars, badges)

    Returns:
        Dict with:
        - codingScore: Overall score (0-100)
        - recommendation: AI recommendation string
        - breakdown: Per-platform scores and weights
    """
    # Calculate individual platform scores
    github_score = _score_github(github) if github else None
    leetcode_score = _score_leetcode(leetcode) if leetcode else None
    hackerrank_score = _score_hackerrank(hackerrank) if hackerrank else None

    # Determine which platforms are present
    present_scores = []
    if github_score is not None:
        present_scores.append((github_score, GITHUB_WEIGHT))
    if leetcode_score is not None:
        present_scores.append((leetcode_score, LEETCODE_WEIGHT))
    if hackerrank_score is not None:
        present_scores.append((hackerrank_score, HACKERRANK_WEIGHT))

    if not present_scores:
        return {
            "codingScore": 0,
            "recommendation": "No coding profile data available. Connect GitHub, LeetCode, or HackerRank to get a coding score.",
            "breakdown": {},
        }

    # Redistribute weights among present platforms
    total_weight = sum(w for _, w in present_scores)
    normalized_scores = [(score, weight / total_weight) for score, weight in present_scores]

    # Calculate weighted overall score
    overall = round(sum(score * weight for score, weight in normalized_scores))

    # Generate recommendation
    recommendation = _generate_recommendation(overall, github_score, leetcode_score, hackerrank_score)

    return {
        "codingScore": min(overall, 100),
        "recommendation": recommendation,
        "breakdown": {
            "github": {
                "score": github_score,
                "weight": GITHUB_WEIGHT,
                "present": github_score is not None,
            },
            "leetcode": {
                "score": leetcode_score,
                "weight": LEETCODE_WEIGHT,
                "present": leetcode_score is not None,
            },
            "hackerrank": {
                "score": hackerrank_score,
                "weight": HACKERRANK_WEIGHT,
                "present": hackerrank_score is not None,
            },
        },
    }


def _score_github(github: Dict[str, Any]) -> int:
    """
    Score GitHub profile (0-100).

    Factors:
    - Repositories (40% of GitHub score)
    - Contribution activity (30% of GitHub score)
    - Languages (20% of GitHub score)
    - Followers/Stars (10% of GitHub score)

    README quality is a future-ready placeholder (not yet scored).
    """
    repositories = github.get("repositories", 0)
    followers = github.get("followers", 0)
    stars = github.get("stars", 0)
    languages = github.get("languages", [])
    contribution = github.get("contributionActivity", {})

    # Repositories score (0-100): 0 repos = 0, 20+ repos = 100
    repo_score = min(repositories * 5, 100)

    # Contribution activity score (0-100)
    recently_updated = contribution.get("recentlyUpdated", 0) if contribution else 0
    total_repos = contribution.get("totalRepos", repositories) if contribution else repositories
    activity_ratio = (recently_updated / total_repos) if total_repos > 0 else 0
    activity_score = min(activity_ratio * 100, 100)

    # Languages score (0-100): 0 languages = 0, 5+ languages = 100
    language_score = min(len(languages) * 20, 100)

    # Social score (0-100): followers + stars
    social_score = min((followers * 2) + (stars * 0.5), 100)

    # Weighted GitHub score
    github_score = (
        (repo_score * 0.40)
        + (activity_score * 0.30)
        + (language_score * 0.20)
        + (social_score * 0.10)
    )

    return round(github_score)


def _score_leetcode(leetcode: Dict[str, Any]) -> int:
    """
    Score LeetCode profile (0-100).

    Factors:
    - Problems solved (60% of LeetCode score)
    - Contest rating (40% of LeetCode score)
    """
    problems_solved = leetcode.get("problemsSolved", 0)
    easy = leetcode.get("easy", 0)
    medium = leetcode.get("medium", 0)
    hard = leetcode.get("hard", 0)
    contest_rating = leetcode.get("contestRating")
    top_percentage = leetcode.get("topPercentage")

    # Problems solved score (0-100): 0 = 0, 500+ = 100
    # Weight harder problems more
    weighted_problems = easy * 1 + medium * 2 + hard * 3
    problems_score = min(weighted_problems * 0.2, 100)

    # Contest rating score (0-100)
    if contest_rating is not None:
        # LeetCode ratings: ~1500 average, 2000+ is strong, 2500+ is top
        contest_score = min(max((contest_rating - 1300) / 12, 0), 100)
    elif top_percentage is not None:
        # Top percentage: 1% = 100, 100% = 0
        contest_score = max(100 - top_percentage, 0)
    else:
        contest_score = 0

    # Weighted LeetCode score
    leetcode_score = (problems_score * 0.60) + (contest_score * 0.40)

    return round(leetcode_score)


def _score_hackerrank(hackerrank: Dict[str, Any]) -> int:
    """
    Score HackerRank profile (0-100).

    Factors:
    - Stars (60% of HackerRank score)
    - Skill badges (40% of HackerRank score)
    """
    stars = hackerrank.get("stars", 0)
    badges = hackerrank.get("badges", [])

    # Stars score (0-100): 0 = 0, 20+ stars = 100
    stars_score = min(stars * 5, 100)

    # Badges score (0-100): 0 = 0, 10+ badges = 100
    badge_score = min(len(badges) * 10, 100)

    # Weighted HackerRank score
    hackerrank_score = (stars_score * 0.60) + (badge_score * 0.40)

    return round(hackerrank_score)


def _generate_recommendation(
    overall: int,
    github_score: Optional[int],
    leetcode_score: Optional[int],
    hackerrank_score: Optional[int],
) -> str:
    """
    Generate an AI recommendation based on the coding score and platform strengths.
    """
    if overall >= 85:
        return "Outstanding coding profile. Strong candidate for senior or specialized technical roles."
    elif overall >= 70:
        return "Strong coding profile. Well-rounded across platforms. Ready for most technical roles."
    elif overall >= 50:
        return "Good coding foundation. Focus on increasing problem-solving volume and contest participation."
    elif overall >= 30:
        return "Developing coding profile. Consistent practice on LeetCode and more GitHub contributions will help."
    else:
        return "Early-stage coding profile. Start building a GitHub portfolio and solving problems regularly."


def calculate_unified_candidate_score(
    ats_score: float,
    semantic_score: float,
    academic_score: float,
    coding_score: float,
    project_score: float = 0,
) -> Dict[str, Any]:
    """
    Calculate the unified candidate score with coding and project integration.

    Weights (V5.3 - updated with project score):
    - ATS: 20%
    - Semantic: 30%
    - Academic: 15%
    - Coding: 20%
    - Projects: 15%

    Args:
        ats_score: ATS compatibility score (0-100)
        semantic_score: Semantic similarity score (0-100)
        academic_score: Academic score (0-100)
        coding_score: Coding score (0-100)
        project_score: Project portfolio score (0-100)

    Returns:
        Dict with final score, breakdown, and recommendation
    """
    weights = {
        "semantic": 0.30,
        "ats": 0.20,
        "academic": 0.15,
        "coding": 0.20,
        "projects": 0.15,
    }

    final_score = round(
        (semantic_score * weights["semantic"])
        + (ats_score * weights["ats"])
        + (academic_score * weights["academic"])
        + (coding_score * weights["coding"])
        + (project_score * weights["projects"])
    )

    # Generate recommendation based on final score
    if final_score >= 85:
        recommendation = "Excellent overall candidate. Strong across all evaluation dimensions including project portfolio."
    elif final_score >= 70:
        recommendation = "Strong candidate. Meets most requirements with good overall fit and project experience."
    elif final_score >= 50:
        recommendation = "Moderate candidate. Some strengths but gaps in key areas. Project portfolio could be stronger."
    else:
        recommendation = "Candidate needs development in multiple areas before consideration."

    return {
        "finalScore": min(final_score, 100),
        "recommendation": recommendation,
        "breakdown": {
            "semantic": {"score": semantic_score, "weight": weights["semantic"]},
            "ats": {"score": ats_score, "weight": weights["ats"]},
            "academic": {"score": academic_score, "weight": weights["academic"]},
            "coding": {"score": coding_score, "weight": weights["coding"]},
            "projects": {"score": project_score, "weight": weights["projects"]},
        },
        "weights_used": weights,
    }