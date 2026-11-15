"""
Authoritative v2 job-match scoring contract tests.

WHY THIS FILE:
The audit found several competing score formulas on different screens. These
tests pin the ONE contract that is now implemented by
`services.match_scoring.compute_match_score`:

    skillMatchScore    = round_half_up(100 * matched / required, 1)
    semanticMatchScore = round_half_up(clamp(semantic, 0, 100), 2)
    baseScore          = round_half_up(0.60 * skill + 0.40 * semantic, 0)
    finalScore         = round_half_up(base * (1 - penaltyRate), 0)
    penaltyRate        = min(0.40, 0.10 * missingEssentialCount)

The tests cover V2-present/V2-absent semantic values, missing raw text,
aliases, unrelated resumes, jobs without required/essential skills, rounding
boundaries, and the extractor boundary regressions that caused false positives
("JavaScript" -> java, "payroll laws" -> aws, "reactive" -> react).
"""

import math
import os
import sys

import pytest

# Same path convention as the other tests in this directory.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.match_scoring import (  # noqa: E402
    PENALTY_CAP_RATE,
    PENALTY_PER_MISSING_SKILL,
    SCORING_VERSION,
    clamp,
    compute_match_score,
    resolve_essential_skills,
    resolve_required_skills,
    round_half_up,
)
from skill_extractor import (  # noqa: E402
    canonicalize_skills,
    extract_skills,
    normalize_skill_name,
)

CONTRACT_FIELDS = {
    "scoringVersion",
    "skillMatchScore",
    "semanticMatchScore",
    "baseScore",
    "mainSkillPenalty",
    "finalScore",
    "matchedSkills",
    "missingSkills",
    "missingMainSkills",
    "requiredSkills",
    "essentialSkills",
    "candidateSkills",
    "scoreBreakdown",
    "warnings",
}


def score(**overrides):
    """Build a contract result with explicit, authoritative inputs."""
    kwargs = {
        "candidate_skills": ["mongodb", "react"],
        "required_skills": ["mongodb", "express", "react", "node.js", "jest", "aws"],
        "essential_skills": ["mongodb", "express", "react", "node.js", "jest", "aws"],
        "semantic_score": 40.82,
        "semantic_source": "sbert_v2_enriched",
    }
    kwargs.update(overrides)
    return compute_match_score(**kwargs)


# ── 1. Contract shape and version ────────────────────────────────────────────
def test_contract_is_complete_and_versioned():
    result = score()
    assert CONTRACT_FIELDS.issubset(result.keys())
    assert result["scoringVersion"] == SCORING_VERSION


def test_scores_are_bounded_and_final_is_int():
    result = score()
    assert isinstance(result["finalScore"], int)
    assert not isinstance(result["finalScore"], bool)
    assert 0 <= result["finalScore"] <= 100
    assert 0 <= result["baseScore"] <= 100
    assert 0 <= result["skillMatchScore"] <= 100
    assert 0 <= result["semanticMatchScore"] <= 100


# ── 2. Authoritative denominator ─────────────────────────────────────────────
def test_skill_component_uses_authoritative_required_list():
    result = score()
    assert result["requiredSkills"] == [
        "mongodb", "express", "react", "node.js", "jest", "aws",
    ]
    assert result["matchedSkills"] == ["mongodb", "react"]
    assert result["missingSkills"] == ["express", "node.js", "jest", "aws"]
    # 2 of 6 -> 33.3, NOT the old 36.4 from an inferred 11-skill list.
    assert result["skillMatchScore"] == 33.3


def test_prose_only_skills_are_not_in_the_denominator():
    result = score(
        required_skills=["react", "node.js"],
        essential_skills=["react", "node.js"],
        candidate_skills=["react"],
        semantic_score=50,
    )
    assert "digitalocean" not in result["requiredSkills"]
    assert "enzyme" not in result["requiredSkills"]
    assert result["skillMatchScore"] == 50.0


# ── 3. Semantic input is already a percentage ────────────────────────────────
def test_semantic_score_is_not_multiplied_by_100():
    result = score(semantic_score=40.82)
    assert result["semanticMatchScore"] == 40.82


def test_semantic_score_is_clamped():
    assert score(semantic_score=140)["semanticMatchScore"] == 100.0
    assert score(semantic_score=-20)["semanticMatchScore"] == 0.0


# ── 4. Base score weighting ──────────────────────────────────────────────────
def test_base_score_is_sixty_forty():
    result = score()
    # 0.6 * 33.3 + 0.4 * 40.82 = 36.308 -> 36
    assert result["baseScore"] == 36
    assert result["scoreBreakdown"]["contractWeights"] == {
        "skills": 0.60,
        "semantic": 0.40,
    }


def test_base_score_shows_both_component_contributions():
    steps = {step["key"]: step for step in score()["scoreBreakdown"]["steps"]}
    assert steps["skill"]["numerator"] == 2
    assert steps["skill"]["denominator"] == 6
    assert steps["skill"]["contribution"] == 19.98
    assert steps["semantic"]["contribution"] == 16.33
    assert steps["base"]["value"] == 36
    assert steps["final"]["value"] == 22


# ── 5. Essential-skill penalty ───────────────────────────────────────────────
def test_one_missing_essential_is_ten_percent_of_base():
    result = score(
        candidate_skills=["react", "node.js", "mongodb", "express"],
        required_skills=["react", "node.js", "mongodb", "express", "aws"],
        essential_skills=["react", "node.js", "mongodb", "express", "aws"],
        semantic_score=80,
    )
    # skill 80, semantic 80 -> base 80; one missing -> 80 * 0.9 = 72
    assert result["baseScore"] == 80
    assert result["mainSkillPenalty"]["rate"] == pytest.approx(0.10)
    assert result["mainSkillPenalty"]["points"] == pytest.approx(8.0)
    assert result["finalScore"] == 72


def test_penalty_is_applied_once_not_twice():
    result = score(
        candidate_skills=["react", "node.js", "mongodb", "express"],
        required_skills=["react", "node.js", "mongodb", "express", "aws"],
        essential_skills=["react", "node.js", "mongodb", "express", "aws"],
        semantic_score=80,
    )
    # Applying 10% twice would be 64.8 -> 65; the contract applies it once.
    assert result["finalScore"] == 72
    assert result["finalScore"] != 65


def test_penalty_caps_at_forty_percent():
    result = score(
        candidate_skills=[],
        required_skills=["react", "node.js", "mongodb", "express", "aws"],
        essential_skills=["react", "node.js", "mongodb", "express", "aws"],
        semantic_score=100,
    )
    assert result["mainSkillPenalty"]["missingCount"] == 5
    assert result["mainSkillPenalty"]["rate"] == pytest.approx(PENALTY_CAP_RATE)
    # base = 0.4 * 100 = 40; 40 * 0.6 = 24
    assert result["baseScore"] == 40
    assert result["finalScore"] == 24
    codes = {warning["code"] for warning in result["warnings"]}
    assert "penalty_cap_applied" in codes


def test_no_missing_essential_means_no_penalty():
    result = score(
        candidate_skills=["react", "node.js"],
        required_skills=["react", "node.js"],
        essential_skills=["react", "node.js"],
        semantic_score=70,
    )
    assert result["mainSkillPenalty"]["rate"] == 0
    assert result["mainSkillPenalty"]["points"] == 0
    assert result["finalScore"] == result["baseScore"]


def test_essential_skill_outside_required_is_ignored():
    result = score(
        candidate_skills=["react"],
        required_skills=["react"],
        essential_skills=["react", "aws"],
        semantic_score=50,
    )
    assert result["essentialSkills"] == ["react"]
    assert result["missingMainSkills"] == []
    codes = {warning["code"] for warning in result["warnings"]}
    assert "essential_skills_not_in_required" in codes


# ── 6. Missing raw text / missing semantic data ──────────────────────────────
def test_missing_semantic_uses_skill_only_and_warns():
    result = score(semantic_score=None, semantic_source="unavailable")
    assert result["semanticMatchScore"] is None
    assert result["baseScore"] == 33  # round_half_up(33.3)
    # four missing essentials -> 40% cap
    assert result["finalScore"] == 20  # 33 * 0.6 = 19.8 -> 20
    codes = {warning["code"] for warning in result["warnings"]}
    assert "semantic_unavailable" in codes


def test_explicit_zero_semantic_is_a_value_not_missing():
    result = score(semantic_score=0)
    assert result["semanticMatchScore"] == 0.0
    assert result["scoreBreakdown"]["semanticScoreSource"] == "sbert_v2_enriched"
    assert "semantic_unavailable" not in {
        warning["code"] for warning in result["warnings"]
    }


def test_tfidf_fallback_is_explained():
    result = score(semantic_score=55.5, semantic_source="tfidf_fallback")
    assert result["scoreBreakdown"]["semanticScoreSource"] == "tfidf_fallback"
    codes = {warning["code"] for warning in result["warnings"]}
    assert "semantic_fallback_tfidf" in codes


# ── 7. Aliases and unrelated resumes ────────────────────────────────────────
def test_aliases_are_canonicalized_before_matching():
    result = score(
        candidate_skills=["ReactJS", "Node", "Express.js"],
        required_skills=["react", "node.js", "express", "mongodb"],
        essential_skills=["react", "node.js", "express", "mongodb"],
        semantic_score=50,
    )
    assert result["candidateSkills"] == ["react", "node.js", "express"]
    assert result["skillMatchScore"] == 75.0
    assert result["missingSkills"] == ["mongodb"]


def test_unrelated_resume_scores_low():
    result = score(
        candidate_skills=["cooking", "sales", "public speaking"],
        required_skills=["react", "node.js", "mongodb"],
        essential_skills=["react", "node.js", "mongodb"],
        semantic_score=10,
    )
    assert result["skillMatchScore"] == 0.0
    assert result["baseScore"] == 4  # 0.4 * 10
    assert result["finalScore"] <= 5


# ── 8. No required / no essential skills ────────────────────────────────────
def test_no_required_skills_uses_semantic_only():
    result = score(
        candidate_skills=["python"],
        required_skills=[],
        essential_skills=[],
        semantic_score=64,
    )
    assert result["skillMatchScore"] is None
    assert result["baseScore"] == 64
    assert result["finalScore"] == 64
    codes = {warning["code"] for warning in result["warnings"]}
    assert "no_required_skills" in codes
    assert "essential_skills_not_specified" in codes


def test_no_evidence_at_all_returns_zero_with_warning():
    result = score(
        candidate_skills=[],
        required_skills=[],
        essential_skills=[],
        semantic_score=None,
    )
    assert result["baseScore"] == 0
    assert result["finalScore"] == 0
    codes = {warning["code"] for warning in result["warnings"]}
    assert "insufficient_data" in codes


# ── 9. Rounding is half-up, not banker's rounding ───────────────────────────
@pytest.mark.parametrize("value,digits,expected", [
    (2.5, 0, 3),
    (0.5, 0, 1),
    (1.5, 0, 2),
    (2.675, 2, 2.68),
    (33.333, 1, 33.3),
    (33.35, 1, 33.4),
])
def test_round_half_up(value, digits, expected):
    assert round_half_up(value, digits) == pytest.approx(expected)


def test_clamp_handles_invalid_values():
    assert clamp(None) == 0
    assert clamp(float("nan")) == 0
    assert clamp(-5) == 0
    assert clamp(150) == 100


# ── 10. Input resolution ────────────────────────────────────────────────────
def test_required_skills_are_inferred_only_when_absent():
    skills, warnings = resolve_required_skills(None, "React Node.js MongoDB")
    assert "react" in skills and "node.js" in skills
    assert warnings and warnings[0]["code"] == "required_skills_inferred"

    explicit, explicit_warnings = resolve_required_skills(
        ["React"], "React Node.js MongoDB"
    )
    assert explicit == ["react"]
    assert explicit_warnings == []


def test_essential_defaults_to_required_with_warning():
    essentials, warnings = resolve_essential_skills(
        job_title="MERN Developer",
        required_skills=["react", "node.js"],
        essential_skills=None,
    )
    assert essentials == ["react", "node.js"]
    assert any(
        warning["code"] == "essential_skills_defaulted_to_required"
        for warning in warnings
    )


def test_essential_falls_back_to_title_only_when_no_required():
    essentials, warnings = resolve_essential_skills(
        job_title="Python Developer",
        required_skills=[],
        essential_skills=None,
    )
    assert "python" in essentials
    assert any(
        warning["code"] == "essential_skills_inferred_from_title"
        for warning in warnings
    )


# ── 11. Extractor boundary regressions ─────────────────────────────────────
@pytest.mark.parametrize("text,expected", [
    ("JavaScript", ["javascript"]),
    ("I use JavaScript daily", ["javascript"]),
    ("Java and JavaScript", ["java", "javascript"]),
    ("AWS", ["aws"]),
    ("payroll laws", []),
    ("reactive components", []),
    ("React.js", ["react"]),
    ("ReactJS", ["react"]),
    ("Node.js", ["node.js"]),
    ("Express.js", ["express"]),
    ("GitHub", ["github"]),
    ("Git", ["git"]),
])
def test_extractor_boundaries(text, expected):
    assert extract_skills(text) == expected


def test_sast_dast_acronyms_canonicalize_to_full_names():
    """Regression: the Step-14 edit removed the sast/dast alias entries while
    keeping the acronyms in BOUNDARY_SKILLS, so 'SAST' extracted as the bare
    token 'sast' instead of the canonical full name. Sibling security aliases
    (ips, siem, soc) were kept, confirming the removal was unintended.
    """
    assert extract_skills("Experience with SAST and DAST tooling.") == [
        "dynamic application security testing",
        "static application security testing",
    ]
    assert extract_skills("Sast / dast pipelines") == [
        "dynamic application security testing",
        "static application security testing",
    ]


def test_sast_dast_whole_token_matching_has_no_false_positives():
    # 'sast'/'dast' are in BOUNDARY_SKILLS, so the restored aliases still only
    # match whole tokens and must not fire inside unrelated words.
    assert extract_skills("csast dsast") == []


def test_normalize_and_canonicalize_are_exact():
    assert normalize_skill_name("ReactJS") == "react"
    assert normalize_skill_name("Node.js") == "node.js"
    assert normalize_skill_name("Node") == "node.js"
    assert normalize_skill_name("Express.js") == "express"
    assert normalize_skill_name("Java") == "java"
    assert canonicalize_skills(["ReactJS", "Node", "Node.js", "AWS"]) == [
        "react", "node.js", "aws",
    ]


def test_penalty_constants_match_documented_policy():
    assert PENALTY_PER_MISSING_SKILL == 0.10
    assert PENALTY_CAP_RATE == 0.40
