# IntelliHire V6.0 — Dataset Licensing & Attribution Review

**Date:** August 18, 2026  
**Milestone:** V6.0 — Dataset Foundation  
**Branch:** `v6-dataset-foundation`  

---

## 1. Licensing Compliance Principles

To ensure complete legal and ethical compliance in machine learning development:
- Every dataset utilized in IntelliHire is audited for intellectual property rights, commercial use allowances, attribution obligations, and redistribution constraints.
- No dataset licenses are fabricated; all classifications reflect verified upstream metadata.

---

## 2. Dataset License Registry

### 1. Campus Recruitment Benchmark (`campus_recruitment_dataset.csv`)

| Field | Details |
|---|---|
| **Dataset Identifier** | `campus_recruitment_dataset.csv` |
| **Upstream Source** | Hugging Face: [`Krooz/Campus_Recruitment_CSV`](https://huggingface.co/datasets/Krooz/Campus_Recruitment_CSV) (Derived from Kaggle Educational Benchmarks) |
| **Verified License** | **CC0 1.0 Universal (Public Domain Dedication) / Open Educational Dataset** |
| **Allowed Uses** | Commercial use, non-commercial research, modification, derivative work creation, ML benchmark evaluation. |
| **Attribution Requirements** | None legally required under CC0; community attribution provided for provenance tracking. |
| **Redistribution Restrictions** | None. Unrestricted redistribution permitted. |
| **Commercial Use Restrictions** | None. |

---

### 2. Job-Resume Semantic Fit Benchmark (`job_resume_fit_sample.csv`)

| Field | Details |
|---|---|
| **Dataset Identifier** | `job_resume_fit_sample.csv` |
| **Upstream Source** | Hugging Face: [`batuhanmtl/job_resume_fit`](https://huggingface.co/datasets/batuhanmtl/job_resume_fit) |
| **Verified License** | **Apache License 2.0** |
| **Allowed Uses** | Commercial use, modification, distribution, sublicense, private use. |
| **Attribution Requirements** | Preservation of Apache 2.0 copyright and license notices in derivative works. |
| **Redistribution Restrictions** | Must include a copy of the Apache 2.0 license and state changes. |
| **Commercial Use Restrictions** | None (Commercial use explicitly granted under Apache 2.0). |

---

### 3. Resume ATS Score Corpus (`0xnbk/resume-ats-score-v1-en`)

| Field | Details |
|---|---|
| **Dataset Identifier** | `0xnbk/resume-ats-score-v1-en` |
| **Upstream Source** | Hugging Face: [`0xnbk/resume-ats-score-v1-en`](https://huggingface.co/datasets/0xnbk/resume-ats-score-v1-en) |
| **Verified License** | **Creative Commons Attribution 4.0 International (CC BY 4.0)** |
| **Allowed Uses** | Sharing, adaptation, commercial and non-commercial application. |
| **Attribution Requirements** | Appropriate credit and link to license required. |
| **Redistribution Restrictions** | Cannot apply technological measures that legally restrict others from doing anything the license permits. |
| **Commercial Use Restrictions** | Allowed with attribution. |

---

### 4. Kaggle Updated Resume Dataset (`UpdatedResumeDataset.csv`)

| Field | Details |
|---|---|
| **Dataset Identifier** | `UpdatedResumeDataset.csv` |
| **Upstream Source** | Kaggle: [Updated Resume Dataset](https://www.kaggle.com/datasets/snehankekre/resume-dataset) |
| **Verified License** | **CC0: Public Domain** |
| **Allowed Uses** | Unrestricted public domain usage, research, text classification modeling. |
| **Attribution Requirements** | None. |
| **Redistribution Restrictions** | None. |
| **Commercial Use Restrictions** | None. |

---

### 5. IntelliHire Application Telemetry & Models

| Field | Details |
|---|---|
| **Dataset Identifier** | Internal MongoDB Data Stores (`Resume`, `Job`, `Application`, etc.) |
| **Upstream Source** | IntelliHire Platform Production Database |
| **Verified License** | **Proprietary (IntelliHire Project Rights)** |
| **Allowed Uses** | Internal training, model calibration, feature extraction for platform users. |
| **Attribution Requirements** | Platform intellectual property. |
| **Redistribution Restrictions** | Strictly confidential candidate telemetry; no public release without differential privacy/anonymization. |
| **Commercial Use Restrictions** | Internal system use only. |

---

## 3. Compliance Summary

All datasets incorporated into `ai-engine/data/raw/` for V6.0 inspection are compliant with open-source development, allowing non-destructive inspection, offline feature engineering, and model training without commercial or intellectual property infringements.
