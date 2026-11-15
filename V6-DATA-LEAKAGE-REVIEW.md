# IntelliHire V6.0 — Data Leakage & Temporal Review

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  

---

## 1. Overview & Definition of Data Leakage

In candidate recruitment systems, **data leakage** occurs when information that is only known *after* a hiring decision or recruitment event has occurred is inadvertently included in the predictive feature set. 

Data leakage leads to artificially inflated offline validation metrics (e.g., 99.9% AUC) that collapse when deployed to live production candidate screening.

---

## 2. Comprehensive Field-by-Field Leakage Audit

### 1. Benchmark Dataset (`campus_recruitment_dataset.csv`)

| Field | Temporal Origin | Why Suspicious? | Decision for ML | Technical Rationale |
|---|---|---|---|---|
| `PlacementStatus` | Post-Hiring Drive | Definitive placement outcome (`"Placed"` / `"NotPlaced"`). | **TARGET ($Y$) ONLY** (Exclude from Feature Matrix $X$) | Must never be present in input features. Serving as target variable $Y$ in supervised models. |
| `PlacementTraining` | Pre-Hiring Drive | Contains keyword `"Placement"`. | **KEEP IN $X$** | Represents candidate completion of placement preparation sessions prior to interviews. Valid pre-decision signal. |
| `AptitudeTestScore` | Pre-Interview Screening | Assessment score. | **KEEP IN $X$** | Administered during initial screening stage before final selection. |
| `SoftSkillsRating` | Pre-Interview Screening | Interview / evaluation score. | **KEEP IN $X$ (WITH MONITORING)** | If assessed during campus screening, it is a valid pre-placement signal. If assigned by the final hiring committee, it risks partial leakage. |
| `CGPA`, `SSC_Marks`, `HSC_Marks` | Historical Academic Record | Fixed academic grades. | **KEEP IN $X$** | Immutable prior records. Zero leakage risk. |
| `Projects`, `Workshops/Certifications`, `Internships` | Prior Portfolio History | Discrete accomplishment counts. | **KEEP IN $X$** | Established before campus drive. Zero leakage risk. |
| `ExtracurricularActivities` | Prior Student Profile | Activity participation. | **KEEP IN $X$** | Established prior to hiring events. Zero leakage risk. |

---

### 2. Job-Resume Text Benchmark (`job_resume_fit_sample.csv`)

| Field | Temporal Origin | Why Suspicious? | Decision for ML | Technical Rationale |
|---|---|---|---|---|
| `ai_matched_skills` | Post-Parsing Algorithmic Output | Computed list of matched skills. | **EXCLUDE FROM RAW INPUTS** | Derived from an upstream algorithm. Feeding it directly into a matching model creates circular dependency. |
| `ai_match_score` | Algorithmic Computation | Synthetic match probability. | **EXCLUDE AS GROUND TRUTH** | Using computed algorithmic scores as ground truth trains the model to emulate the algorithm rather than actual human hiring decisions. |
| `resume_text`, `job_text` | Submission Time | Unaltered input texts. | **KEEP IN $X$** | Available at the exact moment of job application. Perfect temporal integrity. |

---

### 3. IntelliHire Production Schemas (`server/models/`)

| Model Field | Temporal Origin | Why Suspicious? | Decision for Future V6 Pipeline | Technical Rationale |
|---|---|---|---|---|
| `Application.status` | Post-Submission Pipeline | Reflects recruiter stage advancement (`Screening`, `Shortlisted`, `Interview`, `Hired`, `Rejected`). | **TARGET ONLY** | Cannot be an input feature when evaluating an incoming application. |
| `Application.timeline` | Continuous Recruiter Actions | Event log of status changes and interview invites. | **EXCLUDE FROM SCREENING $X$** | Generated sequentially throughout the hiring pipeline. |
| `Application.recruiterNotes` | Post-Review Feedback | Recruiter evaluation notes. | **EXCLUDE FROM SCREENING $X$** | Written after evaluating the candidate. |
| `Resume.atsScore` | Submission Time | Computed ATS keyword score. | **KEEP IN $X$** | Computed deterministically at upload time. |
| `CodingProfile` (GitHub, LeetCode, HackerRank) | Profile Sync Time | External coding metrics. | **KEEP IN $X$** | Verified evidence existing prior to job application. |

---

## 3. Data Leakage Mitigation Rules for V6.1+

1. **Strict Temporal Snapshotting:**  
   Features for any candidate application must be extracted from the candidate state at timestamp $T_{\text{apply}}$. No updates or recruiter notes logged at $T > T_{\text{apply}}$ may be included in the feature vector.
2. **Explicit Feature Matrix Separation:**  
   The preprocessing pipeline must explicitly separate target labels from feature vectors before any normalization or transformation:
   $$\mathbf{X} = \mathbf{D} \setminus \{\text{Target Columns}\}, \quad \mathbf{y} = \mathbf{D}[\text{Target Column}]$$
3. **No Target Encoding Without Out-of-Fold Splits:**  
   Any future categorical target encoding must use strictly cross-validated out-of-fold computation to prevent target leak into training folds.
