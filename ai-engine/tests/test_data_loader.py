"""
IntelliHire V6.0 — Data Loader & Profiler Unit Tests

Tests for data validation, format detection, immutable loading, structural summary,
and statistical profiling capabilities.
"""

import os
import tempfile
from pathlib import Path
import pytest
import pandas as pd

from data_loader import (
    validate_file_path,
    detect_file_format,
    load_dataset,
    get_dataset_summary,
    load_and_report,
    DatasetLoadError,
)
from dataset_profile import (
    profile_numeric_columns,
    profile_categorical_columns,
    profile_text_columns,
    detect_potential_target_columns,
    detect_id_columns,
    detect_leakage_risks,
    profile_dataset,
    generate_markdown_profile,
)


@pytest.fixture
def sample_csv_file(tmp_path):
    """Create a temporary valid CSV file."""
    data = {
        "CGPA": [8.5, 7.2, 9.1, 6.8],
        "Projects": [2, 1, 3, 0],
        "Workshops": [1, 2, 0, 1],
        "PlacementStatus": ["Placed", "NotPlaced", "Placed", "NotPlaced"],
    }
    df = pd.DataFrame(data)
    csv_path = tmp_path / "sample_candidates.csv"
    df.to_csv(csv_path, index=False)
    return str(csv_path)


@pytest.fixture
def sample_json_file(tmp_path):
    """Create a temporary valid JSON file."""
    data = [
        {"id": 1, "score": 88.5, "status": "Selected"},
        {"id": 2, "score": 62.0, "status": "Rejected"},
    ]
    df = pd.DataFrame(data)
    json_path = tmp_path / "sample_candidates.json"
    df.to_json(json_path, orient="records")
    return str(json_path)


@pytest.fixture
def empty_file(tmp_path):
    """Create an empty 0-byte file."""
    path = tmp_path / "empty.csv"
    path.touch()
    return str(path)


# ──────────────────────────────────────────────────────────────────────────────
# File Validation & Format Detection Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestDataValidation:
    def test_validate_file_path_success(self, sample_csv_file):
        path = validate_file_path(sample_csv_file)
        assert isinstance(path, Path)
        assert path.exists()

    def test_validate_missing_file_raises_not_found(self):
        with pytest.raises(FileNotFoundError):
            validate_file_path("non_existent_dataset_file.csv")

    def test_validate_directory_raises_error(self, tmp_path):
        with pytest.raises(DatasetLoadError, match="Expected a file"):
            validate_file_path(tmp_path)

    def test_validate_empty_file_raises_error(self, empty_file):
        with pytest.raises(DatasetLoadError, match="empty"):
            validate_file_path(empty_file)

    def test_detect_file_format_valid(self):
        assert detect_file_format("data.csv") == "csv"
        assert detect_file_format("data.tsv") == "tsv"
        assert detect_file_format("data.json") == "json"
        assert detect_file_format("data.jsonl") == "jsonl"
        assert detect_file_format("data.parquet") == "parquet"

    def test_detect_file_format_unsupported(self):
        with pytest.raises(ValueError, match="Unsupported file format"):
            detect_file_format("dataset.xml")


# ──────────────────────────────────────────────────────────────────────────────
# Dataset Loading & Summary Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestDatasetLoading:
    def test_load_dataset_csv(self, sample_csv_file):
        df = load_dataset(sample_csv_file)
        assert isinstance(df, pd.DataFrame)
        assert df.shape == (4, 4)
        assert "CGPA" in df.columns
        assert "PlacementStatus" in df.columns

    def test_load_dataset_json(self, sample_json_file):
        df = load_dataset(sample_json_file)
        assert isinstance(df, pd.DataFrame)
        assert df.shape == (2, 3)
        assert "id" in df.columns

    def test_get_dataset_summary_structure(self, sample_csv_file):
        df = load_dataset(sample_csv_file)
        summary = get_dataset_summary(df)

        assert summary["row_count"] == 4
        assert summary["column_count"] == 4
        assert len(summary["column_names"]) == 4
        assert summary["duplicate_rows"] == 0
        assert summary["total_missing_cells"] == 0
        assert "CGPA" in summary["data_types"]
        assert summary["missing_values"]["CGPA"] == 0

    def test_load_and_report_convenience(self, sample_csv_file):
        df, summary = load_and_report(sample_csv_file)
        assert len(df) == 4
        assert summary["row_count"] == 4


# ──────────────────────────────────────────────────────────────────────────────
# Dataset Profiler Tests
# ──────────────────────────────────────────────────────────────────────────────

class TestDatasetProfiler:
    def test_profile_numeric_columns(self):
        df = pd.DataFrame({
            "score": [10.0, 20.0, 30.0, 40.0, 50.0],
            "constant": [5.0, 5.0, 5.0, 5.0, 5.0],
        })
        stats = profile_numeric_columns(df)
        assert "score" in stats
        assert stats["score"]["count"] == 5
        assert stats["score"]["mean"] == 30.0
        assert stats["score"]["min"] == 10.0
        assert stats["score"]["max"] == 50.0
        assert stats["score"]["median"] == 30.0

    def test_profile_categorical_columns(self):
        df = pd.DataFrame({
            "status": ["Placed", "Placed", "NotPlaced", "Placed"],
            "tier": ["A", "B", "A", "C"],
        })
        stats = profile_categorical_columns(df)
        assert "status" in stats
        assert stats["status"]["unique_count"] == 2
        assert stats["status"]["top_values"]["Placed"] == 3
        assert stats["status"]["top_values"]["NotPlaced"] == 1

    def test_detect_potential_target_columns(self):
        df = pd.DataFrame({
            "candidate_id": [1, 2, 3, 4],
            "CGPA": [8.0, 7.5, 9.0, 6.5],
            "PlacementStatus": ["Placed", "NotPlaced", "Placed", "NotPlaced"],
            "HiringDecision": [1, 0, 1, 0],
        })
        candidates = detect_potential_target_columns(df)
        cols = [c["column"] for c in candidates]
        assert "PlacementStatus" in cols
        assert "HiringDecision" in cols

    def test_detect_id_columns(self):
        df = pd.DataFrame({
            "candidate_id": [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112],
            "score": [50] * 12,
        })
        ids = detect_id_columns(df)
        assert "candidate_id" in ids

    def test_detect_leakage_risks(self):
        df = pd.DataFrame({
            "CGPA": [8.0, 7.0],
            "salary_offered": [75000, 60000],
            "post_hire_rating": [4.5, 3.8],
        })
        risks = detect_leakage_risks(df)
        flagged_cols = [r["column"] for r in risks]
        assert "salary_offered" in flagged_cols
        assert "post_hire_rating" in flagged_cols

    def test_full_dataset_profile_generation(self, sample_csv_file):
        profile = profile_dataset(sample_csv_file)
        assert "summary" in profile
        assert "numeric_profile" in profile
        assert "categorical_profile" in profile
        assert "target_candidates" in profile
        assert profile["summary"]["row_count"] == 4

        md = generate_markdown_profile(profile)
        assert "# Dataset Profile" in md
        assert "## 1. Structural Overview" in md
        assert "PlacementStatus" in md
