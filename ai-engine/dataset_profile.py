"""
IntelliHire V6.0 — Dataset Profiler Module

Provides deep, non-destructive profiling of recruitment and candidate datasets.
Strictly inspects without modifying, cleaning, imputing, or deleting data.

Features:
- Shape and dimension analysis
- Column types and storage footprint
- Missing value counts and percentages
- Duplicate row detection
- Numeric distribution metrics (mean, std, percentiles, min, max, skew)
- Categorical cardinality and distribution
- Text field length and sparsity profiling
- Heuristic target column candidate identification
- Heuristic identifier column detection
- Heuristic data leakage risk flags
"""

import math
from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd

from data_loader import load_dataset, get_dataset_summary


# Heuristic keywords for detecting candidate target columns
TARGET_KEYWORDS = [
    "target",
    "label",
    "placement",
    "placementstatus",
    "hiringdecision",
    "hired",
    "status",
    "decision",
    "outcome",
    "selected",
    "shortlisted",
    "fit",
    "class",
]

# Heuristic keywords for detecting identifier columns
ID_KEYWORDS = ["id", "identifier", "uuid", "guid", "candidate_id", "user_id", "applicant_id", "email"]

# Heuristic keywords for detecting potential data leakage columns
LEAKAGE_KEYWORDS = [
    "salary",
    "salary_offered",
    "post_hire",
    "performance_rating",
    "offer_accepted",
    "onboarding",
    "termination",
    "rejection_reason",
    "interviewer_name",
    "final_decision",
]


def profile_numeric_columns(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Compute detailed summary statistics for all numeric columns."""
    stats = {}
    num_cols = df.select_dtypes(include=[np.number]).columns

    for col in num_cols:
        series = df[col].dropna()
        if series.empty:
            stats[col] = {"count": 0, "status": "all_null"}
            continue

        q25 = float(series.quantile(0.25))
        q50 = float(series.quantile(0.50))
        q75 = float(series.quantile(0.75))
        iqr = q75 - q25
        lower_bound = q25 - 1.5 * iqr
        upper_bound = q75 + 1.5 * iqr
        outlier_count = int(((series < lower_bound) | (series > upper_bound)).sum())

        skew_val = float(series.skew()) if len(series) > 2 else 0.0
        if math.isnan(skew_val):
            skew_val = 0.0

        stats[col] = {
            "count": int(series.count()),
            "mean": round(float(series.mean()), 4),
            "std": round(float(series.std()), 4) if len(series) > 1 else 0.0,
            "min": round(float(series.min()), 4),
            "p25": round(q25, 4),
            "median": round(q50, 4),
            "p75": round(q75, 4),
            "max": round(float(series.max()), 4),
            "skewness": round(skew_val, 4),
            "potential_outliers_iqr": outlier_count,
            "outlier_percentage": round((outlier_count / len(series)) * 100.0, 2) if len(series) > 0 else 0.0,
        }

    return stats


def profile_categorical_columns(
    df: pd.DataFrame, max_categories: int = 10
) -> Dict[str, Dict[str, Any]]:
    """Compute cardinality and value distributions for categorical/object/string columns."""
    stats = {}
    cat_cols = df.select_dtypes(include=["object", "string", "category", "bool"]).columns

    for col in cat_cols:
        series = df[col]
        non_null = series.dropna()
        n_unique = int(non_null.nunique())
        top_counts = non_null.value_counts().head(max_categories).to_dict()

        stats[col] = {
            "unique_count": n_unique,
            "null_count": int(series.isnull().sum()),
            "top_values": {str(k): int(v) for k, v in top_counts.items()},
            "cardinality_ratio": round(n_unique / len(df), 4) if len(df) > 0 else 0.0,
        }

    return stats


def profile_text_columns(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Profile text columns (strings with high uniqueness and long character lengths)."""
    stats = {}
    obj_cols = df.select_dtypes(include=["object", "string"]).columns

    for col in obj_cols:
        series = df[col].dropna().astype(str)
        if series.empty:
            continue

        lengths = series.str.len()
        avg_len = float(lengths.mean())

        # If average length > 25 characters, classify as rich text field
        if avg_len > 25:
            stats[col] = {
                "sample_count": int(len(series)),
                "min_length": int(lengths.min()),
                "avg_length": round(avg_len, 2),
                "max_length": int(lengths.max()),
                "empty_strings": int((series.str.strip() == "").sum()),
            }

    return stats


def detect_potential_target_columns(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Identify columns that might represent supervised ML targets."""
    candidates = []
    n_rows = len(df)

    for col in df.columns:
        col_lower = col.lower().replace("_", "").replace(" ", "").replace("/", "")
        series = df[col].dropna()
        n_unique = series.nunique()
        reason = []
        confidence = "LOW"

        # Check keyword match
        matched_kw = [kw for kw in TARGET_KEYWORDS if kw in col_lower]
        if matched_kw:
            reason.append(f"Name matches target keywords: {matched_kw}")
            confidence = "MEDIUM"

        # Check binary / low cardinality target
        if n_unique in [2, 3, 4, 5]:
            reason.append(f"Low cardinality classification target ({n_unique} unique classes)")
            if matched_kw:
                confidence = "HIGH"
            elif col_lower in ["y", "target", "label", "outcome"]:
                confidence = "HIGH"

        # Check continuous score target
        if pd.api.types.is_numeric_dtype(df[col]) and matched_kw:
            reason.append(f"Numeric regression target range [{series.min()}, {series.max()}]")
            confidence = "HIGH"

        if reason:
            distribution = (
                series.value_counts(normalize=True).head(5).to_dict()
                if n_unique <= 10
                else {"min": float(series.min()), "max": float(series.max())}
            )
            candidates.append({
                "column": col,
                "confidence": confidence,
                "data_type": str(df[col].dtype),
                "unique_values": int(n_unique),
                "reasons": reason,
                "distribution": {
                    str(k): round(float(v), 4) if isinstance(v, (float, np.floating)) else v
                    for k, v in distribution.items()
                },
            })

    return candidates


def detect_id_columns(df: pd.DataFrame) -> List[str]:
    """Detect columns likely acting as unique primary keys or identifiers."""
    id_cols = []
    n_rows = len(df)

    for col in df.columns:
        col_lower = col.lower()
        n_unique = df[col].nunique()

        # Near 100% uniqueness or keyword match with high cardinality
        if n_rows > 10 and n_unique / n_rows > 0.98:
            id_cols.append(col)
        elif any(kw == col_lower or f"_{kw}" in col_lower or f"{kw}_" in col_lower for kw in ID_KEYWORDS) and n_unique > 20:
            if col not in id_cols:
                id_cols.append(col)

    return id_cols


def detect_leakage_risks(df: pd.DataFrame) -> List[Dict[str, str]]:
    """Flag columns that may leak post-hiring or target-dependent outcomes."""
    risks = []
    for col in df.columns:
        col_lower = col.lower()
        for kw in LEAKAGE_KEYWORDS:
            if kw in col_lower:
                risks.append({
                    "column": col,
                    "matched_risk": kw,
                    "warning": f"Column '{col}' matches known post-event outcome keyword '{kw}'. Inspect for temporal leakage.",
                })
                break
    return risks


def profile_dataset(df_or_path: Union[pd.DataFrame, str]) -> Dict[str, Any]:
    """
    Generate comprehensive dataset profile dictionary.

    Args:
        df_or_path: pandas DataFrame or string path to dataset.

    Returns:
        Structured profile dict with complete statistical breakdown.
    """
    if isinstance(df_or_path, (str, bytes)):
        df = load_dataset(df_or_path)
    else:
        df = df_or_path

    structural_summary = get_dataset_summary(df)
    numeric_profile = profile_numeric_columns(df)
    categorical_profile = profile_categorical_columns(df)
    text_profile = profile_text_columns(df)
    target_candidates = detect_potential_target_columns(df)
    id_columns = detect_id_columns(df)
    leakage_risks = detect_leakage_risks(df)

    return {
        "summary": structural_summary,
        "numeric_profile": numeric_profile,
        "categorical_profile": categorical_profile,
        "text_profile": text_profile,
        "target_candidates": target_candidates,
        "id_columns": id_columns,
        "leakage_risks": leakage_risks,
    }


def generate_markdown_profile(profile: Dict[str, Any], title: str = "Dataset Profile") -> str:
    """Render profile dict as readable Markdown report."""
    s = profile["summary"]
    lines = [
        f"# {title}",
        "",
        "## 1. Structural Overview",
        f"- **Rows:** {s['row_count']}",
        f"- **Columns:** {s['column_count']}",
        f"- **Duplicate Rows:** {s['duplicate_rows']}",
        f"- **Total Missing Cells:** {s['total_missing_cells']}",
        f"- **Memory Usage:** {s['memory_usage_bytes'] / 1024:.2f} KB",
        "",
        "## 2. Column Inventory & Missing Data",
        "| Column | Type | Missing Count | Missing % |",
        "|---|---|---|---|",
    ]
    for col in s["column_names"]:
        lines.append(
            f"| `{col}` | `{s['data_types'][col]}` | {s['missing_values'][col]} | {s['missing_percentage'][col]}% |"
        )

    if profile["numeric_profile"]:
        lines.extend([
            "",
            "## 3. Numeric Distributions",
            "| Column | Count | Mean | Std | Min | Median | Max | Skew | Outliers (IQR) |",
            "|---|---|---|---|---|---|---|---|---|",
        ])
        for col, st in profile["numeric_profile"].items():
            lines.append(
                f"| `{col}` | {st['count']} | {st['mean']} | {st['std']} | {st['min']} | {st['median']} | {st['max']} | {st['skewness']} | {st['potential_outliers_iqr']} ({st['outlier_percentage']}%) |"
            )

    if profile["categorical_profile"]:
        lines.extend([
            "",
            "## 4. Categorical Distributions",
            "| Column | Unique | Nulls | Top Frequencies |",
            "|---|---|---|---|",
        ])
        for col, cat in profile["categorical_profile"].items():
            top_str = ", ".join([f"`{k}`: {v}" for k, v in cat["top_values"].items()])
            lines.append(f"| `{col}` | {cat['unique_count']} | {cat['null_count']} | {top_str} |")

    if profile["target_candidates"]:
        lines.extend([
            "",
            "## 5. Potential Target Candidates",
            "| Column | Confidence | Data Type | Unique Classes / Range | Rationale |",
            "|---|---|---|---|---|",
        ])
        for tc in profile["target_candidates"]:
            reasons = "; ".join(tc["reasons"])
            dist_str = ", ".join([f"{k}: {v}" for k, v in tc["distribution"].items()])
            lines.append(f"| `{tc['column']}` | **{tc['confidence']}** | `{tc['data_type']}` | {dist_str} | {reasons} |")

    if profile["leakage_risks"]:
        lines.extend([
            "",
            "## 6. Data Leakage Risks",
        ])
        for lr in profile["leakage_risks"]:
            lines.append(f"- [WARNING] `{lr['column']}`: {lr['warning']}")
    else:
        lines.extend([
            "",
            "## 6. Data Leakage Risks",
            "- [PASSED] No high-risk leakage keywords detected automatically.",
        ])

    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    import io

    # Ensure UTF-8 output even on Windows consoles
    if sys.stdout.encoding != "utf-8":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    target = sys.argv[1] if len(sys.argv) > 1 else "data/raw/campus_recruitment_dataset.csv"
    try:
        prof = profile_dataset(target)
        md = generate_markdown_profile(prof, f"Profile: {target}")
        print(md)
    except Exception as err:
        print(f"Profiling failed: {err}")
        sys.exit(1)
