"""
STEP 27A — Isolated V2 FinalScore fallback-policy module (POLICY + TESTING ONLY).

WHAT THIS IS:
The exact, testable fallback behavior that the future Step-27 finalScore
integration will apply when the proposed V2 semantic component
(`semantic_match_enriched.match_percentage_v2_calibrated`) is unavailable
because Resume.rawText is missing.

ISOLATION GUARANTEES (verified by grep in the Step 27A report):
- NOT imported by app/routers/matching.py, ai/ranking_engine.py, or any other
  production module. Zero production behavior changes until Step 27 wires it.
- The V2-disabled path and Fallback A both delegate to the production
  ai.ranking_engine.calculate_final_score, so they reproduce today's finalScore
  bit-for-bit (same clamp, same 0.60/0.40 weights, same round).

FORMULAS (semantic-component slot of the existing blend):
  V2 available          : final = calculate_final_score(skill, V2)      # proposed Step-27 main path
  V2 disabled (flag off): final = calculate_final_score(skill, tfidf)   # exact current production
  Fallback A (legacy)   : final = calculate_final_score(skill, tfidf)   # 0.60*skill + 0.40*TF-IDF
  Fallback B (zero)     : final = calculate_final_score(skill, 0)       # 0.60*skill
  Fallback C (renormal.): final = round(clamp(skill))                   # skill coverage = 100% of score

NON-FINITE INPUTS: rejected with ValueError — never silently coerced to 0 or
100. For finite inputs the result is always a Python int in [0, 100].
"""
import math

from ai.ranking_engine import calculate_final_score, _clamp_percentage

POLICIES = ("A", "B", "C")

POLICY_FORMULAS = {
    "A": "0.60 * skill_coverage + 0.40 * legacy_TFIDF_similarity",
    "B": "0.60 * skill_coverage  (semantic component = 0)",
    "C": "0.60 * skill_coverage / 0.60 = skill_coverage  (weights renormalized)",
}

POLICY_NAMES = {
    "A": "legacy TF-IDF fallback",
    "B": "semantic component = 0",
    "C": "renormalize: skill coverage = 100% of score",
}


def _finite(name, value):
    """Reject non-numeric / NaN / Infinity inputs explicitly (NaN guard)."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        raise ValueError("%s must be a number, got %r" % (name, value))
    if not math.isfinite(v):
        raise ValueError("%s must be finite, got %r" % (name, value))
    return v


def _result(score, component, source, fallback_applied, v2_present, v2_enabled, policy, formula):
    score = int(round(float(score)))
    score = int(max(0, min(100, score)))  # output ALWAYS an int in [0,100]
    assert math.isfinite(score)
    return {
        "final_score": score,
        "semantic_component": float(component),
        "semantic_source": source,
        "fallback_applied": fallback_applied,
        "v2_available": v2_present,
        "v2_enabled": v2_enabled,
        "policy": policy,
        "formula": formula,
    }


def calculate_final_score_v2(
    skill_match_score,
    legacy_tfidf_similarity,
    v2_calibrated=None,
    policy="A",
    v2_enabled=True,
):
    """
    Compute the (future) finalScore with explicit, documented V2 handling.

    skill_match_score       : skill coverage % (inputs clamped like production)
    legacy_tfidf_similarity : existing TF-IDF similarity % (current 0.40 input)
    v2_calibrated           : V2 calibrated % or None (None => V2 UNAVAILABLE)
    policy                  : 'A' | 'B' | 'C' — used ONLY when v2 is None
    v2_enabled              : False => exact current production formula

    Returns dict: final_score (int 0-100), semantic_component, semantic_source,
    fallback_applied, v2_available, v2_enabled, policy, formula.
    Raises ValueError on unknown policy or non-finite inputs.
    """
    if policy not in POLICIES:
        raise ValueError("unknown policy %r; expected one of %s" % (policy, POLICIES))

    skill = _finite("skill_match_score", skill_match_score)
    tfidf = _finite("legacy_tfidf_similarity", legacy_tfidf_similarity)
    v2 = None if v2_calibrated is None else _finite("v2_calibrated", v2_calibrated)

    # ---- V2 disabled (engine flag off): EXACT current production behavior ----
    if not v2_enabled:
        return _result(
            calculate_final_score(skill, tfidf), tfidf, "legacy_tfidf",
            False, v2 is not None, False, policy,
            "v2_enabled=False -> exact production 0.60*skill + 0.40*tfidf",
        )

    # ---- V2 available: V2 is used, regardless of policy ----
    if v2 is not None:
        return _result(
            calculate_final_score(skill, v2), v2, "v2",
            False, True, True, policy,
            "0.60*skill + 0.40*V2_calibrated",
        )

    # ---- V2 UNAVAILABLE (rawText missing) -> selected fallback ----
    if policy == "A":
        score = calculate_final_score(skill, tfidf)
        component, source = tfidf, "legacy_tfidf"
    elif policy == "B":
        score = calculate_final_score(skill, 0.0)
        component, source = 0.0, "zero"
    else:  # policy == "C"
        component = _clamp_percentage(skill)
        score = round(component)
        source = "skill_renormalized"

    return _result(score, component, source, True, False, True, policy, POLICY_FORMULAS[policy])
