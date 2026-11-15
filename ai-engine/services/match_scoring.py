"""
Authoritative job-match scoring contract (scoringVersion 2.0.0).

WHY THIS FILE:
Before this module, the same candidate/job pair produced different scores on
different screens because several places rebuilt the formula independently.
This module is the single source of truth for:

    skillMatchScore   = round_half_up(100 * matched / required, 1)
    semanticMatchScore = round_half_up(clamp(semantic, 0, 100), 2)
    baseScore         = round_half_up(0.60 * skill + 0.40 * semantic, 0)
    penaltyRate       = min(0.40, 0.10 * missingEssentialCount)
    finalScore        = round_half_up(clamp(baseScore * (1 - penaltyRate), 0, 100), 0)

Each input is a percentage in the 0-100 range, so the semantic value is never
multiplied by 100 a second time. Rounding is half-up (the same rule the browser
uses), not Python's banker's rounding. The essential-skill penalty is
proportional to the base score and is applied exactly once.

NO DATABASE / MODEL ACCESS:
Every function here is pure. Callers resolve text, semantic model output and
authoritative skill arrays; this module only combines them.
"""

import math
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, List, Optional

from skill_extractor import canonicalize_skills, extract_skills

SCORING_VERSION = "2.0.0"
SKILL_WEIGHT = 0.60
SEMANTIC_WEIGHT = 0.40
PENALTY_PER_MISSING_SKILL = 0.10
PENALTY_CAP_RATE = 0.40


def warning(code: str, message: str) -> dict:
    """Build one plain-language warning entry."""
    return {"code": code, "message": message}


def _finite(value) -> Optional[float]:
    """Return a finite float, or None when the value is not a real number."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def clamp(value, low: float = 0.0, high: float = 100.0) -> float:
    """Clamp a numeric value, treating invalid input as the low bound."""
    number = _finite(value)
    if number is None:
        return low
    return max(low, min(high, number))


def round_half_up(value, digits: int = 0):
    """Round half-up (0.5 -> away from zero) to `digits` decimal places.

    Python's built-in round() uses banker's rounding, which disagrees with the
    browser's Math.round at .5 boundaries. Scoring must be identical on both
    sides, so the contract uses this helper everywhere.
    """
    number = _finite(value)
    if number is None:
        return None
    quantum = Decimal(1).scaleb(-int(digits))
    rounded = Decimal(str(number)).quantize(quantum, rounding=ROUND_HALF_UP)
    return int(rounded) if digits <= 0 else float(rounded)


def _dedupe_warnings(warnings: Iterable[dict]) -> List[dict]:
    """Keep the first warning for each code, preserving order."""
    result: List[dict] = []
    seen = set()
    for item in warnings or []:
        code = (item or {}).get("code")
        if code and code not in seen:
            seen.add(code)
            result.append(item)
    return result


def resolve_required_skills(
    required_skills: Optional[Iterable[str]] = None,
    job_text: str = "",
):
    """Resolve the authoritative required-skill list.

    Precedence:
      1. Explicit authoritative array (Job.requiredSkills).
      2. Skills extracted from the job text, with a warning.

    Returns (skills, warnings).
    """
    explicit = canonicalize_skills(list(required_skills or []))
    if explicit:
        return explicit, []

    inferred = canonicalize_skills(extract_skills(job_text or ""))
    if inferred:
        return inferred, [warning(
            "required_skills_inferred",
            "No authoritative required skills were supplied; they were "
            "inferred from the job description.",
        )]
    return [], []


def resolve_essential_skills(
    job_title: str = "",
    required_skills: Optional[Iterable[str]] = None,
    essential_skills: Optional[Iterable[str]] = None,
):
    """Resolve a job's essential ("main") skills without alphabetically guessing.

    Precedence:
      1. Explicit Job.essentialSkills.
      2. All Job.requiredSkills (with a warning).
      3. Skills named in the job title (with a warning).
      4. None (with a warning).

    Essentials that are not in the authoritative required list are ignored,
    because a skill cannot be both required and absent from the denominator.

    Returns (skills, warnings).
    """
    explicit = canonicalize_skills(list(essential_skills or []))
    required = canonicalize_skills(list(required_skills or []))
    warnings: List[dict] = []

    if explicit:
        if required:
            required_set = set(required)
            filtered = [skill for skill in explicit if skill in required_set]
            dropped = [skill for skill in explicit if skill not in required_set]
            if dropped:
                warnings.append(warning(
                    "essential_skills_not_in_required",
                    "These essential skills are not in the required-skill list "
                    f"and were ignored: {', '.join(dropped)}.",
                ))
            if not filtered:
                warnings.append(warning(
                    "essential_skills_not_specified",
                    "No essential skill is present in the required-skill list; "
                    "no essential-skill penalty was applied.",
                ))
            return filtered, warnings
        return explicit, warnings

    if required:
        warnings.append(warning(
            "essential_skills_defaulted_to_required",
            f"No explicit essential skills were set; all {len(required)} "
            "required skills were treated as essential.",
        ))
        return required, warnings

    title_skills = canonicalize_skills(extract_skills(job_title or ""))
    if title_skills:
        warnings.append(warning(
            "essential_skills_inferred_from_title",
            "No required or essential skills were supplied; essential skills "
            f"were inferred from the job title: {', '.join(title_skills)}.",
        ))
        return title_skills, warnings

    warnings.append(warning(
        "essential_skills_not_specified",
        "No essential skills were specified, so no essential-skill penalty "
        "was applied.",
    ))
    return [], warnings


def compute_match_score(
    candidate_skills: Optional[Iterable[str]] = None,
    required_skills: Optional[Iterable[str]] = None,
    essential_skills: Optional[Iterable[str]] = None,
    semantic_score=None,
    semantic_source: str = "unavailable",
    semantic_model: Optional[str] = None,
    extra_warnings: Optional[Iterable[dict]] = None,
    scoring_version: str = SCORING_VERSION,
) -> dict:
    """Compute the complete v2 scoring contract from already-resolved inputs.

    Returns a dict containing both the contract fields and a `scoreBreakdown`
    suitable for the UI. All scores are percentages (0-100). `finalScore` and
    `baseScore` are integers; `skillMatchScore` and `semanticMatchScore` keep
    their documented decimal precision.
    """
    warnings: List[dict] = list(extra_warnings or [])

    candidate = canonicalize_skills(list(candidate_skills or []))
    required = canonicalize_skills(list(required_skills or []))
    essentials = canonicalize_skills(list(essential_skills or []))

    candidate_set = set(candidate)
    required_set = set(required)

    # The authoritative denominator: required skills only.
    matched = [skill for skill in required if skill in candidate_set]
    missing = [skill for skill in required if skill not in candidate_set]

    if required:
        skill_match_score = round_half_up(
            (len(matched) / len(required)) * 100.0, 1
        )
    else:
        skill_match_score = None
        warnings.append(warning(
            "no_required_skills",
            "This job has no required skills, so the skill component could not "
            "be calculated; the score is based on the semantic component only.",
        ))

    semantic_number = _finite(semantic_score)
    if semantic_number is None:
        semantic_match_score = None
        warnings.append(warning(
            "semantic_unavailable",
            "No semantic match score was available; the score is based on the "
            "skill component only.",
        ))
    else:
        semantic_match_score = round_half_up(
            clamp(semantic_number, 0.0, 100.0), 2
        )

    # Base score: both components when available, otherwise the one that is.
    if skill_match_score is not None and semantic_match_score is not None:
        base_raw = (
            SKILL_WEIGHT * skill_match_score
            + SEMANTIC_WEIGHT * semantic_match_score
        )
        base_score = round_half_up(base_raw, 0)
    elif skill_match_score is not None:
        base_score = round_half_up(skill_match_score, 0)
    elif semantic_match_score is not None:
        base_score = round_half_up(semantic_match_score, 0)
    else:
        base_score = 0
        warnings.append(warning(
            "insufficient_data",
            "Neither skill nor semantic evidence was available; the final "
            "score is 0.",
        ))

    if not candidate:
        warnings.append(warning(
            "no_candidate_skills",
            "No candidate skills were found, so required skills cannot be "
            "matched.",
        ))

    # Essentials are authoritative. When a required list exists, an essential
    # outside it cannot be part of the denominator and is ignored.
    if required_set:
        unexpected = [skill for skill in essentials if skill not in required_set]
        if unexpected:
            essentials = [skill for skill in essentials if skill in required_set]
            warnings.append(warning(
                "essential_skills_not_in_required",
                "These essential skills are not in the required-skill list and "
                f"were ignored: {', '.join(unexpected)}.",
            ))

    if not essentials:
        warnings.append(warning(
            "essential_skills_not_specified",
            "No essential skills were specified, so no essential-skill penalty "
            "was applied.",
        ))

    missing_main = [skill for skill in essentials if skill not in candidate_set]
    missing_count = len(missing_main)
    penalty_rate = min(
        PENALTY_CAP_RATE,
        PENALTY_PER_MISSING_SKILL * missing_count,
    )
    penalty_points = (
        round_half_up(base_score * penalty_rate, 2) if penalty_rate else 0.0
    )
    final_raw = base_score * (1.0 - penalty_rate)
    final_score = round_half_up(clamp(final_raw, 0.0, 100.0), 0)

    if missing_count > int(PENALTY_CAP_RATE / PENALTY_PER_MISSING_SKILL):
        warnings.append(warning(
            "penalty_cap_applied",
            f"{missing_count} essential skills are missing; the penalty is "
            f"capped at {int(PENALTY_CAP_RATE * 100)}%.",
        ))

    if semantic_source == "tfidf_fallback":
        warnings.append(warning(
            "semantic_fallback_tfidf",
            "The AI semantic model was unavailable; TF-IDF text similarity was "
            "used as the semantic component.",
        ))

    penalty_rule = (
        "10% of the base score per missing essential skill, capped at 40%"
    )
    main_skill_penalty = {
        "perSkillRate": PENALTY_PER_MISSING_SKILL,
        "capRate": PENALTY_CAP_RATE,
        "rate": penalty_rate,
        "points": penalty_points,
        "missingCount": missing_count,
        "missing": missing_main,
        "essentialSkills": essentials,
        "rule": penalty_rule,
    }

    # Human-readable formula, built from the exact values that were used.
    semantic_text = (
        f"{semantic_match_score}" if semantic_match_score is not None
        else "not available"
    )
    if skill_match_score is not None and semantic_match_score is not None:
        formula = (
            f"skill {skill_match_score} (60%) + semantic {semantic_text} (40%) "
            f"= {base_score}; {base_score} x (1 - {penalty_rate:.2f}) = "
            f"{round_half_up(final_raw, 2)} -> {final_score}"
        )
    elif skill_match_score is not None:
        formula = (
            f"skill {skill_match_score} (semantic not available) = "
            f"{base_score}; {base_score} x (1 - {penalty_rate:.2f}) = "
            f"{round_half_up(final_raw, 2)} -> {final_score}"
        )
    elif semantic_match_score is not None:
        formula = (
            f"semantic {semantic_text} (required skills not available) = "
            f"{base_score}; {base_score} x (1 - {penalty_rate:.2f}) = "
            f"{round_half_up(final_raw, 2)} -> {final_score}"
        )
    else:
        formula = "no skill or semantic evidence -> 0"

    steps = []
    if skill_match_score is not None:
        steps.append({
            "key": "skill",
            "label": "Required skill match",
            "numerator": len(matched),
            "denominator": len(required),
            "value": skill_match_score,
            "weight": SKILL_WEIGHT,
            "contribution": round_half_up(
                skill_match_score * SKILL_WEIGHT, 2
            ),
        })
    else:
        steps.append({
            "key": "skill",
            "label": "Required skill match",
            "value": None,
            "weight": SKILL_WEIGHT,
            "contribution": 0,
        })

    if semantic_match_score is not None:
        steps.append({
            "key": "semantic",
            "label": "Semantic match",
            "value": semantic_match_score,
            "weight": SEMANTIC_WEIGHT,
            "contribution": round_half_up(
                semantic_match_score * SEMANTIC_WEIGHT, 2
            ),
        })
    else:
        steps.append({
            "key": "semantic",
            "label": "Semantic match",
            "value": None,
            "weight": SEMANTIC_WEIGHT,
            "contribution": 0,
        })

    steps.append({"key": "base", "label": "Base score", "value": base_score})
    steps.append({
        "key": "penalty",
        "label": "Essential-skill penalty",
        "value": -penalty_points,
        "rate": penalty_rate,
        "missing": missing_main,
    })
    steps.append({"key": "final", "label": "Final score", "value": final_score})

    score_breakdown = {
        "contractWeights": {
            "skills": SKILL_WEIGHT,
            "semantic": SEMANTIC_WEIGHT,
        },
        "semanticScoreSource": semantic_source,
        "semanticModel": semantic_model,
        "rounding": "half-up",
        "formula": formula,
        "steps": steps,
    }

    return {
        "scoringVersion": scoring_version,
        "skillMatchScore": skill_match_score,
        "semanticMatchScore": semantic_match_score,
        "baseScore": base_score,
        "finalScore": int(final_score),
        "matchedSkills": matched,
        "missingSkills": missing,
        "missingMainSkills": missing_main,
        "requiredSkills": required,
        "essentialSkills": essentials,
        "candidateSkills": candidate,
        "mainSkillPenalty": main_skill_penalty,
        "scoreBreakdown": score_breakdown,
        "warnings": _dedupe_warnings(warnings),
    }
