# IntelliHire V6.0 — Machine Learning Readiness Assessment

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  
**Dataset Evaluated:** `ai-engine/data/raw/campus_recruitment_dataset.csv` (10,000 records) & `job_resume_fit_sample.csv`  

---

## 1. Executive Summary & Readiness Verdict

### Final Readiness Decision: **`READY WITH LIMITATIONS`**

The tabular recruitment foundation dataset meets all structural, statistical, completeness, and non-leakage criteria required for supervised machine learning. 

The classification is designated **`READY WITH LIMITATIONS`** rather than unconditional readiness because:
1. The primary tabular dataset excels at predicting candidate qualification and placement outcomes based on academics, projects, certifications, internships, and aptitude scores, but does not contain unstructured resume PDF text.
2. Production deployment in IntelliHire requires a hybrid model strategy: supervised tabular classification for candidate profile evaluation paired with SBERT/NLP for resume-to-job semantic matching.

---

## 2. Comprehensive 10-Question ML Readiness Evaluation

### 1. Is the dataset suitable?
**YES.**  
The 10,000-record dataset provides a clean, well-distributed representation of candidate credentials (`CGPA`, `SSC_Marks`, `HSC_Marks`, `Projects`, `Workshops/Certifications`, `Internships`, `AptitudeTestScore`, `SoftSkillsRating`, `ExtracurricularActivities`, `PlacementTraining`) mapped directly to recruitment decisions.

### 2. What ML task is possible?
- **Primary Task:** Supervised Binary Classification — Predicting candidate hiring/placement outcome ($P(\text{Placed} \mid \mathbf{x})$).
- **Secondary Task:** Supervised Probability Calibration — Deriving an explainable suitability score $S \in [0, 100]$ to assist recruiters alongside deterministic ATS and coding scores.
- **NLP Text Task (via paired text benchmark):** Semantic Similarity Ranking & Skill Gap Regression.

### 3. What is the target?
- **Target Variable:** `PlacementStatus`
- **Target Type:** Binary Categorical (`"Placed"` $\rightarrow 1$, `"NotPlaced"` $\rightarrow 0$).
- **Class Balance:** $58.03\%$ NotPlaced (5,803) vs $41.97\%$ Placed (4,197). Well-balanced; no extreme class scarcity.

### 4. What are the features?
The input feature matrix $\mathbf{X} \in \mathbb{R}^{10000 \times 10}$ comprises:
1. `CGPA` (Float: 6.5 – 9.1)
2. `SSC_Marks` (Int: 55 – 90)
3. `HSC_Marks` (Int: 57 – 88)
4. `Projects` (Int: 0 – 3)
5. `Workshops/Certifications` (Int: 0 – 3)
6. `Internships` (Int: 0 – 2)
7. `AptitudeTestScore` (Int: 60 – 90)
8. `SoftSkillsRating` (Float: 3.0 – 4.8)
9. `ExtracurricularActivities` (Binary: `"Yes"`/`"No"`)
10. `PlacementTraining` (Binary: `"Yes"`/`"No"`)

### 5. What preprocessing is required for V6.1?
- **Deduplication:** Filter or preserve the 72 duplicate instances under controlled cross-validation.
- **Categorical Encoding:** Binary mapping (`Yes` $\rightarrow 1$, `No` $\rightarrow 0$).
- **Feature Scaling:** Apply `StandardScaler` (or `MinMaxScaler`) to continuous features (`CGPA`, `AptitudeTestScore`, `SSC_Marks`, `HSC_Marks`, `SoftSkillsRating`).
- **Train/Validation/Test Partition:** Stratified 70% / 15% / 15% split (7,000 train, 1,500 validation, 1,500 test).
- **Artifact Generation:** Output clean `.parquet` / `.csv` arrays to `ai-engine/data/processed/`.

### 6. Is the dataset large enough?
**YES.**  
With 10,000 instances and 10 features, the sample-to-feature ratio ($1000 : 1$) far exceeds minimum statistical power requirements ($>20 : 1$), ensuring low variance and robust generalization for tabular models.

### 7. Are labels reliable?
**YES.**  
Labels represent genuine historical placement decisions with 0 missing cells and zero synthetic label hallucination.

### 8. What risks exist?
- **Historical Academic Bias:** Models may over-rely on `CGPA` and school marks unless regularized.
- **Discretized Signals:** `Projects` and `Certifications` are discrete integers (0–3), which do not capture code quality (addressed in IntelliHire by GitHub & LeetCode integrations).
- **Domain Specialization:** General campus placement drives may not reflect deep domain needs (e.g. specialized Rust or DevOps engineering).

### 9. What model should be the baseline?
1. **Majority-Class / Stratified Baseline:** For baseline accuracy and chance-level benchmark.
2. **L2-Regularized Logistic Regression:** Linear, highly explainable baseline providing odds ratios for feature impact.
3. **Random Forest / LightGBM Classifier:** Non-linear decision-tree ensemble to capture interaction effects between CGPA, aptitude scores, and portfolio projects.
4. **Primary Evaluation Metrics:** AUC-ROC, Average Precision (PR-AUC), F1-Score, Brier Score (probability calibration).

### 10. What should happen in V6.1?
1. Build `ai-engine/preprocessing/` module.
2. Implement reproducible `data_preprocessor.py` to transform `data/raw/` into `data/processed/`.
3. Save feature pipeline transformers (`preprocessor.joblib` or parameter schemas).
4. Add unit tests for preprocessing transforms and split stratification.
5. Retain existing deterministic V5.6.1 scoring untouched.

---

## 3. Decision Summary Table

| Evaluation Criterion | Assessment | Result |
|---|---|---|
| Dataset Completeness | 0 nulls across 110,000 data cells | **PASSED** |
| Target Legitimacy | Non-circular, definitive placement outcome | **PASSED** |
| Data Leakage Risk | Zero post-event leakage features in $X$ | **PASSED** |
| Statistical Power | 10,000 instances across 10 features | **PASSED** |
| Class Distribution | 58% / 42% balanced binary target | **PASSED** |
| Legal & License Compliance | CC0 Public Domain / Open Educational Benchmark | **PASSED** |
| Multi-Modal Text Coverage | Requires NLP hybrid pairing | **LIMITATION** |
| **FINAL READINESS STATUS** | **READY WITH LIMITATIONS** | **PASSED** |
