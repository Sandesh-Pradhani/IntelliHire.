"""
Standard HTTP exception handling and middleware for the AI Engine.

WHY THIS FILE:
Provides centralized exception handling so all endpoints return
consistent error responses with the standard envelope format.

WHY THIS APPROACH:
- FastAPI exception handlers catch and format all errors consistently
- Business logic exceptions remain simple (raise ValueError)
- HTTP status codes are mapped appropriately per error type

ALTERNATIVES CONSIDERED:
- Try/except in every endpoint: repetitive, error-prone
- Custom exception classes: more complex than needed
"""

import time
import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.utils.response import _execution_time

logger = logging.getLogger(__name__)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all unhandled exceptions with a standard error response."""
    start = time.perf_counter()
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "message": f"Internal server error: {str(exc)}",
            "execution_time": _execution_time(start),
            "model_used": None,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions (e.g., 404, 422, 401) with a standard error response."""
    start = time.perf_counter()
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.detail,
            "execution_time": _execution_time(start),
            "model_used": None,
        },
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle Pydantic validation errors with detailed field-level messages."""
    import time as time_module
    start = time_module.perf_counter()
    logger.warning(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "message": f"Validation error: {str(exc)}",
            "execution_time": _execution_time(start),
            "model_used": None,
        },
    )