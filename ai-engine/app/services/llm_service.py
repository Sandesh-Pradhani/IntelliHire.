import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def generate_text(
    prompt: str,
    *,
    system_prompt: str = "You are IntelliHire, an AI assistant for recruitment.",
    max_tokens: int = 256,
    temperature: float = 0.2,
) -> str:
    """Send a text-generation request to the local llama.cpp server."""

    url = f"{settings.LLM_BASE_URL.rstrip('/')}/v1/chat/completions"

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        result = response.json()

    try:
        return result["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(
            "The local LLM returned an unexpected response format."
        ) from exc


async def probe_server_health(*, timeout: float = 3.0) -> dict:
    """Best-effort reachability probe for the OPTIONAL local LLM server.

    WHY: the engine must start and stay healthy without the LLM, and health
    endpoints must report the LLM's real state without ever raising — a
    broken optional dependency can never turn /health into a 500.

    Returns a plain dict:
      - reachable: True when {LLM_BASE_URL}/health answers 2xx;
      - status:    "connected" | "unavailable";
      - detail:    generic human-readable message;
      - error:     exception class name for diagnosis, None when reachable.

    The full error (which can echo LLM_BASE_URL) is logged server-side only:
    health responses must not echo configuration values that may come from
    .env.
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(
                f"{settings.LLM_BASE_URL.rstrip('/')}/health"
            )
            response.raise_for_status()
        return {
            "reachable": True,
            "status": "connected",
            "detail": "Local LLM server is reachable.",
            "error": None,
        }
    except Exception as exc:  # noqa: BLE001 - optional dependency: never raise
        logger.warning("LLM server health probe failed: %s", exc)
        return {
            "reachable": False,
            "status": "unavailable",
            "detail": "Local LLM server is unavailable.",
            "error": type(exc).__name__,
        }