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
- Flask
- spaCy NLP

### Database
- MongoDB

---

## System Architecture

```text
Frontend (React)
        ↓
Backend API (Node.js / Express)
        ↓
AI Engine (Flask + spaCy)
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
├── ai-engine/     # Flask AI Service
├── README.md
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

### AI Engine Setup

```bash
cd ai-engine
pip install -r requirements.txt
python app.py
```

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