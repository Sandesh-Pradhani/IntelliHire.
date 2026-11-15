"""
STEP 27A — Isolated unit tests for the V2 FinalScore fallback policy.

Proves (per Step 27A section 6):
  1. V2 available           -> V2 is used (policy never bypasses it)
  2. V2 missing             -> the selected fallback (A/B/C) is used
  3. final score always in [0, 100]
  4. never NaN / Infinity (non-finite inputs rejected with ValueError)
  5. existing finalScore behavior reproduced EXACTLY when V2 is disabled
     (bit-identical to production ai.ranking_engine.calculate_final_score)

These tests import ONLY the isolated module ai/finalscore_v2_policy.py;
they do not call the API, touch MongoDB, or modify any production file.
"""
import math
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ai.ranking_engine import calculate_final_score  # production reference
from ai.finalscore_v2_policy import (
    calculate_final_score_v2,
    POLICIES,
    POLICY_FORMULAS,
)

GRID_SKILL = [0, 0.5, 50, 64.3, 100]
GRID_TFIDF = [0, 3, 18.51, 100]
GRID_V2 = [None, 0, 30, 73.48, 100]


# ──────────────────────────────────────────────────────────────────────────────
# 1. V2 available -> V2 is used
# ──────────────────────────────────────────────────────────────────────────────
class TestV2Available:
    @pytest.mark.parametrize("policy", POLICIES)
    @pytest.mark.parametrize("skill,tfidf,v2", [
        (0, 100, 0),        # tfidf high, V2 zero -> V2 must win, NOT tfidf
        (0, 100, 50),       # proves tfidf is NOT fed to the 0.40 slot
        (64.3, 18.51, 73.48),
        (100, 0, 30),
        (100, 100, 100),
    ])
    def test_v2_replaces_tfidf_exactly(self, policy, skill, tfidf, v2):
        out = calculate_final_score_v2(skill, tfidf, v2_calibrated=v2, policy=policy)
        assert out["semantic_source"] == "v2"
        assert out["fallback_applied"] is False
        assert out["final_score"] == calculate_final_score(skill, v2)
        # Explicitly: NOT the tfidf-based score when the two differ
        if calculate_final_score(skill, v2) != calculate_final_score(skill, tfidf):
            assert out["final_score"] != calculate_final_score(skill, tfidf)

    @pytest.mark.parametrize("policy", POLICIES)
    def test_policy_ignored_when_v2_present(self, policy):
        """Fallback choice must have zero effect while V2 is available."""
        base = calculate_final_score_v2(50, 18.51, v2_calibrated=73.48, policy="A")
        other = calculate_final_score_v2(50, 18.51, v2_calibrated=73.48, policy=policy)
        assert other["final_score"] == base["final_score"]


# ──────────────────────────────────────────────────────────────────────────────
# 2. V2 missing -> selected fallback is used
# ──────────────────────────────────────────────────────────────────────────────
class TestFallbackSelection:
    @pytest.mark.parametrize("skill,tfidf", [
        (0, 0), (0, 100), (64.3, 18.51), (100, 0), (100, 100), (50, 3),
    ])
    def test_policy_a_uses_legacy_tfidf(self, skill, tfidf):
        out = calculate_final_score_v2(skill, tfidf, v2_calibrated=None, policy="A")
        assert out["fallback_applied"] is True
        assert out["semantic_source"] == "legacy_tfidf"
        assert out["semantic_component"] == tfidf
        # A reproduces the CURRENT production formula when V2 is missing
        assert out["final_score"] == calculate_final_score(skill, tfidf)

    @pytest.mark.parametrize("skill", GRID_SKILL)
    def test_policy_b_semantic_is_zero(self, skill):
        out = calculate_final_score_v2(skill, 18.51, v2_calibrated=None, policy="B")
        assert out["fallback_applied"] is True
        assert out["semantic_source"] == "zero"
        assert out["semantic_component"] == 0.0
        # 0.60 * skill only == production with similarity forced to 0
        assert out["final_score"] == calculate_final_score(skill, 0)
        assert out["final_score"] == round(0.6 * max(0, min(100, float(skill))))

    @pytest.mark.parametrize("skill,expected", [
        (0, 0), (0.5, 0), (50, 50), (64.3, 64), (100, 100), (150, 100), (-5, 0),
    ])
    def test_policy_c_skill_is_100_percent(self, skill, expected):
        out = calculate_final_score_v2(skill, 18.51, v2_calibrated=None, policy="C")
        assert out["fallback_applied"] is True
        assert out["semantic_source"] == "skill_renormalized"
        assert out["final_score"] == expected  # skill coverage IS the score
        assert out["final_score"] == round(max(0, min(100, float(skill))))

    def test_policies_differ_when_they_should(self):
        """A/B/C must produce distinct numbers on a discriminating case."""
        a = calculate_final_score_v2(64.3, 18.51, v2_calibrated=None, policy="A")["final_score"]
        b = calculate_final_score_v2(64.3, 18.51, v2_calibrated=None, policy="B")["final_score"]
        c = calculate_final_score_v2(64.3, 18.51, v2_calibrated=None, policy="C")["final_score"]
        assert (a, b, c) == (46, 39, 64)
        assert POLICY_FORMULAS["A"] and POLICY_FORMULAS["B"] and POLICY_FORMULAS["C"]

    def test_unknown_policy_rejected(self):
        with pytest.raises(ValueError):
            calculate_final_score_v2(50, 50, v2_calibrated=None, policy="D")


# ──────────────────────────────────────────────────────────────────────────────
# 3+4. Range [0,100], no NaN / Infinity (exhaustive grid sweep)
# ──────────────────────────────────────────────────────────────────────────────
class TestRangeAndFinity:
    def test_full_grid_bounded_int_no_nan(self):
        checked = 0
        for skill in GRID_SKILL + [-10, 150]:
            for tfidf in GRID_TFIDF + [-1, 250]:
                for v2 in GRID_V2 + [-3, 101]:
                    for policy in POLICIES:
                        for enabled in (True, False):
                            out = calculate_final_score_v2(
                                skill, tfidf, v2_calibrated=v2,
                                policy=policy, v2_enabled=enabled)
                            s = out["final_score"]
                            assert isinstance(s, int)
                            assert 0 <= s <= 100
                            assert math.isfinite(s)
                            assert math.isfinite(out["semantic_component"])
                            checked += 1
        assert checked == 7 * 6 * 7 * 3 * 2  # 1,764 combinations

    @pytest.mark.parametrize("bad", [float("nan"), float("inf"), float("-inf")])
    @pytest.mark.parametrize("which", ["skill", "tfidf", "v2"])
    def test_non_finite_inputs_rejected(self, bad, which):
        kwargs = dict(skill_match_score=50, legacy_tfidf_similarity=50, v2_calibrated=None)
        if which == "skill":
            kwargs["skill_match_score"] = bad
        elif which == "tfidf":
            kwargs["legacy_tfidf_similarity"] = bad
        else:
            kwargs["v2_calibrated"] = bad
        with pytest.raises(ValueError):
            calculate_final_score_v2(**kwargs)

    def test_none_tfidf_rejected(self):
        with pytest.raises(ValueError):
            calculate_final_score_v2(50, None, v2_calibrated=None)


# ──────────────────────────────────────────────────────────────────────────────
# 5. V2 disabled -> EXACT current production finalScore (bit-identical)
# ──────────────────────────────────────────────────────────────────────────────
class TestV2DisabledExactLegacy:
    @pytest.mark.parametrize("policy", POLICIES)
    @pytest.mark.parametrize("skill,tfidf,v2", [
        (0, 0, None), (0, 100, 73.48), (64.3, 18.51, 50), (100, 0, 100),
        (50, 3, 30), (12.5, 87.6, None), (100, 100, 0), (3, 97, 73.48),
        (-20, 50, 50), (150, 50, 150), (64.3, 18.51, None),
    ])
    def test_bit_identical_to_production(self, policy, skill, tfidf, v2):
        out = calculate_final_score_v2(
            skill, tfidf, v2_calibrated=v2, policy=policy, v2_enabled=False)
        assert out["final_score"] == calculate_final_score(skill, tfidf)
        assert out["v2_enabled"] is False
        assert out["semantic_source"] == "legacy_tfidf"
        assert out["fallback_applied"] is False
        # V2 present-but-disabled must STILL be ignored (flag wins)
        if v2 is not None and calculate_final_score(skill, tfidf) != calculate_final_score(skill, v2):
            assert out["final_score"] != calculate_final_score(skill, v2)

    def test_disabled_matches_production_rounding_edges(self):
        # rounding edges of the production formula (banker's round on .5)
        for skill, tfidf in [(0.5, 0.75), (1.25, 1.25), (99.5, 0), (0, 99.5)]:
            out = calculate_final_score_v2(skill, tfidf, v2_calibrated=99.9, v2_enabled=False)
            assert out["final_score"] == calculate_final_score(skill, tfidf)


# ──────────────────────────────────────────────────────────────────────────────
# Pathology characterization used by the report (documented behavior)
# ──────────────────────────────────────────────────────────────────────────────
class TestPathologyCharacterization:
    def test_b_and_c_can_zero_when_skill_zero(self):
        """Documented consequence: B and C collapse to 0 when skill=0."""
        assert calculate_final_score_v2(0, 100, v2_calibrated=None, policy="B")["final_score"] == 0
        assert calculate_final_score_v2(0, 100, v2_calibrated=None, policy="C")["final_score"] == 0

    def test_a_survives_skill_zero_via_tfidf(self):
        """Documented consequence: A keeps 0.40*tfidf when skill=0."""
        assert calculate_final_score_v2(0, 100, v2_calibrated=None, policy="A")["final_score"] == 40

    def test_c_can_exceed_available_score(self):
        """Documented consequence: C > available score whenever skill > V2."""
        with_v2 = calculate_final_score_v2(100, 50, v2_calibrated=30)["final_score"]
        missing = calculate_final_score_v2(100, 50, v2_calibrated=None, policy="C")["final_score"]
        assert with_v2 == 72 and missing == 100 and missing > with_v2

    def test_b_never_exceeds_available_score(self):
        """Documented consequence: B <= available score always (deficit 0.4*V2)."""
        for v2 in (0, 30, 73.48, 100):
            avail = calculate_final_score_v2(80, 40, v2_calibrated=v2)["final_score"]
            missing_b = calculate_final_score_v2(80, 40, v2_calibrated=None, policy="B")["final_score"]
            assert missing_b <= avail

