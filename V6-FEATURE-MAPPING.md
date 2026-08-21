# IntelliHire V6.0 — Feature Mapping Architecture

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  

---

## 1. Feature Mapping Principles

To maintain absolute data integrity and prevent false assumptions:
1. **No Pseudo-Mapping:** Fields are only mapped if they physically exist in the respective schemas.
2. **Explicit Layer Separation:** Features are strictly categorized into:
   - **`DATASET-SUPPORTED`**: Present in inspected benchmark datasets (`campus_recruitment_dataset.csv` / `job_resume_fit_sample.csv`).
   - **`INTELLIHIRE-AVAILABLE`**: Present in IntelliHire V5.6.1 production application models and services.
   - **`FUTURE-DERIVED`**: Composite feature transformations planned for the V6.1 Feature Store.

---

## 2. Category 1: `DATASET-SUPPORTED` Features

| Dataset Field | Data Type | Value Range | IntelliHire Concept | Target IntelliHire Model / Field |
|---|---|---|---|---|
| `CGPA` | `float64` | 6.5 – 9.1 | Academic Cumulative GPA | `AcademicProfile.cgpa` |
| `SSC_Marks` | `int64` | 55 – 90 | Secondary Education (10th) | `AcademicProfile.academicAchievements` |
| `HSC_Marks` | `int64` | 57 – 88 | Higher Secondary (12th) | `AcademicProfile.academicAchievements` |
| `Projects` | `int64` | 0 – 3 | Portfolio Project Count | Count of candidate `Project` documents |
| `Workshops/Certifications` | `int64` | 0 – 3 | Certified Credentials Count | Count of candidate `Certificate` documents |
| `Internships` | `int64` | 0 – 2 | Professional Work Experience | `Experience` collection / `candidateExperience` |
| `AptitudeTestScore` | `int64` | 60 – 90 | Technical & Problem Solving | `CodingProfile` evaluation dimension |
| `SoftSkillsRating` | `float64` | 3.0 – 4.8 | Behavioral & Communication | `skill_extractor.py` soft skills category |
| `ExtracurricularActivities` | `str` (Binary) | `"Yes"`, `"No"` | Co-curricular & Leadership | `AcademicProfile.academicAchievements` |
| `PlacementTraining` | `str` (Binary) | `"Yes"`, `"No"` | Career Preparation / Roadmap | `decisionIntelligenceRoutes.js` |
| `PlacementStatus` *(Target)* | `str` (Binary) | `"Placed"`, `"NotPlaced"` | Final Employment Outcome | `Application.status` (`"Hired"` vs `"Rejected"`) |

---

## 3. Category 2: `INTELLIHIRE-AVAILABLE` Features (V5.6.1 Application Baseline)

These features are captured in IntelliHire's production stack but are absent from tabular campus benchmarks:

| IntelliHire Concept | Source Module | Source Model / Path | Description |
|---|---|---|---|
| **Raw Resume Text** | `ResumeUpload.jsx` | `server/uploads/*.pdf` + `Resume.resumeUrl` | Unstructured text extracted via PyPDF2 / pdfminer |
| **Extracted Skills** | `skill_extractor.py` | `Resume.extractedSkills` | 500+ skills categorized across 12 tech domains |
| **ATS Score** | `ats_engine.py` | `Resume.atsScore` | Keyword density, section completeness, formatting |
| **GitHub Repos & Contributions** | `githubService.js` | `CodingProfile.githubData` | Public repositories, total contributions, active languages |
| **LeetCode Problem Solved Count** | `leetcodeService.js` | `CodingProfile.leetcodeData` | Easy/Medium/Hard breakdown, ranking, contest rating |
| **HackerRank Badges & Stars** | `hackerrankService.js` | `CodingProfile.hackerrankData` | Problem solving stars, verified domain badges |
| **Project Code & Live URLs** | `projectController.js` | `Project.githubUrl`, `Project.liveDemoUrl` | Evidence verification for candidate projects |
| **AI Project Score** | `project_scoring.py` | `Project.projectScore` | Complexity, documentation, and tech stack depth score |
| **Certificate Verification** | `portfolioRoutes.js` | `Certificate.verificationStatus` | Verified credential URL / ID status |
| **Academic Backlogs** | `academicController.js` | `AcademicProfile.backlogs` | Active and historical backlog count |
| **Job Description & Requirements** | `jobRoutes.js` | `Job.description`, `Job.requiredSkills` | Recruiter-specified job posting attributes |
| **SBERT Semantic Similarity** | `semantic_matcher.py` | FastAPI `/job-match` | Cosine similarity between resume and job embeddings |
| **Candidate Digital Twin Memory** | `candidateTwinService.js`| `CandidateMemory` | Semantic knowledge graph of candidate journey |

---

## 4. Category 3: `FUTURE-DERIVED` Features (V6.1 Feature Store)

Composite mathematical transformations to be computed during feature pipeline execution:

| Feature Name | Formulation | Normalized Range | Purpose |
|---|---|---|---|
| `skill_overlap_ratio` | $\frac{\|S_{\text{candidate}} \cap S_{\text{job}}\|}{\|S_{\text{job}}\|}$ | `[0.0, 1.0]` | Exact skill coverage fraction |
| `skill_missing_count` | $\|S_{\text{job}} \setminus S_{\text{candidate}}\|$ | Integer $\ge 0$ | Direct skill deficit count |
| `verified_project_ratio` | $\frac{\text{Projects with valid GitHub/Demo}}{\text{Total Projects}}$ | `[0.0, 1.0]` | Portfolio authenticity weight |
| `verified_certificate_ratio`| $\frac{\text{Verified Certificates}}{\text{Total Certificates}}$ | `[0.0, 1.0]` | Credential trust multiplier |
| `composite_coding_signal` | $0.4 \cdot \text{GH}_{\text{norm}} + 0.4 \cdot \text{LC}_{\text{norm}} + 0.2 \cdot \text{HR}_{\text{norm}}$ | `[0.0, 1.0]` | Multidimensional coding capability |
| `academic_score_normalized` | $\max\left(0, \frac{\text{CGPA}}{10} - 0.08 \cdot \text{backlogs} + 0.03 \cdot \text{achievements}\right)$ | `[0.0, 1.0]` | Normalized academic index |
| `semantic_sbert_score` | $\cos(\mathbf{e}_{\text{resume}}, \mathbf{e}_{\text{job}})$ | `[0.0, 1.0]` | Deep semantic similarity |

---

## 5. Architectural Alignment Summary

```
Raw Benchmark Data (10k records) ──┐
                                   ├──> [V6.1 Feature Store] ──> [V6.2 Baseline ML Models]
IntelliHire V5.6.1 Signals (DB/AI) ──┘
```

The feature mapping confirms that the benchmark dataset provides robust baseline coverage for candidate attributes (Academics, Projects, Certifications, Experience, Outcomes), while IntelliHire's production AI Engine supplies rich complementary NLP and code intelligence signals.
