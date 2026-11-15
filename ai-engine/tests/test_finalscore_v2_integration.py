"""
Step 27B focused tests — finalScore semantic-slot selection (Policy A).

WHY THIS FILE:
Step 27B made the EXISTING 40% semantic slot of finalScore consume the SBERT
V2 calibrated score when it is available, and keep the legacy TF-IDF
similarity when it is not. These tests pin that contract in isolation, without
loading any real SBERT model and without touching MongoDB:

- V2 available            -> V2 value is used (skill/TF-IDF/unified_ranking unchanged)
- V2 missing              -> legacy TF-IDF fallback reproduces the OLD formula exactly
- V2 disabled (no flag)   -> byte-identical old production behavior
- explicit 0 is a VALUE   -> never confused with "missing"
- enriched call failure   -> degrades to fallback, never crashes the request
- at most two semantic calls -> no duplicate SBERT inference introduced
- score is a finite int in [0, 100] -> no NaN / Infinity / range drift

Only the semantic model call is replaced; skill extraction, TF-IDF vectorization,
cosine similarity, skill-gap analysis, unified ranking and calculate_final_score
all run for real, so a regression in any of them fails these tests too.
"""

import asyncio
import math
import os
import sys

import pytest

# Add the ai-engine root to the path for imports (same convention as test_services.py)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.routers import matching as matching_mod  # noqa: E402
from app.schemas.matching import JobMatchRequest  # noqa: E402
from ai.ranking_engine import calculate_final_score  # noqa: E402
from services import sbert_embeddings  # noqa: E402

# ── deterministic request fixtures ────────────────────────────────────────────
# `RESUME` is the legacy scoring text (drives skills + TF-IDF).
# `SEMANTIC` is the richer prose and MUST differ from RESUME so the router takes
# its additive enriched path.
RESUME = (
    "Sandesh Pradhani - MERN Stack Developer\n"
    "React Node.js MongoDB Express JavaScript REST API Docker Git\n"
    "Built scalable web applications with React and Node.js"
)
JOB = (
    "MERN Stack Developer\n"
    "Required skills: React Node.js MongoDB Express JavaScript Docker REST API\n"
    "Build scalable web applications and REST APIs"
)
SEMANTIC = (
    "Professional Summary: Full-stack engineer specialising in the MERN stack. "
    "Delivered single-page applications with React, reusable component libraries, "
    "and REST/GraphQL services on Node.js with Express. Modelled document "
    "databases in MongoDB and containerised services with Docker. "
    "Additional exposure to CI pipelines and cloud deployment."
)

V2_VALUE = 73.48        # the Step-23 / Step-27B reference calibrated value
LEGACY_SCORE = 30.0     # deterministic stand-in for production SBERT cosine x100
ENRICHED_SCORE = 61.5


class FakeSemantic:
    """Deterministic stand-in for compute_semantic_match_with_reasons().

    The router calls it once with the legacy resume text and (when supplied)
    once with the richer semantic prose, so calls are discriminated by text.
    """

    def __init__(self, legacy_v2=None, enriched_v2=V2_VALUE,
                 raise_on_enriched=False, legacy_score=LEGACY_SCORE,
                 enriched_score=ENRICHED_SCORE):
        self.legacy_v2 = legacy_v2
        self.enriched_v2 = enriched_v2
        self.raise_on_enriched = raise_on_enriched
        self.legacy_score = legacy_score
        self.enriched_score = enriched_score
        self.calls = []

    def __call__(self, resume_text, job_text, model_name="all-MiniLM-L6-v2"):
        self.calls.append(resume_text)
        is_enriched = resume_text == SEMANTIC
        if is_enriched and self.raise_on_enriched:
            raise RuntimeError("simulated V2 model failure")
        score = self.enriched_score if is_enriched else self.legacy_score
        payload = {
            "match_percentage": score,
            "similarity_score": score,
            "reasons": [],
            "model_used": "fake-sbert",
            "ab_finetuned_enabled": False,
        }
        v2 = self.enriched_v2 if is_enriched else self.legacy_v2
        if v2 is not None:
            payload["match_percentage_v2_calibrated"] = v2
        return payload


def run_job_match(monkeypatch, fake, with_semantic=True):
    """Invoke the real router coroutine with only the semantic model replaced."""
    monkeypatch.setattr(matching_mod, "compute_semantic_match_with_reasons", fake)
    request = JobMatchRequest(
        resume=RESUME,
        job=JOB,
        resume_semantic=SEMANTIC if with_semantic else "",
    )
    envelope = asyncio.run(matching_mod.job_match(request))
    assert envelope["success"] is True
    return envelope["data"]


def baseline(monkeypatch):
    """Pre-27B behavior: no resume_semantic at all -> enriched path never taken."""
    return run_job_match(monkeypatch, FakeSemantic(enriched_v2=None),
                         with_semantic=False)


# ── A. V2 AVAILABLE -> V2 FEEDS THE EXISTING 40% SLOT ─────────────────────────
class TestV2Available:
    def test_v2_is_used_in_existing_slot(self, monkeypatch):
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=V2_VALUE))
        br = data["score_breakdown"]
        assert br["semantic_score_source"] == "sbert_v2"
        assert data["finalScore"] == calculate_final_score(br["skill_match_score"], V2_VALUE)
        # and it really differs from the TF-IDF-only formula
        assert data["finalScore"] != calculate_final_score(
            br["skill_match_score"], br["similarity_score"])

    def test_v2_value_flows_into_enriched_field_unchanged(self, monkeypatch):
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=V2_VALUE))
        assert data["semantic_match_enriched"]["match_percentage_v2_calibrated"] == V2_VALUE

    def test_explicit_zero_v2_is_a_value_not_missing(self, monkeypatch):
        """A genuine 0 semantic score must be used, never treated as 'absent'."""
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=0))
        br = data["score_breakdown"]
        assert br["semantic_score_source"] == "sbert_v2"
        assert data["finalScore"] == calculate_final_score(br["skill_match_score"], 0)
        assert data["finalScore"] != calculate_final_score(
            br["skill_match_score"], br["similarity_score"])

    @pytest.mark.parametrize("v2", [0.0, 12.34, 55.5, 73.48, 100.0])
    def test_no_second_inference_and_bounded_score(self, monkeypatch, v2):
        fake = FakeSemantic(enriched_v2=v2)
        data = run_job_match(monkeypatch, fake)
        # exactly one legacy + one enriched call -> no duplicate SBERT encoding
        assert len(fake.calls) == 2
        assert fake.calls[0] == RESUME and fake.calls[1] == SEMANTIC
        score = data["finalScore"]
        assert isinstance(score, int) and not isinstance(score, bool)
        assert 0 <= score <= 100

    def test_skill_tfidf_semantic_unified_ranking_all_unchanged(self, monkeypatch):
        """V2 may only change finalScore + the additive source indicator."""
        base = baseline(monkeypatch)
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=V2_VALUE))
        b_br, br = base["score_breakdown"], data["score_breakdown"]

        assert br["skill_match_score"] == b_br["skill_match_score"]
        assert br["similarity_score"] == b_br["similarity_score"]
        assert br["weights"] == {"skills": 0.6, "similarity": 0.4}
        assert br["weights"] == b_br["weights"]
        assert data["similarity"] == base["similarity"]
        assert data["semantic_match"] == base["semantic_match"]
        assert data["unified_ranking"] == base["unified_ranking"]
        assert data["matchedSkills"] == base["matchedSkills"]
        assert data["missingSkills"] == base["missingSkills"]

    def test_top_level_similarity_still_equals_tfidf(self, monkeypatch):
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=V2_VALUE))
        assert data["similarity"] == data["score_breakdown"]["similarity_score"]


# ── B. V2 MISSING -> LEGACY TF-IDF FALLBACK (OLD FORMULA EXACTLY) ─────────────
class TestV2Missing:
    def test_fallback_uses_tfidf_and_old_formula(self, monkeypatch):
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=None))
        br = data["score_breakdown"]
        assert br["semantic_score_source"] == "tfidf_fallback"
        assert data["finalScore"] == calculate_final_score(
            br["skill_match_score"], br["similarity_score"])

    def test_missing_v2_reproduces_pre27b_response_exactly(self, monkeypatch):
        base = baseline(monkeypatch)
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=None))
        assert data["finalScore"] == base["finalScore"]
        assert data["score_breakdown"]["skill_match_score"] == \
            base["score_breakdown"]["skill_match_score"]
        assert data["score_breakdown"]["similarity_score"] == \
            base["score_breakdown"]["similarity_score"]
        assert data["unified_ranking"] == base["unified_ranking"]

    def test_enriched_dict_without_v2_key_falls_back(self, monkeypatch):
        """Enriched pass succeeded but the flag was off -> no v2 key -> fallback."""
        data = run_job_match(monkeypatch, FakeSemantic(legacy_v2=None, enriched_v2=None))
        assert data["semantic_match_enriched"] is not None
        assert "match_percentage_v2_calibrated" not in data["semantic_match_enriched"]
        assert data["score_breakdown"]["semantic_score_source"] == "tfidf_fallback"


# ── C. V2 DISABLED -> EXACT OLD BEHAVIOR ─────────────────────────────────────
class TestV2Disabled:
    def test_no_semantic_text_means_single_call_and_old_formula(self, monkeypatch):
        fake = FakeSemantic(enriched_v2=V2_VALUE)
        data = run_job_match(monkeypatch, fake, with_semantic=False)
        assert len(fake.calls) == 1                     # legacy call only
        assert data["semantic_match_enriched"] is None
        assert data["score_breakdown"]["semantic_score_source"] == "tfidf_fallback"
        br = data["score_breakdown"]
        assert data["finalScore"] == calculate_final_score(
            br["skill_match_score"], br["similarity_score"])

    def test_flag_off_finalScore_identical_to_flag_on_missing_v2(self, monkeypatch):
        """V2 OFF == V2 unavailable -> same TF-IDF input, same old score."""
        off = run_job_match(monkeypatch, FakeSemantic(enriched_v2=V2_VALUE),
                            with_semantic=False)
        missing = run_job_match(monkeypatch, FakeSemantic(enriched_v2=None),
                                with_semantic=True)
        assert off["finalScore"] == missing["finalScore"]
        assert off["score_breakdown"]["similarity_score"] == \
            missing["score_breakdown"]["similarity_score"]
        assert off["unified_ranking"] == missing["unified_ranking"]


# ── D. FAILURE / ROBUSTNESS ──────────────────────────────────────────────────
class TestFailureHandling:
    def test_enriched_failure_degrades_to_fallback_without_crash(self, monkeypatch):
        data = run_job_match(monkeypatch, FakeSemantic(raise_on_enriched=True))
        assert data["semantic_match_enriched"] is None
        br = data["score_breakdown"]
        assert br["semantic_score_source"] == "tfidf_fallback"
        assert data["finalScore"] == calculate_final_score(
            br["skill_match_score"], br["similarity_score"])

    @pytest.mark.parametrize("v2", [None, 0, 0.0, 33.33, 69.65, 100])
    def test_no_nan_or_infinity_and_range(self, monkeypatch, v2):
        data = run_job_match(monkeypatch, FakeSemantic(enriched_v2=v2))
        score = data["finalScore"]
        assert not math.isnan(score) and not math.isinf(score)
        assert 0 <= score <= 100
        for key in ("skill_match_score", "similarity_score"):
            value = data["score_breakdown"][key]
            assert not math.isnan(value) and not math.isinf(value)

    def test_standalone_model_loader_failures_return_none(self, monkeypatch, tmp_path):
        """Set-but-broken SBERT_MODEL_PATH must degrade to None, never raise."""
        monkeypatch.setenv(sbert_embeddings.FINETUNED_ENV_VAR, str(tmp_path / "missing"))
        assert sbert_embeddings.get_finetuned_model() is None
        bad_file = tmp_path / "not_a_dir.txt"
        bad_file.write_text("x", encoding="utf-8")
        monkeypatch.setenv(sbert_embeddings.FINETUNED_ENV_VAR, str(bad_file))
        assert sbert_embeddings.get_finetuned_model() is None

    def test_unset_flag_means_no_v2_path(self, monkeypatch):
        monkeypatch.delenv(sbert_embeddings.FINETUNED_ENV_VAR, raising=False)
        assert sbert_embeddings.get_finetuned_ab_path() is None
        assert sbert_embeddings.get_finetuned_model() is None

    def test_model_load_exception_degrades_to_none(self, monkeypatch, tmp_path):
        """A real directory whose model fails to load must degrade to None.

        Simulates a corrupt/incompatible checkpoint: the loader must swallow the
        error (V2 is never a hard dependency) and leave the flag path harmless.
        """
        import types

        model_dir = tmp_path / "fake_v2_model"
        model_dir.mkdir()
        (model_dir / "config.json").write_text("{}", encoding="utf-8")

        class BoomModel:
            def __init__(self, *args, **kwargs):
                raise OSError("cannot load checkpoint")

        fake_module = types.ModuleType("sentence_transformers")
        fake_module.SentenceTransformer = BoomModel
        monkeypatch.setitem(sys.modules, "sentence_transformers", fake_module)
        monkeypatch.setenv(sbert_embeddings.FINETUNED_ENV_VAR, str(model_dir))

        assert sbert_embeddings.get_finetuned_ab_path() == str(model_dir)
        assert sbert_embeddings.get_finetuned_model() is None


# ── E. SCORING ENGINE UNTOUCHED (GOLDEN VALUES) ──────────────────────────────
class TestRankingEngineUnchanged:
    def test_step23_example_golden_values(self):
        """60/40 weights + clamp/round semantics are exactly as before 27B."""
        assert calculate_final_score(100, 14.46) == 66      # old production value
        assert calculate_final_score(100, 73.48) == 89      # new V2 value (Step 27B)

    @pytest.mark.parametrize("skill,tfidf,expected", [
        (0, 0, 0), (100, 0, 60), (0, 100, 40), (100, 100, 100),
        (50, 50, 50), (100, 14.46, 66), (100, 73.48, 89),
    ])
    def test_weighted_formula_is_bit_identical(self, skill, tfidf, expected):
        assert calculate_final_score(skill, tfidf) == expected

    def test_clamping_semantics_unchanged(self):
        assert calculate_final_score(-10, -10) == 0
        assert calculate_final_score(500, 500) == 100
        assert calculate_final_score(None, None) == 0

