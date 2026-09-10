"""
Health check router for IntelliHire AI Engine.

WHY THIS FILE:
Provides health endpoints with execution_time, model_used, and model status
information. Used by deployment platforms for monitoring and auto-scaling.

WHY THIS APPROACH:
Separate router keeps health endpoints isolated from domain logic.
"""

import time
import platform
import logging
from fastapi import APIRouter

from app.core.config import settings
from app.utils.response import _execution_time, success_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get("/", summary="Root health check")
async def home():
    """
    Root health check - returns standard envelope with execution_time.

    Used by load balancers and Docker health checks.
    """
    start = time.perf_counter()
    return success_response(
        data={
            "status": "healthy",
            "engine": settings.APP_NAME,
            "version": settings.APP_VERSION,
        },
        message=f"{settings.APP_NAME} running",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.get("/health", summary="Detailed health check")
async def health_check():
    """
    Detailed health check with model status and system info.

    Returns:
        - status: Service health status
        - engine: Engine name
        - version: Software version
        - models: Status of loaded models (spaCy, SBERT)
        - system: Python version and platform info
        - execution_time: Request execution time
    """
    start = time.perf_counter()

    # Check spaCy model status
    spacy_loaded = False
    try:
        import spacy
        try:
            spacy.load(settings.SPACY_MODEL)
            spacy_loaded = True
        except OSError:
            spacy_loaded = False
    except ImportError:
        spacy_loaded = False

    # Check sentence-transformers status
    sbert_available = False
    try:
        import sentence_transformers
        sbert_available = True
    except ImportError:
        sbert_available = False

    data = {
        "status": "healthy",
        "engine": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "models": {
            "spacy": {
                "loaded": spacy_loaded,
                "model": settings.SPACY_MODEL,
            },
            "sentence_transformers": {
                "available": sbert_available,
            },
        },
        "system": {
            "python": platform.python_version(),
            "platform": platform.platform(),
        },
    }

    return success_response(
        data=data,
        message="Health check complete",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.get("/health/models", summary="Model status")
async def model_status():
    """
    Returns the status of all AI models used by the engine.

    Useful for debugging and monitoring which models are loaded.
    """
    start = time.perf_counter()

    models_status = {}

    # spaCy
    try:
        import spacy
        try:
            nlp = spacy.load(settings.SPACY_MODEL)
            models_status["spacy"] = {
                "loaded": True,
                "model": settings.SPACY_MODEL,
                "components": list(nlp.component_names),
            }
        except OSError:
            models_status["spacy"] = {
                "loaded": False,
                "model": settings.SPACY_MODEL,
                "error": "Model not found. Run: python -m spacy download en_core_web_sm",
            }
    except ImportError:
        models_status["spacy"] = {"loaded": False, "error": "spacy not installed"}

    # scikit-learn
    try:
        import sklearn
        models_status["scikit-learn"] = {
            "loaded": True,
            "version": sklearn.__version__,
        }
    except ImportError:
        models_status["scikit-learn"] = {"loaded": False, "error": "scikit-learn not installed"}

    # sentence-transformers (SBERT)
    try:
        import sentence_transformers
        models_status["sentence_transformers"] = {
            "loaded": True,
            "version": sentence_transformers.__version__,
        }
    except ImportError:
        models_status["sentence_transformers"] = {"loaded": False, "error": "sentence-transformers not installed. pip install sentence-transformers"}

    return success_response(
        data=models_status,
        message="Model status retrieved",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )