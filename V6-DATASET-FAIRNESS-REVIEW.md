# IntelliHire V6.0 — Dataset Fairness, Bias & Representation Review

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  
**Dataset Analyzed:** `ai-engine/data/raw/campus_recruitment_dataset.csv`  

---

## 1. Executive Summary & Fairness Policy

**Fairness Statement:** IntelliHire does **NOT** claim that any dataset is unbiased. All historical recruitment datasets reflect the specific societal, institutional, and organizational conditions under which hiring decisions were made.

This document systematically audits representation, demographic proxies, class distributions, and potential bias sources in our foundation dataset.

---

## 2. Representation & Demographic Audit

| Dimension | Dataset Status | Fairness & Bias Risk | Mitigation Strategy |
|---|---|---|---|
| **Explicit Demographics** (Gender, Race, Age, Caste) | **Excluded** (Not present in dataset) | Reduces direct demographic bias in model training. | Maintain strict exclusion of sensitive attributes from all feature matrices. |
| **Proxy Variables** | Present (`SSC_Marks`, `HSC_Marks`, `PlacementTraining`) | High secondary school marks and private placement training often correlate with socioeconomic privilege and geographic access to coaching centers. | Evaluate feature importance and apply regularization so model does not over-index on schooling history vs demonstrable technical portfolio. |
| **Geographical Context** | Indian Higher Education Grading System | Academic metrics (`CGPA` on 10.0 scale, `SSC`/`HSC` board marks out of 100) are specific to Indian university placement frameworks. International applicants (e.g. 4.0 GPA scale) would be miscalibrated if evaluated directly without normalization. | Implement localized academic normalizers in IntelliHire's `AcademicProfile` service before passing values to any ML module. |
| **Career Stage / Domain** | Early-Career Campus Hiring (Freshers / 0–2 YOE) | Dataset reflects entry-level university campus drives. It lacks representation for mid-career professionals, senior architects, or career changers. | Restrict baseline campus models strictly to fresher/campus recruitment workflows; do not apply entry-level models to senior lateral hiring. |

---

## 3. Class Balance & Distribution Audit

```
Placement Outcome Distribution (N = 10,000)
├── NotPlaced: 5,803 (58.03%) [█████████████████████]
└── Placed:    4,197 (41.97%) [███████████████]
```

- **Imbalance Ratio:** $1.38 : 1$ (Negligible class skew).
- **Assessment:** The dataset does not suffer from extreme rare-event imbalance (such as 99:1 fraud or 95:5 niche conversion rates). Standard classification losses (Cross-Entropy / Logistic Loss) will train effectively without severe majority-class collapse.

---

## 4. Record Integrity & Duplication

- **Detected Duplicates:** 72 rows (0.72%).
- **Fairness Implication:** Identical records spanning identical features and outcomes can cause data contamination if randomly partitioned across train and test sets (train-test data spillover).
- **Required Action in V6.1 Preprocessing:** Perform strict stratified deduplication and hash-based entity grouping before train/test splitting.

---

## 5. Potential Algorithmic & Historical Biases

1. **Eligibility Threshold Bias:**  
   The minimum observed CGPA is 6.5, suggesting candidates below this cut-off were pre-filtered by institutional criteria before reaching placement drives.
2. **Outcome Feedback Loop Risk:**  
   If an ML model learns that higher CGPA candidates were historically placed more often, automated ranking might exclude candidates with exceptional open-source contributions or verified projects who had lower academic scores.
3. **Multi-Signal Evidence Balancing (IntelliHire Principle):**  
   IntelliHire counters historical bias by ensuring candidate evaluation remains **multi-signal** (balancing Academic, GitHub coding, LeetCode problem solving, Project evidence, Certificates, and NLP skill match) rather than relying on any single historical predictor.
