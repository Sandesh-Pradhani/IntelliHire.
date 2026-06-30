"""
Unit tests for IntelliHire AI Engine services.

Tests:
- Response envelope utilities
- ATS scoring
- Skill gap analysis
- Ranking service
- Embedding cache
"""

import time
import pytest
import sys
import os

# Add the ai-engine root to the path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.utils.response import make_response, success_response, error_response, _execution_time
from services.ats_scoring_service import calculate_ats_score, _calculate_keyword_score, _calculate_format_score
from services.skill_gap_service import analyze_skill_gap, _analyze_difficulty, _estimate_learning_time
from services.ranking_service import calculate_unified_ranking, _calculate_experience_score, _calculate_education_score
from services.embedding_cache import EmbeddingCache, get_cache


# ──────────────────────────────────────────────────────────────────────────────
# Response Envelope Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestResponseEnvelope:
    def test_make_response_defaults(self):
        result = make_response(success=True, data={"key": "value"})
        assert result["success"] is True
        assert result["data"] == {"key": "value"}
        assert result["message"] == ""
        assert result["execution_time"] is None
        assert result["model_used"] is None

    def test_success_response(self):
        result = success_response(data=[1, 2, 3], message="Done")
        assert result["success"] is True
        assert result["data"] == [1, 2, 3]
        assert result["message"] == "Done"

    def test_error_response(self):
        result = error_response(message="Something went wrong", status_code=400)
        assert result["success"] is False
        assert result["message"] == "Something went wrong"
        assert result["status_code"] == 400

    def test_execution_time_positive(self):
        start = time.perf_counter()
        time.sleep(0.001)  # 1ms sleep
        elapsed = _execution_time(start)
        assert elapsed > 0
        assert isinstance(elapsed, float)


# ──────────────────────────────────────────────────────────────────────────────
# ATS Scoring Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestATSScoring:
    def test_calculate_ats_score_with_skills(self):
        text = "Experienced Python developer with team leadership skills. python java react"
        skills = ["python", "java", "react"]
        result = calculate_ats_score(text, skills)
        assert "overall" in result
        assert "breakdown" in result
        assert "suggestions" in result
        assert 0 <= result["overall"] <= 100
        assert result["metrics"]["skill_count"] == 3

    def test_calculate_ats_score_empty(self):
        result = calculate_ats_score("", [])
        assert result["overall"] == 0
        assert result["metrics"]["word_count"] == 0

    def test_calculate_ats_score_full(self):
        text = """
        John Doe
        john@email.com | +1-555-123-4567
        
        EXPERIENCE
        Senior Software Engineer | Tech Corp (2019-2024)
        - Led a team of 5 developers, increased deployment speed by 40%
        - Reduced system downtime from 5% to 0.1%
        - Managed $500k infrastructure budget
        
        EDUCATION
        Master of Science in Computer Science | MIT (2015-2017)
        
        SKILLS
        Python, Java, React, Docker, AWS, SQL, Machine Learning
        
        ACHIEVEMENTS
        - Company-wide Innovation Award 2022
        - Published 3 research papers
        """
        skills = ["python", "java", "react", "docker", "aws", "sql", "machine learning"]
        result = calculate_ats_score(text, skills)
        assert result["overall"] >= 40  # Should have a decent score
        assert len(result["suggestions"]) > 0

    def test_keyword_score(self):
        score = _calculate_keyword_score("python java react", ["python", "java", "react"], 10)
        assert 0 <= score <= 30

    def test_format_score_with_email_and_phone(self):
        text = "email@test.com | +1-555-123-4567\nSkills\nExperience\nEducation"
        score = _calculate_format_score(text, 10)
        assert score >= 6  # email (3) + phone (3) + sections

    def test_format_score_empty(self):
        score = _calculate_format_score("", 0)
        assert score == 0


# ──────────────────────────────────────────────────────────────────────────────
# Skill Gap Analysis Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestSkillGap:
    def test_analyze_skill_gap_full_match(self):
        result = analyze_skill_gap(
            ["python", "java", "react"],
            ["python", "java", "react"],
        )
        assert len(result["matched"]) == 3
        assert len(result["missing"]) == 0
        assert result["match_percentage"] == 100.0

    def test_analyze_skill_gap_partial_match(self):
        result = analyze_skill_gap(
            ["python", "java"],
            ["python", "react", "docker"],
        )
        assert len(result["matched"]) == 1
        assert len(result["missing"]) == 2
        assert result["match_percentage"] == 33.3

    def test_analyze_skill_gap_no_match(self):
        result = analyze_skill_gap(
            ["python", "java"],
            ["react", "docker"],
        )
        assert len(result["matched"]) == 0
        assert len(result["missing"]) == 2
        assert result["match_percentage"] == 0.0

    def test_analyze_skill_gap_empty(self):
        result = analyze_skill_gap([], [])
        assert result["match_percentage"] == 0.0
        assert len(result["matched"]) == 0
        assert len(result["missing"]) == 0

    def test_analyze_difficulty(self):
        difficulty = _analyze_difficulty(["python", "machine learning", "unknownskill"])
        assert difficulty["beginner"]["count"] == 1  # python
        assert difficulty["advanced"]["count"] == 1  # machine learning
        assert difficulty["unknown"]["count"] == 1

    def test_estimate_learning_time(self):
        assert _estimate_learning_time("beginner") == "1-2 weeks"
        assert _estimate_learning_time("intermediate") == "3-6 weeks"
        assert _estimate_learning_time("advanced") == "2-4 months"
        assert _estimate_learning_time("unknown") == "Varies"


# ──────────────────────────────────────────────────────────────────────────────
# Ranking Service Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestRanking:
    def test_calculate_unified_ranking_default(self):
        result = calculate_unified_ranking(ats_score=80, semantic_similarity=70)
        assert "overall" in result
        assert "breakdown" in result
        assert 0 <= result["overall"] <= 100

    def test_calculate_unified_ranking_perfect(self):
        result = calculate_unified_ranking(ats_score=100, semantic_similarity=100)
        # With defaults: 100*0.3 + 100*0.3 + 50*0.2 + 50*0.1 + 30*0.1 = 30+30+10+5+3 = 78
        assert result["overall"] == 78.0

    def test_calculate_unified_ranking_zero(self):
        result = calculate_unified_ranking(ats_score=0, semantic_similarity=0)
        # With defaults: 0*0.3 + 0*0.3 + 50*0.2 + 50*0.1 + 30*0.1 = 0+0+10+5+3 = 18
        assert result["overall"] == 18.0

    def test_calculate_unified_with_experience(self):
        result = calculate_unified_ranking(
            ats_score=80,
            semantic_similarity=70,
            experience_years=5,
            project_count=8,
            education_level="Master's",
        )
        assert result["overall"] > 50

    def test_experience_score_none(self):
        assert _calculate_experience_score(None) == 50

    def test_experience_score_zero(self):
        assert _calculate_experience_score(0) == 0

    def test_experience_score_senior(self):
        assert _calculate_experience_score(8) == 90

    def test_education_score_none(self):
        assert _calculate_education_score(None) == 30

    def test_education_score_phd(self):
        assert _calculate_education_score("PhD in Computer Science") == 100

    def test_education_score_bachelor(self):
        assert _calculate_education_score("Bachelor of Science") == 70


# ──────────────────────────────────────────────────────────────────────────────
# Embedding Cache Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestEmbeddingCache:
    def test_cache_miss(self):
        cache = EmbeddingCache()
        result = cache.get("some text")
        assert result is None

    def test_cache_set_and_get(self):
        cache = EmbeddingCache()
        cache.set("test text", [1, 2, 3])
        result = cache.get("test text")
        assert result == [1, 2, 3]

    def test_cache_invalidate(self):
        cache = EmbeddingCache()
        cache.set("test text", [1, 2, 3])
        cache.invalidate("test text")
        result = cache.get("test text")
        assert result is None

    def test_cache_invalidate_all(self):
        cache = EmbeddingCache()
        cache.set("text1", [1])
        cache.set("text2", [2])
        cache.invalidate_all()
        assert cache.get("text1") is None
        assert cache.get("text2") is None
        assert cache.size == 0

    def test_cache_stats(self):
        cache = EmbeddingCache()
        cache.set("text1", [1])
        cache.get("text1")  # hit
        cache.get("text2")  # miss
        stats = cache.stats
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert stats["hit_rate"] == 50.0

    def test_global_cache(self):
        c1 = get_cache()
        c2 = get_cache()
        assert c1 is c2  # Singleton