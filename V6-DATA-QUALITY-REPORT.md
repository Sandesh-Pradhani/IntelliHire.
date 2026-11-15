# IntelliHire V6.0 — Data Quality Report

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  
**Inspected File:** `ai-engine/data/raw/campus_recruitment_dataset.csv`  
**Tool Used:** `ai-engine/data_loader.py` & `ai-engine/dataset_profile.py`  

---

## 1. Dataset Dimensions & Storage

- **Total Rows (Instances):** 10,000  
- **Total Columns (Features + Target):** 11  
- **File Format:** Comma-Separated Values (`.csv`)  
- **File Size:** 391.36 KB (400,748 bytes)  
- **In-Memory Footprint:** 2,422.57 KB  
- **Dataset Immutability:** Raw file remains unchanged and read-only.  

---

## 2. Missing Values Analysis

| Column | Data Type | Null Count | Missing % | Status |
|---|---|---|---|---|
| `CGPA` | `float64` | 0 | 0.00% | Complete |
| `Internships` | `int64` | 0 | 0.00% | Complete |
| `Projects` | `int64` | 0 | 0.00% | Complete |
| `Workshops/Certifications` | `int64` | 0 | 0.00% | Complete |
| `AptitudeTestScore` | `int64` | 0 | 0.00% | Complete |
| `SoftSkillsRating` | `float64` | 0 | 0.00% | Complete |
| `ExtracurricularActivities` | `object` (`str`) | 0 | 0.00% | Complete |
| `PlacementTraining` | `object` (`str`) | 0 | 0.00% | Complete |
| `SSC_Marks` | `int64` | 0 | 0.00% | Complete |
| `HSC_Marks` | `int64` | 0 | 0.00% | Complete |
| `PlacementStatus` | `object` (`str`) | 0 | 0.00% | Complete |

**Summary:** 0 missing cells out of 110,000 total data points (100.0% completeness).

---

## 3. Duplicate Records Analysis

- **Total Duplicate Rows Detected:** 72 rows (0.72% of dataset)  
- **Unique Records:** 9,928 rows  
- **Nature of Duplicates:** Identical feature vectors across all 11 columns (common in low-dimensional discrete surveys where students share similar academic metrics).  
- **V6.0 Policy:** Preserved as-is in `data/raw/`. Deduplication policy will be formalized in V6.1 preprocessing.

---

## 4. Data Types & Storage Footprint

| Category | Count | Columns |
|---|---|---|
| Floating-point (`float64`) | 2 | `CGPA`, `SoftSkillsRating` |
| Integer (`int64`) | 6 | `Internships`, `Projects`, `Workshops/Certifications`, `AptitudeTestScore`, `SSC_Marks`, `HSC_Marks` |
| Categorical String (`str`) | 3 | `ExtracurricularActivities`, `PlacementTraining`, `PlacementStatus` |

---

## 5. Numeric Distribution & Statistical Breakdown

| Feature | Count | Mean | Std Dev | Min | 25th % | Median | 75th % | Max | Skewness | IQR Outliers |
|---|---|---|---|---|---|---|---|---|---|---|
| `CGPA` | 10,000 | 7.6980 | 0.6401 | 6.5000 | 7.2000 | 7.7000 | 8.2000 | 9.1000 | -0.4027 | 0 (0.00%) |
| `Internships` | 10,000 | 1.0492 | 0.6659 | 0.0000 | 1.0000 | 1.0000 | 1.0000 | 2.0000 | -0.0554 | 4,458 (44.58%)* |
| `Projects` | 10,000 | 2.0266 | 0.8680 | 0.0000 | 1.0000 | 2.0000 | 3.0000 | 3.0000 | -0.0788 | 0 (0.00%) |
| `Workshops/Certifications`| 10,000 | 1.0132 | 0.9043 | 0.0000 | 0.0000 | 1.0000 | 2.0000 | 3.0000 | 0.2046 | 0 (0.00%) |
| `AptitudeTestScore` | 10,000 | 79.4499 | 8.1600 | 60.0000 | 74.0000 | 80.0000 | 86.0000 | 90.0000 | -0.3550 | 0 (0.00%) |
| `SoftSkillsRating` | 10,000 | 4.3240 | 0.4116 | 3.0000 | 4.0000 | 4.4000 | 4.6000 | 4.8000 | -0.6763 | 0 (0.00%) |
| `SSC_Marks` (10th) | 10,000 | 69.1594 | 10.4305 | 55.0000 | 60.0000 | 70.0000 | 78.0000 | 90.0000 | 0.0344 | 0 (0.00%) |
| `HSC_Marks` (12th) | 10,000 | 74.5015 | 8.9195 | 57.0000 | 68.0000 | 73.0000 | 82.0000 | 88.0000 | -0.0010 | 0 (0.00%) |

*\*Note on `Internships`: Because 25th percentile, median, and 75th percentile are all equal to 1.0, standard continuous IQR calculation mathematically flags values 0 and 2 as outliers. However, in domain terms, 0, 1, or 2 internships are valid discrete counts, not true anomalies.*

---

## 6. Categorical Cardinality & Distributions

| Categorical Feature | Unique Values | Value Breakdown | Cardinality Ratio |
|---|---|---|---|
| `ExtracurricularActivities` | 2 | • `Yes`: 5,854 (58.54%)<br>• `No`: 4,146 (41.46%) | 0.0002 |
| `PlacementTraining` | 2 | • `Yes`: 7,318 (73.18%)<br>• `No`: 2,682 (26.82%) | 0.0002 |
| `PlacementStatus` (Target) | 2 | • `NotPlaced`: 5,803 (58.03%)<br>• `Placed`: 4,197 (41.97%) | 0.0002 |

---

## 7. Text Fields Analysis

- The benchmark dataset contains structured tabular variables and encoded categorical indicators.
- It does not contain long unstructured narrative text (e.g. multi-paragraph cover letters).
- Text processing requirements in IntelliHire are evaluated in parallel using the `job_resume_fit_sample.csv` benchmark.

---

## 8. Data Leakage Review

- **Automated Check:** `[PASSED] No high-risk leakage keywords detected automatically.`
- **Manual Verification:** All 10 predictive features represent credentials and preparation completed *before* recruitment interviews. No post-hire salaries, employee performance ratings, or onboarding flags exist in the feature set.

---

## 9. Data Quality Risks & Observations

1. **Discrete Value Clumping:** Features such as `Projects` and `Workshops/Certifications` are constrained to integer sets $\{0, 1, 2, 3\}$.
2. **Range Truncation:** Minimum CGPA is 6.5 and maximum is 9.1 (suggesting a cohort threshold or academic eligibility cut-off).
3. **No Automated Imputation Needed:** Because the dataset has 0 null values, synthetic data fabrication and imputation are strictly avoided.
4. **V6.1 Action Items:** Normalization, one-hot/binary encoding, and train/test stratification.
