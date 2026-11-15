"""
IntelliHire V6.0 — Data Loader Module

Provides robust, immutable dataset loading and basic structural reporting for
machine learning research and preprocessing pipelines.

Responsibilities:
- Validate file existence and accessibility
- Identify file format (.csv, .tsv, .json, .jsonl, .parquet)
- Load into pandas DataFrame without altering raw contents
- Generate structural summaries (row/column counts, types, missing values, duplicates)
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union
import pandas as pd


SUPPORTED_FORMATS = {
    ".csv": "csv",
    ".tsv": "tsv",
    ".json": "json",
    ".jsonl": "jsonl",
    ".parquet": "parquet",
    ".pq": "parquet",
}


class DatasetLoadError(Exception):
    """Custom exception raised when dataset loading fails."""
    pass


def validate_file_path(file_path: Union[str, Path]) -> Path:
    """
    Validate that a dataset file exists and is not an empty 0-byte file.

    Args:
        file_path: Path to dataset file.

    Returns:
        Resolved Path object.

    Raises:
        FileNotFoundError: If the file does not exist.
        DatasetLoadError: If the path is a directory or the file has 0 bytes.
    """
    path = Path(file_path).resolve()

    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {file_path}")

    if path.is_dir():
        raise DatasetLoadError(f"Expected a file, but got a directory: {file_path}")

    if path.stat().st_size == 0:
        raise DatasetLoadError(f"Dataset file is empty (0 bytes): {file_path}")

    return path


def detect_file_format(file_path: Union[str, Path]) -> str:
    """
    Detect dataset file format from file extension.

    Args:
        file_path: Path to dataset file.

    Returns:
        Format identifier ('csv', 'tsv', 'json', 'jsonl', 'parquet').

    Raises:
        ValueError: If file extension is not supported.
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported file format '{suffix}'. "
            f"Supported formats: {list(SUPPORTED_FORMATS.keys())}"
        )

    return SUPPORTED_FORMATS[suffix]


def load_dataset(file_path: Union[str, Path], **kwargs: Any) -> pd.DataFrame:
    """
    Load dataset into a pandas DataFrame without modifying original data.

    Args:
        file_path: Path to raw dataset file.
        **kwargs: Additional parameters passed to underlying pandas loader.

    Returns:
        pd.DataFrame containing dataset records.

    Raises:
        FileNotFoundError: If file does not exist.
        ValueError: If format is unsupported or file is corrupted.
        DatasetLoadError: If file is empty or load operation fails.
    """
    path = validate_file_path(file_path)
    fmt = detect_file_format(path)

    try:
        if fmt == "csv":
            df = pd.read_csv(path, **kwargs)
        elif fmt == "tsv":
            df = pd.read_csv(path, sep="\t", **kwargs)
        elif fmt == "json":
            df = pd.read_json(path, **kwargs)
        elif fmt == "jsonl":
            df = pd.read_json(path, lines=True, **kwargs)
        elif fmt == "parquet":
            df = pd.read_parquet(path, **kwargs)
        else:
            raise ValueError(f"Unknown format: {fmt}")
    except Exception as e:
        if isinstance(e, (FileNotFoundError, ValueError, DatasetLoadError)):
            raise
        raise DatasetLoadError(f"Failed to load dataset '{file_path}': {str(e)}") from e

    if df.empty:
        raise DatasetLoadError(f"Dataset loaded but contains 0 rows: {file_path}")

    return df


def get_dataset_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generate structural summary of a DataFrame.

    Args:
        df: Input pandas DataFrame.

    Returns:
        Dictionary reporting:
        - row_count: int
        - column_count: int
        - column_names: list of strings
        - data_types: dict of column -> type string
        - missing_values: dict of column -> missing count
        - missing_percentage: dict of column -> missing percentage (0-100)
        - total_missing_cells: int
        - duplicate_rows: int
        - memory_usage_bytes: int
    """
    row_count, col_count = df.shape
    missing_series = df.isnull().sum()
    missing_dict = {col: int(count) for col, count in missing_series.items()}
    missing_pct_dict = {
        col: round((count / row_count) * 100.0, 2) if row_count > 0 else 0.0
        for col, count in missing_series.items()
    }
    duplicate_count = int(df.duplicated().sum())

    return {
        "row_count": row_count,
        "column_count": col_count,
        "column_names": list(df.columns),
        "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": missing_dict,
        "missing_percentage": missing_pct_dict,
        "total_missing_cells": int(missing_series.sum()),
        "duplicate_rows": duplicate_count,
        "memory_usage_bytes": int(df.memory_usage(deep=True).sum()),
    }


def load_and_report(
    file_path: Union[str, Path], **kwargs: Any
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Convenience method to validate, load, and structurally summarize a dataset.

    Args:
        file_path: Path to dataset file.
        **kwargs: Loader arguments.

    Returns:
        Tuple of (DataFrame, summary_dict).
    """
    df = load_dataset(file_path, **kwargs)
    summary = get_dataset_summary(df)
    return df, summary


if __name__ == "__main__":
    import sys
    import json

    target_path = sys.argv[1] if len(sys.argv) > 1 else "data/raw/campus_recruitment_dataset.csv"
    try:
        df, summary = load_and_report(target_path)
        print(f"=== Dataset Loaded: {target_path} ===")
        print(f"Shape: {summary['row_count']} rows x {summary['column_count']} columns")
        print(f"Duplicates: {summary['duplicate_rows']}")
        print(f"Total Missing: {summary['total_missing_cells']}")
        print("\nColumn Overview:")
        for col in summary["column_names"]:
            dtype = summary["data_types"][col]
            missing = summary["missing_values"][col]
            pct = summary["missing_percentage"][col]
            print(f"  - {col:30s} | {dtype:10s} | Missing: {missing} ({pct}%)")
    except Exception as err:
        print(f"Error loading dataset: {err}")
        sys.exit(1)
