"""
IntelliHire FastAPI AI Engine - Entry Point

WHY THIS FILE:
Main FastAPI application that wires together routers, middleware, and configuration.
This is the file that uvicorn serves: `uvicorn app.main:app --reload`

WHY THIS APPROACH:
- Module-based structure (app/) keeps code organized by domain
- Routers handle endpoint logic, reusing existing unchanged business logic modules
- Configuration is centralized in core/config.py
- CORS is configured once here for all routes

ALTERNATIVES CONSIDERED:
- Single monolithic file: would be 200+ lines, hard to maintain
- Keeping Flask structure: would lose FastAPI benefits (docs, validation, async)

RISK ASSESSMENT:
- Low: All business logic is reused from existing modules (skill_extractor, ai/*)
- Low: API contracts are identical to Flask (verified by Pydantic response models)
- Zero: Flask app.py is preserved for rollback
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import resume as resume_router
from app.routers import matching as matching_router
from app.routers import ranking as ranking_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan event handler.
    Handles startup and shutdown logic.
    
    The spaCy model is loaded at module level in skill_extractor.py,
    so no additional initialization is needed here.
    """
    print(f"{settings.APP_NAME} {settings.APP_VERSION} starting...")
    yield
    print(f"{settings.APP_NAME} shutting down...")


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


# --- CORS ---
# WHY: The Node.js backend calls this service directly.
# CORS must allow cross-origin requests from the proxy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Include Routers ---
# WHY: Each endpoint set is isolated in its own router file.
# This keeps the codebase organized as features grow.
app.include_router(resume_router.router)
app.include_router(matching_router.router)
app.include_router(ranking_router.router)


# ──────────────────────────────────────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def home():
    """Root health check - returns the same response as the original Flask app."""
    return "IntelliHire AI Engine Running"


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Detailed health check endpoint.
    
    Returns service status, engine name, and version.
    Used by deployment platforms (Render, Railway) for monitoring.
    """
    return {
        "status": "healthy",
        "engine": "IntelliHire AI",
        "version": settings.APP_VERSION,
    }