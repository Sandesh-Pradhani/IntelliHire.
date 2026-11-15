"""
Health check router for IntelliHire AI Engine.

WHY THIS FILE:
Provides health endpoints with execution_time, model_used, and model status
information. Used by deployment platforms for monitoring and auto-scaling.

WHY THIS APPROACH:
Separate router keeps health endpoints isolated from domain logic.
"""

import os
import time
import platform
import logging
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.utils.response import _execution_time, error_response, success_response
from app.services.llm_service import generate_text, probe_server_health
from services.match_scoring import SCORING_VERSION
from services.sbert_embeddings import (
    FINETUNED_ENV_VAR,
    get_finetuned_ab_path,
    get_load_states,
)

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

@router.get("/health/llm")
async def check_llm_health():
    """Check whether the optional local llama.cpp server is reachable.

    Returns a REAL HTTP 503 when the server is down, with the standard error
    envelope as the JSON body. (Previously the envelope was returned as a
    plain dict, so FastAPI answered HTTP 200 and HTTP-level monitors / load
    balancers read a dead LLM as healthy.)
    """
    probe = await probe_server_health(timeout=3.0)
    if probe["reachable"]:
        return success_response(
            data={"status": "connected"},
            message="Local LLM server is reachable.",
            model_used="llama.cpp",
        )

    # The LLM is optional: this endpoint reports its state, but the engine's
    # main /health never fails because of it.
    return JSONResponse(
        status_code=503,
        content=error_response(
            data={"status": "unavailable"},
            message="Local LLM server is unavailable.",
            status_code=503,
        ),
    )

@router.get("/health/llm-test")
async def test_llm_generation():
    """Verify that IntelliHire can generate text using the optional LLM.

    Returns a REAL HTTP 503 on failure (see /health/llm). Only the exception
    class name is reported in the body — the full error (which can echo
    LLM_BASE_URL from .env) goes to the server log instead.
    """
    try:
        text = await generate_text(
            "Explain IntelliHire in one simple sentence.",
            max_tokens=60,
        )

        return success_response(
            data={"generated_text": text},
            message="Local LLM generation successful.",
            model_used="llama.cpp",
        )

    except Exception as exc:  # noqa: BLE001 - optional dependency: never 500
        logger.warning("LLM generation health test failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content=error_response(
                data={"error": type(exc).__name__},
                message="Local LLM generation failed.",
                status_code=503,
            ),
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

    # Fine-tuned SBERT V2 is opt-in: it is enabled only when
    # SBERT_MODEL_PATH points at a local model directory. Directory presence
    # and a successful load are reported as SEPARATE facts: the model loads
    # lazily on the first semantic match, so "directory exists" alone never
    # proves readiness.
    v2_path = get_finetuned_ab_path()
    v2_directory_exists = bool(v2_path and os.path.isdir(v2_path))

    # Read-only singleton states — never trigger a load (a health probe must
    # not pay model-load cost or change engine behavior).
    load_states = get_load_states()
    base_state = load_states["base"]
    v2_state = load_states["finetuned_v2"]

    if not v2_path:
        v2_note = ("SBERT V2 is not active; job matching uses the base "
                   "semantic model and TF-IDF fallback.")
    elif not v2_directory_exists:
        v2_note = ("SBERT V2 path is configured but is not a directory; job "
                   "matching uses the base semantic model and TF-IDF fallback.")
    elif v2_state["loaded"]:
        v2_note = ("SBERT V2 is loaded and active for the 40% semantic "
                   "component.")
    elif v2_state["last_error"]:
        v2_note = ("SBERT V2 directory present but the model failed to load "
                   "(see last_error); scoring falls back to the base semantic "
                   "model.")
    else:
        v2_note = ("SBERT V2 directory present; the model loads lazily on the "
                   "first semantic match.")

    # Optional LLM: a short timeout keeps this endpoint load-balancer
    # friendly, and an unavailable LLM never fails the main health check.
    llm_state = await probe_server_health(timeout=1.0)

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
                # Package importable ...
                "available": sbert_available,
                # ... vs. the base singleton actually in memory:
                "loaded": base_state["loaded"],
                "model": base_state["model"],
                "last_error": base_state["last_error"],
            },
            "sbert_v2": {
                "enabled": bool(v2_path),
                "available": v2_directory_exists,  # legacy field: dir exists
                "directory_exists": v2_directory_exists,
                "loaded": v2_state["loaded"],
                "last_error": v2_state["last_error"],
                "env_var": FINETUNED_ENV_VAR,
                "configured_path": v2_path,
                "note": v2_note,
            },
        },
        # The LLM is optional; it is reported, never required.
        "llm": {
            "optional": True,
            "reachable": llm_state["reachable"],
            "status": llm_state["status"],
            "detail": llm_state["detail"],
            "error": llm_state["error"],
        },
        "scoring": {
            "version": SCORING_VERSION,
            "skill_weight": 0.60,
            "semantic_weight": 0.40,
            "essential_penalty_per_missing": 0.10,
            "essential_penalty_cap": 0.40,
            "rounding": "half-up",
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

    # sentence-transformers (SBERT): package availability and base-model
    # load state are different facts — "package importable" never proved
    # the base model was loaded.
    load_states = get_load_states()
    base_state = load_states["base"]
    try:
        import sentence_transformers
        models_status["sentence_transformers"] = {
            "available": True,
            "loaded": base_state["loaded"],
            "model": base_state["model"],
            "last_error": base_state["last_error"],
            "version": sentence_transformers.__version__,
        }
    except ImportError:
        models_status["sentence_transformers"] = {
            "available": False,
            "loaded": False,
            "error": "sentence-transformers not installed. pip install sentence-transformers",
        }

    # Fine-tuned SBERT V2 (opt-in): directory existence vs successful load.
    v2_state = load_states["finetuned_v2"]
    v2_path = get_finetuned_ab_path()
    models_status["sbert_v2"] = {
        "enabled": bool(v2_path),
        "available": bool(v2_path and os.path.isdir(v2_path)),  # dir exists
        "directory_exists": bool(v2_path and os.path.isdir(v2_path)),
        "loaded": v2_state["loaded"],
        "last_error": v2_state["last_error"],
        "env_var": FINETUNED_ENV_VAR,
        "configured_path": v2_path,
    }

    return success_response(
        data=models_status,
        message="Model status retrieved",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )