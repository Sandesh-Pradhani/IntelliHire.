"""
Router-level tests for the v2 job-match contract.

WHY THIS FILE:
`services.match_scoring` is only useful if the API actually feeds it the
authoritative inputs and returns every contract field. These tests invoke the
real FastAPI router coroutine with only the SBERT call stubbed out, so a
regression in input resolution, V2 selection, or response serialization fails.

COVERAGE:
- explicit candidate/required/essential arrays win over text extraction
- V2 present -> semanticMatchScore is the V2 value and source is sbert_v2_*
- V2 absent  -> semanticMatchScore is TF-IDF and a fallback warning is emitted
- no required skills -> semantic-only score with a warning
- /extract-skills returns canonical names
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.routers import matching as matching_mod  # noqa: E402
from app.schemas.matching import JobMatchRequest, SkillExtractionRequest  # noqa: E402
from services.match_scoring import compute_match_score, round_half_up  # noqa: E402

RESUME = (
    "MERN developer with MongoDB, React, Node.js, Express and AWS experience."
)
JOB = "MERN Stack Developer. Build APIs with Node.js, Express, MongoDB, React, Jest and AWS."


class FakeSemantic:
    """Deterministic stand-in for the SBERT semantic pass."""

    def __init__(self, v2=None, match_percentage=30.0):
        self.v2 = v2
        self.match_percentage = match_percentage
        self.calls = []

    def __call__(self, resume_text, job_text, model_name="all-MiniLM-L6-v2"):
        self.calls.append(resume_text)
        payload = {
            "match_percentage": self.match_percentage,
            "similarity_score": self.match_percentage,
            "reasons": [],
            "model_used": "fake-sbert",
        }
        if self.v2 is not None:
            payload["match_percentage_v2_calibrated"] = self.v2
            payload["ab_finetuned_model_path"] = "fake-v2"
        return payload


def run_match(monkeypatch, fake, **request_kwargs):
    monkeypatch.setattr(
        matching_mod, "compute_semantic_match_with_reasons", fake
    )
    kwargs = {"resume": RESUME, "job": JOB, **request_kwargs}
    request = JobMatchRequest(**kwargs)
    envelope = asyncio.run(matching_mod.job_match(request))
    assert envelope["success"] is True
    return envelope["data"]


def required_arrays():
    return {
        "requiredSkills": ["react", "node.js", "mongodb", "express", "jest", "aws"],
        "essentialSkills": ["react", "node.js", "mongodb", "express", "jest", "aws"],
    }


# ── V2 present ──────────────────────────────────────────────────────────────
def test_v2_value_is_the_semantic_component(monkeypatch):
    fake = FakeSemantic(v2=73.48)
    data = run_match(
        monkeypatch,
        fake,
        candidateSkills=["react", "node.js", "mongodb", "express"],
        **required_arrays(),
    )

    expected = compute_match_score(
        candidate_skills=["react", "node.js", "mongodb", "express"],
        required_skills=required_arrays()["requiredSkills"],
        essential_skills=required_arrays()["essentialSkills"],
        semantic_score=73.48,
    )

    assert data["semanticMatchScore"] == 73.48
    assert data["scoreBreakdown"]["semanticScoreSource"].startswith("sbert_v2")
    assert data["skillMatchScore"] == expected["skillMatchScore"]
    assert data["baseScore"] == expected["baseScore"]
    assert data["finalScore"] == expected["finalScore"]
    assert data["mainSkillPenalty"] == expected["mainSkillPenalty"]


# ── V2 absent -> TF-IDF fallback ────────────────────────────────────────────
def test_missing_v2_uses_tfidf_and_warns(monkeypatch):
    fake = FakeSemantic(v2=None, match_percentage=30.0)
    data = run_match(
        monkeypatch,
        fake,
        candidateSkills=["react", "node.js", "mongodb", "express"],
        **required_arrays(),
    )

    assert data["semanticMatchScore"] == data["similarity"]
    assert data["scoreBreakdown"]["semanticScoreSource"] == "tfidf_fallback"
    codes = {warning["code"] for warning in data["warnings"]}
    assert "semantic_fallback_tfidf" in codes


# ── Explicit inputs are authoritative ───────────────────────────────────────
def test_explicit_skill_arrays_win_over_text_extraction(monkeypatch):
    fake = FakeSemantic(v2=50.0, match_percentage=50.0)
    data = run_match(
        monkeypatch,
        fake,
        candidateSkills=["ReactJS", "Node"],
        requiredSkills=["react", "node.js", "mongodb"],
        essentialSkills=["react", "node.js", "mongodb"],
    )

    assert data["candidateSkills"] == ["react", "node.js"]
    assert data["requiredSkills"] == ["react", "node.js", "mongodb"]
    assert data["matchedSkills"] == ["react", "node.js"]
    assert data["missingSkills"] == ["mongodb"]
    assert data["skillMatchScore"] == 66.7
    # base = 0.6*66.7 + 0.4*50 = 60.02 -> 60; one missing -> 54
    assert data["baseScore"] == 60
    assert data["finalScore"] == 54


def test_no_required_skills_falls_back_to_semantic_only(monkeypatch):
    fake = FakeSemantic(v2=60.0, match_percentage=60.0)
    data = run_match(
        monkeypatch,
        fake,
        resume="A great teammate who communicates clearly.",
        job="We need a great teammate.",
        candidateSkills=["python"],
        requiredSkills=[],
        essentialSkills=[],
    )

    assert data["skillMatchScore"] is None
    assert data["semanticMatchScore"] == 60.0
    assert data["baseScore"] == 60
    assert data["finalScore"] == 60
    codes = {warning["code"] for warning in data["warnings"]}
    assert "no_required_skills" in codes


# ── Response contract / serialization ───────────────────────────────────────
def test_response_contains_every_contract_field(monkeypatch):
    fake = FakeSemantic(v2=40.82)
    data = run_match(
        monkeypatch,
        fake,
        candidateSkills=["mongodb", "react"],
        **required_arrays(),
    )

    for field in (
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
        "scoreBreakdown",
        "warnings",
        # legacy fields kept for existing consumers
        "similarity",
        "score_breakdown",
        "candidateSkills",
        "unified_ranking",
    ):
        assert field in data, f"missing contract field: {field}"

    assert data["scoringVersion"] == "2.0.0"
    assert isinstance(data["finalScore"], int)
    assert 0 <= data["finalScore"] <= 100
    # Six required, two matched, four missing -> 40% cap.
    assert data["skillMatchScore"] == 33.3
    assert data["baseScore"] == 36
    assert data["finalScore"] == 22


# ── Semantic-model identity (additive snapshot provenance) ──────────────────
def test_v2_run_reports_semantic_model_identity(monkeypatch):
    fake = FakeSemantic(v2=50.0)
    data = run_match(monkeypatch, fake, **required_arrays())

    info = data["semanticModelInfo"]
    assert info["modelId"] == "fake-v2"
    # "fake-v2" is not a real directory: hash and calibration stay explicitly
    # None instead of being invented.
    assert info["weightsSHA256"] is None
    assert info["calibration"] is None


def test_fallback_run_reports_tfidf_identity(monkeypatch):
    fake = FakeSemantic(v2=None, match_percentage=30.0)
    data = run_match(monkeypatch, fake, **required_arrays())

    assert data["semanticModelInfo"] == {
        "modelId": "tf-idf",
        "weightsSHA256": None,
        "calibration": None,
    }


def test_scoring_contract_is_computed_exactly_once(monkeypatch):
    """Final Score must come from one contract evaluation, not a second pass."""
    real = matching_mod.compute_match_score
    calls = []

    def counting(*args, **kwargs):
        calls.append(1)
        return real(*args, **kwargs)

    monkeypatch.setattr(matching_mod, "compute_match_score", counting)
    fake = FakeSemantic(v2=50.0)
    data = run_match(monkeypatch, fake, **required_arrays())

    assert len(calls) == 1
    assert isinstance(data["finalScore"], int)


def test_response_breakdown_reconciles_with_final_score(monkeypatch):
    """Every displayed step must reconcile with the returned Final Score."""
    fake = FakeSemantic(v2=61.79)
    data = run_match(
        monkeypatch,
        fake,
        candidateSkills=["mongodb", "react", "node.js"],
        **required_arrays(),
    )

    expected_base = round_half_up(
        0.60 * data["skillMatchScore"] + 0.40 * data["semanticMatchScore"]
    )
    rate = data["mainSkillPenalty"]["rate"]
    expected_final = round_half_up(expected_base * (1 - rate))

    assert data["skillMatchScore"] == 50.0
    assert data["baseScore"] == expected_base
    assert data["finalScore"] == expected_final
    assert data["score_breakdown"]["final_score_pre_penalty"] == expected_base
    assert (
        data["score_breakdown"]["critical_skill_penalty"]["reduced_by"]
        == data["mainSkillPenalty"]["points"]
    )

    steps = {step["key"]: step for step in data["scoreBreakdown"]["steps"]}
    assert steps["base"]["value"] == expected_base
    assert steps["penalty"]["value"] == -data["mainSkillPenalty"]["points"]
    assert steps["final"]["value"] == expected_final


def test_configured_essentials_are_not_replaced_by_required(monkeypatch):
    """Essentials are a curated subset; they never become all required skills."""
    fake = FakeSemantic(v2=50.0)
    data = run_match(
        monkeypatch,
        fake,
        candidateSkills=["node.js", "mongodb"],
        requiredSkills=["react", "node.js", "mongodb"],
        essentialSkills=["react"],
    )

    assert data["requiredSkills"] == ["react", "node.js", "mongodb"]
    assert data["essentialSkills"] == ["react"]
    assert data["missingSkills"] == ["react"]
    assert data["missingMainSkills"] == ["react"]
    assert data["mainSkillPenalty"]["missingCount"] == 1
    assert data["mainSkillPenalty"]["rate"] == 0.10


def test_extract_skills_endpoint_returns_canonical_names():
    envelope = asyncio.run(
        matching_mod.extract_skill_list(
            SkillExtractionRequest(text="ReactJS, Node.js, Express.js, AWS")
        )
    )
    assert envelope["success"] is True
    assert set(envelope["data"]["skills"]) == {
        "react", "node.js", "express", "aws",
    }
