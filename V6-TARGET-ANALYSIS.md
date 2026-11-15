# IntelliHire V6.0 — Target Analysis Report

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  

---

## 1. Executive Summary

A critical objective of V6.0 is to rigorously analyze potential target variables for supervised machine learning without fabricating ground-truth labels or misrepresenting features.

Across the inspected candidate datasets, one legitimate supervised binary classification target was identified in the available campus recruitment benchmark dataset (`PlacementStatus`), while other potential columns were analyzed and categorized as input features, circular scores, or future telemetry targets.

---

## 2. Comprehensive Candidate Target Evaluation

### Target Candidate 1: `PlacementStatus` (Primary Dataset Target)

| Attribute | Assessment |
|---|---|
| **Column Name** | `PlacementStatus` |
| **Dataset Source** | `campus_recruitment_dataset.csv` |
| **Data Type** | String / Categorical (`"Placed"`, `"NotPlaced"`) |
| **Class Distribution** | • `NotPlaced`: 5,803 (58.03%)<br>• `Placed`: 4,197 (41.97%)<br>• Total Instances: 10,000 |
| **Class Balance** | Well-balanced (1.38 : 1 ratio). No severe majority-class skew. |
| **Meaning & Context** | Represents whether a candidate successfully secured an employment offer during the campus hiring drive based on their academic credentials, projects, certifications, and assessment evaluations. |
| **Why Legitimate Target** | Directly reflects the definitive hiring decision / employment outcome. |
| **Problems & Limitations** | 1. Binary discrete label (does not convey continuous preference rank).<br>2. Institutional campus placement context rather than multi-industry job-specific matching. |
| **Potential Leakage** | **LOW / MINIMAL RISK.** All predictive features (`CGPA`, `Projects`, `Workshops/Certifications`, `Internships`, `AptitudeTestScore`, `SoftSkillsRating`, `SSC_Marks`, `HSC_Marks`) represent pre-placement qualifications established prior to the placement decision. |
| **Suitability Decision** | **HIGH — Legitimate Supervised Binary Classification Target** |

---

### Target Candidate 2: `PlacementTraining`

| Attribute | Assessment |
|---|---|
| **Column Name** | `PlacementTraining` |
| **Dataset Source** | `campus_recruitment_dataset.csv` |
| **Data Type** | String (`"Yes"`, `"No"`) |
| **Class Distribution** | • `Yes`: 7,318 (73.18%)<br>• `No`: 2,682 (26.82%) |
| **Meaning & Context** | Indicates whether the candidate completed preparatory coaching sessions prior to recruitment drives. |
| **Why Questioned as Target** | An automated profiler might flag this due to keyword `"Placement"`. |
| **Problems & Limitations** | This is a pre-existing student training activity (input feature), NOT a hiring decision or recruitment outcome. |
| **Potential Leakage** | N/A (Feature, not label). |
| **Suitability Decision** | **UNSUITABLE as Target (Classified strictly as an Input Feature)** |

---

### Target Candidate 3: `ai_match_score` (Job-Resume Fit Dataset)

| Attribute | Assessment |
|---|---|
| **Column Name** | `ai_match_score` |
| **Dataset Source** | `job_resume_fit_sample.csv` |
| **Data Type** | Numeric (`float64`, range `[0.0, 1.0]`) |
| **Class Distribution** | Continuous distribution: Mean 0.65, Min 0.32, Max 0.94 |
| **Meaning & Context** | Algorithmic similarity score calculated by upstream NLP parser comparing resume skills against job requirements. |
| **Why Questioned as Target** | Could theoretically serve as a regression target for candidate-job alignment. |
| **Problems & Limitations** | **Circular Ground Truth / Model Distillation:** Training an ML model on an existing algorithmic score teaches the model to approximate that specific heuristic rather than true human recruiter judgment. |
| **Potential Leakage** | High risk of embedding upstream algorithm biases. |
| **Suitability Decision** | **UNSUITABLE as Supervised Ground-Truth Target** (Useful only for semantic baseline validation). |

---

### Target Candidate 4: `Application.status` / Recruiter Pipeline Actions (IntelliHire Telemetry)

| Attribute | Assessment |
|---|---|
| **Column Name** | `Application.status` & `Application.timeline` |
| **Dataset Source** | IntelliHire Production MongoDB Telemetry (`server/models/Application.js`) |
| **Data Type** | Categorical Enum (`"Applied"`, `"Screening"`, `"Shortlisted"`, `"Interview"`, `"Hired"`, `"Rejected"`) |
| **Meaning & Context** | Real recruiter decisions recorded inside the IntelliHire application. |
| **Why Legitimate Target** | Gold standard for learning actual recruiter preferences, shortlisting rates, and interview conversion likelihood. |
| **Problems & Limitations** | **Cold-Start Volume Constraint:** The active database currently contains fewer than 50 total records in development/test instances. Supervised ranking models require at least 1,000–5,000 labeled interactions to avoid severe overfitting. |
| **Potential Leakage** | Minimal if feature snapshots are recorded strictly at time of application submission before recruiter notes/status transitions occur. |
| **Suitability Decision** | **HIGH FUTURE SUITABILITY — Cold-Start Constraint in V6.0** |

---

## 3. Target Analysis Conclusion

1. **Supervised Target Identified:**  
   `PlacementStatus` in `campus_recruitment_dataset.csv` is a verified, authentic, un-leaked binary classification target representing candidate employment outcome.
2. **Class Distribution of Selected Target:**  
   - Total records: **10,000**  
   - `NotPlaced`: **5,803 (58.03%)**  
   - `Placed`: **4,197 (41.97%)**  
   - Missing target labels: **0 (0.0%)**  
3. **No Target Fabrication:**  
   IntelliHire V6.0 rejects synthetic label generation and maintains clear boundaries between input features and genuine outcome targets.
