# IntelliHire V6.0 — Dataset Inventory

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  

---

## 1. Overview & Inventory Purpose

The purpose of this inventory is to catalogue, inspect, and evaluate candidate datasets available for machine learning tasks within IntelliHire. In accordance with strict V6.0 guidelines:
- No synthetic numbers or fabricated datasets are recorded.
- Datasets are categorized by their actual availability, format, licensing, and task relevance.
- The foundation is prepared for rigorous feature mapping and ML readiness evaluation without initiating model training.

---

## 2. Dataset Master Inventory Table

| Dataset | Source | Local Availability | Format | Approximate Size | License / Source Info | Purpose | Potential ML Task | Status |
|---|---|---|---|---|---|---|---|---|
| **Campus Recruitment Benchmark** | Hugging Face (`Krooz/Campus_Recruitment_CSV`) | `ai-engine/data/raw/campus_recruitment_dataset.csv` | CSV | 10,000 rows × 11 cols (391 KB) | Open Benchmark (Public Domain / CC0) | Evaluation of candidate academic, project, certification, and placement outcomes | Supervised Binary Classification (`PlacementStatus`: Placed / NotPlaced) | **AVAILABLE** |
| **Job-Resume Semantic Fit Benchmark** | Hugging Face (`batuhanmtl/job_resume_fit`) | `ai-engine/data/raw/job_resume_fit_sample.csv` | CSV | 100 sample rows / 2,385 upstream rows × 10 cols (~120 KB local) | Apache 2.0 / Open Access | Evaluation of resume text to job description semantic matching and skill overlap | Regression (`ai_match_score`) or Ranking Fit | **AVAILABLE** |
| **Resume ATS Score Corpus** | Hugging Face (`0xnbk/resume-ats-score-v1-en`) | Remote | Parquet / CSV | 6,374 rows × 3 cols (54 MB) | Open Access (Community Sourced) | Evaluation of raw resume text vs continuous ATS compatibility scores | Supervised Regression (`ats_score` 0–100) | **NOT DOWNLOADED** |
| **Kaggle Updated Resume Dataset** | Kaggle (`UpdatedResumeDataset.csv`) | Remote | CSV | 962 rows × 2 cols (3.2 MB) | CC0: Public Domain | Classification of resume text into 25 technical and professional job domains | Multi-class Text Classification (`Category`) | **NOT DOWNLOADED** |
| **IntelliHire Production Telemetry & Schemas** | Internal MongoDB Atlas Collections (`Resume`, `Job`, `AcademicProfile`, `CodingProfile`, `Project`, `Certificate`, `Application`) | `server/models/` + `server/uploads/` sample PDFs | MongoDB BSON / JSON / PDF | Production cold-start (<50 records) | Proprietary (IntelliHire Internal) | Real-world telemetry of applicant submissions, ATS scores, recruiter pipeline actions, and interview decisions | Supervised Learning-to-Rank (LTR) / Multi-stage Progression Classification | **REFERENCED** |

---

## 3. Detailed Status Breakdown

### 1. `Campus Recruitment Benchmark` (`campus_recruitment_dataset.csv`)
- **Status:** `AVAILABLE`
- **Location:** `ai-engine/data/raw/campus_recruitment_dataset.csv`
- **Verification:** Verified via `data_loader.py` and `dataset_profile.py`.
- **Dimensions:** Exactly 10,000 instances, 11 features (`CGPA`, `Internships`, `Projects`, `Workshops/Certifications`, `AptitudeTestScore`, `SoftSkillsRating`, `ExtracurricularActivities`, `PlacementTraining`, `SSC_Marks`, `HSC_Marks`, `PlacementStatus`).
- **Suitability:** High alignment with IntelliHire candidate profiles (Academics, Projects, Certifications).

### 2. `Job-Resume Semantic Fit Benchmark` (`job_resume_fit_sample.csv`)
- **Status:** `AVAILABLE` (Sample Benchmark)
- **Location:** `ai-engine/data/raw/job_resume_fit_sample.csv`
- **Verification:** Verified via `data_loader.py` (100 rows, 10 columns).
- **Dimensions:** Paired instances with raw text (`resume_text`, `job_text`), skill lists (`job_required_skills`, `resume_skill_list`, `ai_matched_skills`), and match score (`ai_match_score`).
- **Suitability:** Useful for evaluating semantic similarity alignment between candidate resumes and job postings.

### 3. `Resume ATS Score Corpus` (`0xnbk/resume-ats-score-v1-en`)
- **Status:** `NOT DOWNLOADED`
- **Location:** Hugging Face Datasets Hub
- **Reason:** Large text corpus (54 MB) containing extracted resume strings mapped to ATS scores. Retained in inventory for potential future resume scoring benchmarks.

### 4. `Kaggle Updated Resume Dataset`
- **Status:** `NOT DOWNLOADED`
- **Location:** Kaggle Datasets
- **Reason:** Limited to domain classification (e.g., classifying resume as "Java Developer" vs "Data Science") rather than candidate fit or hiring suitability.

### 5. `IntelliHire Production Telemetry`
- **Status:** `REFERENCED`
- **Location:** MongoDB Database models and application event logs.
- **Reason:** The application captures live recruiter actions (`Applied`, `Screening`, `Shortlisted`, `Interview`, `Hired`, `Rejected`), but dataset volume is currently in cold start.

---

## 4. Inventory Conclusion

The primary candidate selected for deep inspection, profiling, target analysis, and ML readiness evaluation in V6.0 is the **Campus Recruitment Benchmark Dataset** (`campus_recruitment_dataset.csv`), augmented with paired text matching insights from the **Job-Resume Semantic Fit Benchmark**.
