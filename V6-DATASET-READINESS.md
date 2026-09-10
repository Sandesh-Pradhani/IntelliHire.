# IntelliHire V6 — Dataset & ML Readiness

**Date:** August 18, 2026
**Purpose:** Document current data sources and prepare for V6 ML model training

---

## Current Data Sources

### 1. Resume Data

| Field | Source | Storage |
|-------|--------|---------|
| Raw PDF text | Uploaded via `/api/ai/upload-resume` | File system + parsed text |
| Extracted skills | `skill_extractor.py` NLP pipeline | `Resume.extractedSkills` |
| ATS score | `ats_engine.py` weighted scoring | `Resume.atsScore` |
| Parsed sections | `resume_parser_service.py` | Structured JSON |

**Potential Labels:** ATS Score (0-100), Skill count, Experience years, Education level

---

### 2. Job Data

| Field | Source | Storage |
|-------|--------|---------|
| Title, description | Recruiter input | `Job` model |
| Required skills | Recruiter input | `Job.requiredSkills` |
| Experience, salary | Recruiter input | `Job.experience`, `salaryMin/Max` |
| Location, jobType | Recruiter input | `Job.location`, `jobType` |

**Potential Labels:** Job difficulty (derived from requirements), Skill demand frequency

---

### 3. Candidate Features

| Feature | Source | Model Field |
|---------|--------|-------------|
| CGPA | Academic Profile | `AcademicProfile.cgpa` |
| Backlogs | Academic Profile | `AcademicProfile.backlogs` |
| Semester | Academic Profile | `AcademicProfile.currentSemester` |
| Graduation year | Academic Profile | `AcademicProfile.graduationYear` |
| Academic achievements | Academic Profile | `AcademicProfile.academicAchievements` |

---

### 4. Skill Features

| Feature | Source | Model Field |
|---------|--------|-------------|
| Extracted skills | Resume NLP | `Resume.extractedSkills` |
| Project technologies | Portfolio | `Project.technologies` |
| Certificate skills | Portfolio | `Certificate.skills` |
| Skill categories | AI Engine | `skill_extractor.py` (12 categories) |
| Skill aliases | AI Engine | `SKILL_ALIASES` normalization map |
| Skill relationships | AI Engine | `SKILL_RELATIONSHIPS` progression graph |
| Skill difficulty | AI Engine | `SKILL_DIFFICULTY` ratings |

---

### 5. Academic Features

| Feature | Source | Calculation |
|---------|--------|-------------|
| Academic score | `candidateIntelligenceService.js` | CGPA/10 * 100 - backlogs*8 + achievements*3 |
| Education level | `resume_parser_service.py` | Degree detection from resume text |
| Institution tier | Manual | Not automated |

---

### 6. Coding Features

| Feature | Source | API |
|---------|--------|-----|
| GitHub repos | GitHub REST API | `githubService.js` |
| GitHub languages | GitHub REST API | `githubService.js` |
| GitHub contributions | Derived | repo count + recent updates |
| LeetCode problems solved | LeetCode GraphQL | `leetcodeService.js` |
| LeetCode contest rating | LeetCode GraphQL | `leetcodeService.js` |
| HackerRank stars/badges | HackerRank REST | `hackerrankService.js` |
| Coding score | AI Engine | `coding_scoring.py` (GitHub 40%, LC 40%, HR 20%) |

---

### 7. Project Features

| Feature | Source | Model Field |
|---------|--------|-------------|
| Project count | Portfolio | `Project` collection |
| Technologies used | Portfolio | `Project.technologies` |
| GitHub URLs | Portfolio | `Project.githubUrl` |
| Demo URLs | Portfolio | `Project.liveDemoUrl` |
| Category | Portfolio | `Project.category` |
| Duration | Portfolio | `Project.duration` |
| Team size | Portfolio | `Project.teamSize` |
| AI project score | AI Engine | `project_scoring.py` |

---

### 8. Certificate Features

| Feature | Source | Model Field |
|---------|--------|-------------|
| Certificate count | Portfolio | `Certificate` collection |
| Verified status | Portfolio | `Certificate.verificationStatus` |
| Skills covered | Portfolio | `Certificate.skills` |
| Category | Portfolio | `Certificate.category` |
| Expiry status | Derived | `Certificate.expiryDate` vs current date |

---

### 9. Application Features

| Feature | Source | Model Field |
|---------|--------|-------------|
| Application status | Recruiter action | `Application.status` |
| Match score | AI matching | `Application.matchScore` |
| ATS score | Resume analysis | `Application.atsScore` |
| Timeline events | Status changes | `Application.timeline[]` |
| Recruiter notes | Recruiter input | `Application.recruiterNotes` |

---

## Potential Training Labels

### For Candidate Ranking Model
- **Final AI Score** (0-100): `candidateIntelligenceService.js` weighted formula
- **Recommendation tier**: Strongly Recommended / Recommended / Consider / Needs Review / Low Match
- **Hiring outcome**: Hired / Not Hired (from Application.status)

### For Resume Quality Model
- **ATS Score** (0-100): `ats_engine.py` weighted scoring
- **Interview callback**: Whether candidate reached interview stage

### For Skill Matching Model
- **Match score**: `semantic_matcher.py` SBERT/TF-IDF similarity
- **Matched/Missing skills**: `candidateIntelligenceService.js` comparison

---

## Potential ML Models (V6)

| Model | Purpose | Input Features | Label |
|-------|---------|----------------|-------|
| Candidate Ranker | Predict hiring likelihood | Academic + Coding + Projects + Certs + Resume | Hired/Not Hired |
| Resume Scorer | Predict ATS score | Resume text features | ATS Score |
| Skill Matcher | Predict job fit | Candidate skills + Job requirements | Match Score |
| Career Recommender | Suggest career paths | Candidate profile + Market data | Career path |

---

## Evaluation Metrics

| Model | Primary Metric | Secondary Metrics |
|-------|---------------|-------------------|
| Candidate Ranker | AUC-ROC | Precision, Recall, F1 |
| Resume Scorer | MAE, RMSE | R², Accuracy (threshold) |
| Skill Matcher | Cosine Similarity | Precision@K, Recall@K |
| Career Recommender | NDCG@K | MRR, Hit Rate |

---

## Data Volume Estimates

| Data Type | Current Volume | Needed for V6 ML |
|-----------|---------------|-------------------|
| Resumes | Per-candidate uploads | 1000+ for resume scoring |
| Jobs | Per-recruiter postings | 500+ for matching model |
| Applications | Per-candidate applications | 2000+ for ranking model |
| Coding profiles | Per-candidate connections | 500+ for coding scoring |
| Projects | Per-candidate portfolio | 1000+ for project scoring |

**Recommendation:** Start collecting labeled data in V6 production. Consider synthetic data generation for initial model training.
