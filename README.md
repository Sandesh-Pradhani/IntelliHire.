# IntelliHire

AI-Powered Resume Screening and Candidate Analysis System

---

## Overview

IntelliHire is an AI-powered recruitment platform designed to automate resume analysis, skill extraction, and candidate-job matching.

The system helps recruiters reduce manual screening effort by using Natural Language Processing (NLP) techniques to extract skills and evaluate resumes against job descriptions.

---

## Problem Statement

Traditional recruitment processes require recruiters to manually analyze hundreds of resumes, which is time-consuming, inconsistent, and inefficient.

IntelliHire solves this problem by:
- Automatically extracting candidate skills
- Matching resumes with job descriptions
- Generating resume scores
- Reducing recruiter workload
- Improving hiring efficiency

---

## Features

- Resume Upload
- Skill Extraction using NLP
- Resume Scoring
- Job Description Matching
- Recruiter Dashboard
- Candidate Analysis
- AI-based Resume Processing
- REST API Integration

---

## Tech Stack

### Frontend
- React.js
- Axios
- CSS

### Backend
- Node.js
- Express.js

### AI Engine
- Python
- **FastAPI** (migrated from Flask) 🚀
- spaCy NLP
- scikit-learn (TF-IDF + Cosine Similarity)

### Database
- MongoDB

---

## System Architecture

```text
Frontend (React)
        ↓
Backend API (Node.js / Express)
        ↓
AI Engine (FastAPI + spaCy)
        ↓
MongoDB Database
```

---

## Workflow

1. User uploads resume
2. Resume text is processed
3. NLP engine extracts skills
4. System compares skills with job description
5. Resume score is generated
6. Recruiter views candidate insights

---

## Folder Structure

```text
IntelliHire/
│
├── client/        # React Frontend
├── server/        # Node.js Backend
├── ai-engine/     # FastAPI AI Service
├── README.md
├── migration-report.md   # Flask → FastAPI migration documentation
└── .gitignore
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Sandesh-Pradhani/IntelliHire-.git
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Backend Setup

```bash
cd server
npm install
npm start
```

### AI Engine Setup (FastAPI)

```bash
cd ai-engine

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Run FastAPI server with uvicorn
uvicorn app.main:app --reload

# Server starts on http://localhost:8000
# API Docs: http://localhost:8000/docs
# ReDoc:    http://localhost:8000/redoc
```

---

## API Endpoints

### FastAPI AI Engine (ai-engine/app/main.py)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Health check | — |
| POST | `/analyze-resume` | Extract skills + ATS score | `{ "resumeText": "..." }` |
| POST | `/job-match` | Match resume vs job description | `{ "resume": "...", "job": "..." }` |
| POST | `/rank-candidates` | Rank candidates by job match | `{ "jobDescription": "...", "candidates": [...] }` |

### Sample Requests

#### Analyze Resume
```bash
curl -X POST http://localhost:8000/analyze-resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Experienced Python developer with React and MongoDB skills"}'
```

**Response:**
```json
{
  "skills": ["python", "react", "mongodb"],
  "ats_score": 40
}
```

#### Job Match
```bash
curl -X POST http://localhost:8000/job-match \
  -H "Content-Type: application/json" \
  -d '{"resume": "Python developer skilled in React", "job": "We need a Python and Java expert"}'
```

**Response:**
```json
{
  "similarity": 42.86,
  "finalScore": 37,
  "matchedSkills": ["python"],
  "missingSkills": ["java"],
  "candidateSkills": ["python", "react"],
  "requiredSkills": ["python", "java"]
}
```

#### Rank Candidates
```bash
curl -X POST http://localhost:8000/rank-candidates \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Looking for Python and React developers",
    "candidates": [
      {"_id": "1", "name": "Alice", "skills": ["Python", "React"]},
      {"_id": "2", "name": "Bob", "skills": ["Java"]}
    ]
  }'
```

**Response:**
```json
{
  "rankings": [
    {
      "candidateId": "1",
      "candidateName": "Alice",
      "score": 100,
      "matchedSkills": ["python", "react"],
      "missingSkills": []
    },
    {
      "candidateId": "2",
      "candidateName": "Bob",
      "score": 0,
      "matchedSkills": [],
      "missingSkills": ["python", "react"]
    }
  ]
}
```

---

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

These docs are auto-generated from Pydantic models and endpoint definitions — always up-to-date with the code.

---

## Migration Status

The AI Engine has been migrated from **Flask → FastAPI** with zero feature regressions.

| Feature | Status | Notes |
|---------|--------|-------|
| Resume Analysis | ✅ Preserved | Same skill extraction + ATS scoring |
| Job Matching | ✅ Preserved | Same TF-IDF + cosine similarity |
| Candidate Ranking | ✅ Preserved | Same skill gap analysis |
| Pydantic Validation | ✅ Added | Request/response validation |
| Swagger Docs | ✅ Added | Available at /docs |
| ReDoc | ✅ Added | Available at /redoc |
| Flask Backward Compatibility | ✅ Removed | Fully migrated to FastAPI |

All existing business logic (`skill_extractor.py`, `tfidf_engine.py`, `similarity_engine.py`, `skill_gap.py`, `ranking_engine.py`, `pdf_reader.py`) remains **unchanged**.

---

## Future Enhancements

- AI Interview Analysis
- ATS Compatibility Score
- Resume Recommendation System
- Admin Dashboard
- Multi-language Resume Support
- Cloud Deployment

---

## Author

Sandesh Pradhani

Major Project — CSE (AI & ML)
