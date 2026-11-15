"""
Standardized response envelope for all AI Engine endpoints.

WHY THIS FILE:
Provides a consistent response format across all endpoints with
execution_time and model_used fields. Used by all routers.

WHY THIS APPROACH:
- Single source of truth for response format
- Automatic timing calculation
- Consistent error handling

ALTERNATIVES CONSIDERED:
- Per-endpoint response formatting: inconsistent, error-prone
- FastAPI middleware: can't capture per-endpoint timing easily
"""

import time
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


def _execution_time(start: float) -> float:
    """Calculate elapsed time in milliseconds from a start timestamp."""
    return round((time.perf_counter() - start) * 1000.0, 3)


def make_response(
    *,
    success: bool,
    data: Any = None,
    message: str = "",
    execution_time_ms: Optional[float] = None,
    model_used: Optional[str] = None,
) -> dict[str, Any]:
    """Standardized response envelope used by all Phase 3 AI endpoints.

    Args:
        success: Whether the request succeeded
        data: Response payload (list, dict, or None)
        message: Human-readable status message
        execution_time_ms: Request execution time in milliseconds (auto-calc if None)
        model_used: Name of the AI model used (e.g., 'tfidf', 'sbert', 'rule-based')

    Returns:
        dict with standardized envelope fields
    """
    return {
        "success": success,
        "data": data,
        "message": message,
        "execution_time": execution_time_ms,
        "model_used": model_used,
    }


def success_response(
    *,
    data: Any = None,
    message: str = "Success",
    execution_time_ms: Optional[float] = None,
    model_used: Optional[str] = None,
) -> dict[str, Any]:
    """Convenience wrapper for success responses."""
    return make_response(
        success=True,
        data=data,
        message=message,
        execution_time_ms=execution_time_ms,
        model_used=model_used,
    )


def error_response(
    *,
    message: str = "Error",
    data: Any = None,
    execution_time_ms: Optional[float] = None,
    status_code: int = 400,
) -> dict[str, Any]:
    """Convenience wrapper for error responses.

    The status_code is included in the response for the client,
    but the actual HTTP status code is set by the exception handler.
    """
    return {
        "success": False,
        "data": data,
        "message": message,
        "execution_time": execution_time_ms,
        "model_used": None,
        "status_code": status_code,
    }