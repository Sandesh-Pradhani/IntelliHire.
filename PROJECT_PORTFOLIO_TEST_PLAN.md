# Project Portfolio Management - Test Plan

## IntelliHire V5.3 - PROJECT_PORTFOLIO_TEST_PLAN.md

---

## 1. CRUD Operations

### 1.1 Create Project
| Test | Steps | Expected |
|------|-------|----------|
| Create project with all fields | Fill title, description, technologies, githubUrl, liveDemoUrl, category, duration, teamSize, role, status | Project created, appears in list |
| Create project with minimal fields | Fill only title | Project created with defaults |
| Create project without title | Leave title empty, click Save | Validation error, form stays open |
| Create project with technologies | Enter "React, Node.js, MongoDB" | Technologies saved as array |
| Create featured project | Check "Featured project" checkbox | Project marked as featured |

### 1.2 Read Project
| Test | Steps | Expected |
|------|-------|----------|
| View project list | Navigate to Portfolio > Projects | All projects displayed in grid |
| View project details | Click on a project card | Detail modal opens with full info |
| View project with score | Click on scored project | AI score displayed with breakdown |

### 1.3 Update Project
| Test | Steps | Expected |
|------|-------|----------|
| Edit project title | Click edit, change title, save | Title updated in list |
| Edit project technologies | Click edit, modify tech list | Technologies updated |
| Edit project status | Change from "completed" to "in-progress" | Status badge updates |

### 1.4 Delete Project
| Test | Steps | Expected |
|------|-------|----------|
| Delete project | Click delete, confirm in dialog | Project removed from list |
| Delete last project | Delete only project | Empty state shown |

---

## 2. AI Score

### 2.1 Score Calculation
| Test | Steps | Expected |
|------|-------|----------|
| Score project without GitHub URL | Click "Get AI Score" | Score with repo=0, recommendation shown |
| Score project with GitHub URL | Add valid GitHub URL, score | Repository score > 0 |
| Score project with many technologies | Add 8+ technologies | Technology score high |
| Score project with rich description | Add 100+ word description | Documentation score high |

### 2.2 Score Display
| Test | Steps | Expected |
|------|-------|----------|
| Score ring color (high) | Score >= 70 | Green ring and text |
| Score ring color (medium) | Score 50-69 | Amber ring and text |
| Score ring color (low) | Score < 50 | Red ring and text |
| Dimension breakdown | View score card | 4 dimensions shown with weights |
| Re-score button | Click "Re-score" | Score recalculated and updated |

---

## 3. Filtering & Searching

### 3.1 Candidate View
| Test | Steps | Expected |
|------|-------|----------|
| Filter by technology | Portfolio > Projects section | Projects filtered |
| Search projects | Type in search box | Projects filtered by title/description |

### 3.2 Recruiter View
| Test | Steps | Expected |
|------|-------|----------|
| Filter by technology | Select "React" from dropdown | Only React projects shown |
| Filter by category | Select "AI/ML" from dropdown | Only AI/ML projects shown |
| Search projects | Type search term | Projects filtered |
| Clear filters | Reset all filters | All projects shown |
| Pagination | Navigate pages | Correct page of results shown |

---

## 4. Dashboard

### 4.1 Candidate Dashboard
| Test | Steps | Expected |
|------|-------|----------|
| Portfolio widget shows stats | Login as candidate, view dashboard | Total projects, avg score, technologies shown |
| Portfolio widget links | Click "View all" or "Add your first project" | Navigates to portfolio |
| Stats card shows count | View stats row | Project count displayed |

### 4.2 Recruiter Dashboard
| Test | Steps | Expected |
|------|-------|----------|
| Top Portfolio Candidates | Login as recruiter, view dashboard | Top scored projects listed |
| Click candidate project | Click on a project in the list | Navigates to portfolio |

---

## 5. Portfolio Stats

| Test | Steps | Expected |
|------|-------|----------|
| Total Projects count | View stats in Portfolio > Projects | Correct count |
| Average Score | View stats | Calculated from scored projects |
| Technologies Used | View stats | Unique tech count |
| Categories | View stats | Category breakdown |

---

## 6. Responsive Design

| Test | Steps | Expected |
|------|-------|----------|
| Mobile view (< 640px) | Resize browser to 375px | Single column layout, all elements accessible |
| Tablet view (640-1024px) | Resize browser to 768px | 2-column grid, proper spacing |
| Desktop view (> 1024px) | Full width | 3-column grid, full stats |

---

## 7. Error Handling

| Test | Steps | Expected |
|------|-------|----------|
| Network error on save | Disconnect network, try to save | Error alert shown |
| Invalid GitHub URL | Enter invalid URL, score project | Score calculated without repo bonus |
| AI engine unavailable | Stop FastAPI, try to score | Fallback score used |
| 404 on project load | Navigate to invalid project ID | Error message displayed |

---

## 8. Integration

| Test | Steps | Expected |
|------|-------|----------|
| Project appears in portfolio | Create project, view portfolio | Project in list |
| Score persists | Score project, refresh page | Score retained |
| Portfolio completion updates | Add/remove project | Completion % updated |
| Memory event recorded | Create project | CandidateMemory entry created |

---

## 9. Recruiter Evaluation

| Test | Steps | Expected |
|------|-------|----------|
| Recruiter sees all projects | Login as recruiter, view portfolio | All candidate projects visible |
| Recruiter sees candidate name | View project card | Candidate name displayed |
| Recruiter filters by tech | Filter by "Python" | Only Python projects shown |
| Recruiter views score | Click on project | Full AI score displayed |

---

## 10. Performance

| Test | Steps | Expected |
|------|-------|----------|
| Project list loads fast | View portfolio with 50+ projects | Pagination applied, fast load |
| Score calculation fast | Click "Get AI Score" | Score calculated in < 2s |
| Search responsive | Type in search | Results update without lag |
