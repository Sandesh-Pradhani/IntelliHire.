# IntelliHire Flask → FastAPI Migration Report

## Generated: 2026-06-11

---

## 1. Current Architecture

```
React (client/ - Port 5173)
    ↓
Node.js/Express Backend (server/ - Port 5000)
    ↓
Flask AI Engine (ai-engine/ - Port 8000)
    ↓
MongoDB Database
```

## 2. Current Flask Endpoints

| Method | Route | Purpose | Request | Response |
|--------|-------|---------|---------|----------|
| GET | `/` | Health check | - | `"IntelliHire AI Engine Running"` |
| POST | `/analyze-resume` | Extract skills + ATS score | `{ resumeText: string }` | `{ skills: string[], ats_score: number }` |
| POST | `/job-match` | Match resume vs job description | `{ resume: string, job: string }` | `{ similarity, finalScore, matchedSkills, missingSkills, candidateSkills, requiredSkills }` |
| POST | `/rank-candidates` | Rank candidates for job | `{ jobDescription: string, candidates: [...] }` | `{ rankings: [...] }` |

## 3. Current API Contracts (Detailed)

### POST /analyze-resume
**Request:**
```json
{
  "resumeText": "string (required)"
}
```
**Success (200):**
```json
{
  "skills": ["python", "react", "mongodb"],
  "ats_score": 80
}
```
**Error (400):**
```json
{
  "message": "Resume text missing"
}
```

### POST /job-match
**Request:**
```json
{
  "resume": "string (optional, default '')",
  "job": "string (optional, default '')"
}
```
**Success (200):**
```json
{
  "similarity": 85.5,
  "finalScore": 75,
  "matchedSkills": ["python"],
  "missingSkills": ["java"],
  "candidateSkills": ["python", "react"],
  "requiredSkills": ["python", "java"]
}
```

### POST /rank-candidates
**Request:**
```json
{
  "jobDescription": "string (optional, default '')",
  "candidates": [
    {
      "_id": "string",
      "name": "string",
      "skills": ["string"]
    }
  ]
}
```
**Success (200):**
```json
{
  "rankings": [
    {
      "candidateId": "string",
      "candidateName": "string",
      "score": 92,
      "matchedSkills": ["python"],
      "missingSkills": ["java"]
    }
  ]
}
```

## 4. Existing Dependencies

### AI Engine (Flask)
| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 3.0.3 | Web framework |
| gunicorn | 23.0.0 | WSGI server |
| spacy | 3.8.13 | NLP (en_core_web_sm) |
| PyPDF2 | 3.0.1 | PDF text extraction |
| scikit-learn | (implicit) | TF-IDF + Cosine similarity |

### Node Backend (Express)
| Package | Purpose |
|---------|---------|
| express | Web framework |
| axios | HTTP client for AI Engine calls |
| cors | Cross-origin support |
| dotenv | Environment variables |
| multer | File uploads |
| pdf-parse | PDF parsing |
| mongoose | MongoDB ODM |

## 5. Existing Frontend Integrations

- App.jsx has route `/job-match` for the job matching feature
- Layout.jsx has a navigation link to `/job-match`
- Frontend does NOT directly call AI Engine — all AI calls go through the Node backend

## 6. Existing Backend Integrations

| File | Route | AI Engine Endpoint Called |
|------|-------|--------------------------|
| `server/routes/aiRoutes.js` | `/api/ai/upload-resume` | `POST /analyze-resume` |
| `server/routes/aiRoutes.js` | `/api/ai/rankings` | `POST /rank-candidates` |
| `server/services/aiService.js` | Called by `/api/recruiter/match` | `POST /job-match` |

## 7. Potential Breaking Changes

| Risk | Impact | Mitigation |
|------|--------|------------|
| Different JSON serialization | Flask vs FastAPI may format differently | Use identical response models |
| CORS configuration | CORS needs to be explicitly set in FastAPI | Add CORSMiddleware |
| Running port | Must remain 8000 | Configure same port |
| Environment variable references | Backend uses `AI_ENGINE_URL` env var | Keep variable name unchanged |
| spaCy model loading | Model must be loaded at startup | Use lifespan/startup event |

## 8. Migration Strategy

### Phase 1: ✅ Complete — Analysis
- Scan all files
- Document endpoints and contracts
- Identify risks

### Phase 2: 🔲 In Progress — Parallel FastAPI Implementation
- Keep Flask running alongside
- Create FastAPI app with identical endpoints
- Same request/response structure
- Test both simultaneously

### Phase 3: 🔲 Pydantic Validation
- Create `ai-engine/schemas/` directory
- Request validation models
- Response models
- Proper error responses

### Phase 4: 🔲 API Documentation
- Enable `/docs` (Swagger UI)
- Enable `/redoc` (ReDoc)
- Document all endpoints

### Phase 5: 🔲 Backward Compatibility
- Verify Node backend → FastAPI works
- No route changes needed

### Phase 6: 🔲 Cleanup
- Remove Flask code after testing
- Update dependencies
- Update README

## 9. Files to Create

| File | Purpose |
|------|---------|
| `ai-engine/schemas/__init__.py` | Package init |
| `ai-engine/schemas/requests.py` | Pydantic request models |
| `ai-engine/schemas/responses.py` | Pydantic response models |
| `ai-engine/main.py` | FastAPI application entry point |
| `ai-engine/requirements-fastapi.txt` | FastAPI dependencies (parallel) |

## 10. Files to Modify

| File | Change | Risk |
|------|--------|------|
| `ai-engine/requirements.txt` | Add FastAPI + uvicorn | Low — packages only |
| `README.md` | Update architecture + instructions | Low — docs only |
| `migration-report.md` | Track progress | None — new file |

## 11. Success Criteria Checklist

### Preserved (Verified)
- [x] Resume Upload (via `/api/ai/upload-resume` → `/analyze-resume`)
- [x] Resume History (via `/api/ai/history` — direct MongoDB query, no AI call)
- [x] ATS Score (returned from `/analyze-resume` — **Verified: returns `{"skills":[...],"ats_score":30}`**)
- [x] NLP Skill Extraction (via `skill_extractor.py` — **Reused, unmodified**)
- [x] Semantic Matching (via `/job-match` → `similarity_engine.py` — **Verified: returns `{"similarity":10.16,"finalScore":14,...}`**)
- [x] Candidate Ranking (via `/rank-candidates` — **Verified: returns sorted rankings with `_id` support**)
- [x] Application Engine (via `/api/recruiter/match` → `/job-match` — **Contract identical**)
- [x] Job Management (Node backend only — **Unchanged**)
- [x] Feedback System (Node backend only — **Unchanged**)
- [x] Dashboard (Node backend only — **Unchanged**)
- [x] Existing UI (no frontend changes — **No client/ files modified**)
- [x] Existing Database (no database changes — **No models modified**)
- [x] Existing API Contracts (identical JSON responses — **All 4 endpoints verified**)
- [x] Flask Backward Compatibility (Flask `app.py` preserved — **Both frameworks can run in parallel**)

### Added
- [x] FastAPI (new framework — **main.py created**)
- [x] Swagger Docs (auto-generated at `/docs` — **Verified**)
- [x] ReDoc (auto-generated at `/redoc` — **Verified**)
- [x] Pydantic Validation (request/response validation — **schemas/ directory created**)
- [x] Production-ready AI Engine (uvicorn — **Tested and verified**)

## 12. Files Created

| File | Purpose | Status |
|------|---------|--------|
| `migration-report.md` | Migration documentation | ✅ |
| `ai-engine/main.py` | FastAPI application entry point | ✅ |
| `ai-engine/schemas/__init__.py` | Package init | ✅ |
| `ai-engine/schemas/requests.py` | Pydantic request models | ✅ |
| `ai-engine/schemas/responses.py` | Pydantic response models | ✅ |

## 13. Files Modified

| File | Change | Status |
|------|--------|--------|
| `ai-engine/requirements.txt` | Added FastAPI + uvicorn + scikit-learn | ✅ |
| `README.md` | Updated architecture, FastAPI setup, API docs | ✅ |

## 14. Test Results (Verified 2026-06-11)

All endpoints tested against live FastAPI server on `localhost:8000`:

| Test | Endpoint | Response | Status |
|------|----------|----------|--------|
| Health Check | `GET /` | `"IntelliHire AI Engine Running"` | ✅ |
| Analyze Resume | `POST /analyze-resume` | `{"skills":["python","mongodb","react"],"ats_score":30}` | ✅ |
| Job Match | `POST /job-match` | `{"similarity":10.16,"finalScore":14,"matchedSkills":["python"],"missingSkills":["java"],"candidateSkills":["python","react"],"requiredSkills":["python","java"]}` | ✅ |
| Rank Candidates | `POST /rank-candidates` | `{"rankings":[{"candidateId":"1","candidateName":"Alice","score":100,...},{"candidateId":"2","candidateName":"Bob","score":0,...}]}` | ✅ |
| Swagger UI | `GET /docs` | Swagger UI loaded (200 OK) | ✅ |
| OpenAPI Spec | `GET /openapi.json` | 4 endpoints documented | ✅ |
| `_id` backward compat | `POST /rank-candidates` with `_id` field | Parsed correctly via alias | ✅ |
