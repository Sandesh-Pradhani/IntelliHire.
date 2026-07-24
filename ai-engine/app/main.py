"""
IntelliHire FastAPI AI Engine - Entry Point

WHY THIS FILE:
Main FastAPI application that wires together routers, middleware, exception handlers,
and configuration. This is the file that uvicorn serves: `uvicorn app.main:app --reload`

WHY THIS APPROACH:
- Module-based structure (app/) keeps code organized by domain
- Routers handle endpoint logic, reusing existing unchanged business logic modules
- Configuration is centralized in core/config.py
- CORS is configured once here for all routes
- Exception handlers ensure consistent error responses
- Structured logging with latency/model timing

ALTERNATIVES CONSIDERED:
- Single monolithic file: would be 200+ lines, hard to maintain
- Keeping Flask structure: would lose FastAPI benefits (docs, validation, async)

RISK ASSESSMENT:
- Low: All business logic is reused from existing modules (skill_extractor, ai/*)
- Low: API contracts are identical to Flask (verified by Pydantic response models)
- Zero: Flask app.py is preserved for rollback
"""

import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import resume as resume_router
from app.routers import matching as matching_router
from app.routers import ranking as ranking_router
from app.routers import insights as insights_router
from app.routers import health as health_router
from app.routers import tasks as tasks_router
from app.routers import recruiter_ai as recruiter_ai_router
from app.routers import resume_suggestions as resume_suggestions_router
from app.routers import candidate_recommendations as candidate_recommendations_router
from app.utils.exceptions import generic_exception_handler, http_exception_handler, validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException
from app.utils.response import _execution_time

# ──────────────────────────────────────────────────────────────────────────────
# Structured Logging Setup
# ──────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan event handler.
    Handles startup and shutdown logic.

    The spaCy model is loaded at module level in skill_extractor.py,
    so no additional initialization is needed here.
    """
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} starting...")
    yield
    logger.info(f"{settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    # WHY explicit URLs: Ensures Swagger UI and ReDoc are always discoverable
    # regardless of deployment proxy configuration
)


# ──────────────────────────────────────────────────────────────────────────────
# Exception Handlers
# ──────────────────────────────────────────────────────────────────────────────

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# ──────────────────────────────────────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────────────
# Request Timing Middleware
# ──────────────────────────────────────────────────────────────────────────────

@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    """Log request timing for all endpoints."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = _execution_time(start)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({elapsed}ms)")
    return response


# ──────────────────────────────────────────────────────────────────────────────
# Include Routers
# ──────────────────────────────────────────────────────────────────────────────

app.include_router(health_router.router)
app.include_router(resume_router.router)
app.include_router(matching_router.router)
app.include_router(ranking_router.router)
app.include_router(insights_router.router)
app.include_router(tasks_router.router)
app.include_router(recruiter_ai_router.router)
app.include_router(resume_suggestions_router.router)
app.include_router(candidate_recommendations_router.router)
