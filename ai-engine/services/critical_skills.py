"""
Essential ("main") skill resolution for job matching.

WHY THIS FILE:
The v2 scoring contract needs one deterministic answer to "which skills define
this job?". The previous implementation took the first four skills from an
alphabetically sorted extractor output, so a MERN role could be penalised for
missing DigitalOcean/Enzyme while React/Node/MongoDB were not considered main
skills at all.

The authoritative order is now:
  1. Job.essentialSkills (explicit recruiter choice),
  2. all Job.requiredSkills (with a warning),
  3. skills named in the job title (with a warning),
  4. none (with a warning).

The functions here are thin, side-effect-free wrappers around
`services.match_scoring.resolve_essential_skills` so existing callers keep
their import path while the scoring rule lives in exactly one place.
"""

from typing import Iterable, List, Optional

from services.match_scoring import (
    PENALTY_CAP_RATE,
    PENALTY_PER_MISSING_SKILL,
    resolve_essential_skills as _resolve_essential_skills,
)

# Retained for callers that imported these constants. They are no longer used
# to truncate the essential list; the penalty cap (not the list length) bounds
# the score reduction.
MAX_JD_HEAD_SKILLS = 3
MAX_CRITICAL_SKILLS = 4
PENALTY_PER_MISSING = PENALTY_PER_MISSING_SKILL * 100.0


def identify_critical_skills(
    job_title: str,
    required_skills: Iterable[str],
    essential_skills: Optional[Iterable[str]] = None,
) -> List[str]:
    """Return the ordered, de-duplicated essential-skill list for a job."""
    essentials, _warnings = _resolve_essential_skills(
        job_title=job_title,
        required_skills=required_skills,
        essential_skills=essential_skills,
    )
    return essentials


def find_missing_critical_skills(
    critical_skills: Iterable[str],
    candidate_skills: Iterable[str],
) -> List[str]:
    """Return the essential skills not present in the candidate's skill set.

    Matching is exact (case-insensitive): partial word containment is not
    used, so "java" never satisfies "javascript".
    """
    candidate_set = {
        (skill or "").strip().lower() for skill in (candidate_skills or [])
    }
    return [
        skill for skill in (critical_skills or [])
        if (skill or "").strip().lower() not in candidate_set
    ]


def compute_critical_skill_penalty(
    job_title: str,
    required_skills: Iterable[str],
    candidate_skills: Iterable[str],
    essential_skills: Optional[Iterable[str]] = None,
    base_score: float = 100.0,
) -> dict:
    """Legacy helper returning the v2 proportional penalty payload.

    `reduced_by` is expressed in score points (base_score x rate) so callers
    that already display "points" keep working. New code should read
    `mainSkillPenalty` from `services.match_scoring.compute_match_score`, which
    is computed from the real base score.
    """
    essentials = identify_critical_skills(
        job_title, required_skills, essential_skills
    )
    missing = find_missing_critical_skills(essentials, candidate_skills)
    rate = min(
        PENALTY_CAP_RATE,
        PENALTY_PER_MISSING_SKILL * len(missing),
    )
    reduced_by = round(float(base_score) * rate, 2)

    return {
        "critical_skills": essentials,
        "missing": missing,
        "reduced_by": reduced_by,
        "rate": rate,
        "rule": (
            "10% of the base score per missing essential skill, capped at 40%"
        ),
    }
