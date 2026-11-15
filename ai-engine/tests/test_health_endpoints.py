"""
Health endpoint contract tests: SBERT lifecycle state + optional LLM reporting.

WHY THIS FILE:
Commit 2 (stabilize SBERT lifecycle / health reporting) pins these facts:

  - /health/llm and /health/llm-test return a REAL HTTP 503 when the
    optional LLM is down — previously they returned HTTP 200 with an
    error-shaped body, which HTTP-level monitors and load balancers read
    as "healthy" while the LLM was dead;
  - the MAIN /health response still returns HTTP 200 with the LLM down
    (the LLM is optional) and reports the LLM's state;
  - sbert_v2 distinguishes "directory exists" from "model loaded", and a
    corrupt model reports its load error instead of staying silent;
  - the base SBERT singleton load state is reported accurately (package
    importable != model in memory);
  - every health probe degrades with a controlled error, never an exception.

APPROACH:
A minimal FastAPI app wraps ONLY the health router (no app.main), so the
tests cannot trigger load_dotenv() into the test process. LLM_BASE_URL is
pinned per test (autouse default: a refused localhost port), so results
never depend on whether this machine runs an LLM or what .env contains.
"""

import json
import os
import socket
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings  # noqa: E402
from app.routers.health import router as health_router  # noqa: E402
from services import sbert_embeddings as sb  # noqa: E402

app = FastAPI()
app.include_router(health_router)


# ── Fixtures ───────────────────────────────────────────────────────────────
def _refused_port_url() -> str:
    """A localhost URL whose port nothing listens on (instant refusal)."""
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    return f"http://127.0.0.1:{port}"


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def llm_url_has_no_server(monkeypatch):
    """Deterministic default: LLM_BASE_URL points at a refused port.

    Without this, 'LLM unavailable' tests would silently depend on whether
    this machine happens to run a server on the default LLM port.
    """
    monkeypatch.setattr(settings, "LLM_BASE_URL", _refused_port_url())


@pytest.fixture(autouse=True)
def sbert_singletons_reset(monkeypatch):
    """Health must report actual singleton state — never state leaked from
    another test (other suites may have loaded real models into singletons)."""
    monkeypatch.setattr(sb, "_model", None)
    monkeypatch.setattr(sb, "_model_name", None)
    monkeypatch.setattr(sb, "_base_last_error", None)
    monkeypatch.setattr(sb, "_ft_model", None)
    monkeypatch.setattr(sb, "_ft_model_name", None)
    monkeypatch.setattr(sb, "_ft_last_error", None)


class _StubLLMHandler(BaseHTTPRequestHandler):
    """Minimal llama.cpp-shaped stub: GET /health, POST /v1/chat/completions."""

    def log_message(self, *_args):  # keep pytest output quiet
        pass

    def do_GET(self):
        if self.path == "/health":
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        self.rfile.read(length)
        body = json.dumps(
            {"choices": [{"message": {"content": "Stub LLM reply."}}]}
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


@pytest.fixture
def llm_stub_url(monkeypatch):
    """A real local HTTP server standing in for an available LLM."""
    server = ThreadingHTTPServer(("127.0.0.1", 0), _StubLLMHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_address[1]}"
    monkeypatch.setattr(settings, "LLM_BASE_URL", url)
    try:
        yield url
    finally:
        server.shutdown()
        server.server_close()


# ── 1. LLM unavailable → REAL HTTP 503, engine stays healthy ───────────────
def test_health_llm_unavailable_returns_http_503(client):
    response = client.get("/health/llm")
    assert response.status_code == 503  # was HTTP 200 with an error body
    payload = response.json()
    assert payload["success"] is False
    assert payload["status_code"] == 503  # envelope kept for API clients
    assert payload["message"] == "Local LLM server is unavailable."
    assert payload["data"] == {"status": "unavailable"}


def test_health_llm_test_unavailable_returns_http_503(client):
    response = client.get("/health/llm-test")
    assert response.status_code == 503
    payload = response.json()
    assert payload["success"] is False
    assert payload["status_code"] == 503
    assert payload["message"] == "Local LLM generation failed."
    # Controlled error: a diagnosis (exception class), not a silent failure
    # and not a .env-sourced URL echo.
    assert payload["data"]["error"]


def test_main_health_stays_200_when_llm_unavailable(client):
    response = client.get("/health")
    assert response.status_code == 200  # optional LLM must not fail health
    data = response.json()["data"]
    assert data["status"] == "healthy"
    assert data["llm"]["optional"] is True
    assert data["llm"]["reachable"] is False
    assert data["llm"]["status"] == "unavailable"
    assert data["llm"]["detail"] == "Local LLM server is unavailable."


# ── 2. LLM available → 200s ────────────────────────────────────────────────
def test_health_llm_available_returns_http_200(client, llm_stub_url):
    response = client.get("/health/llm")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"] == {"status": "connected"}
    assert payload["model_used"] == "llama.cpp"


def test_health_llm_test_available_generates_text(client, llm_stub_url):
    response = client.get("/health/llm-test")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["data"]["generated_text"] == "Stub LLM reply."


def test_main_health_reports_llm_connected(client, llm_stub_url):
    response = client.get("/health")
    assert response.status_code == 200
    llm = response.json()["data"]["llm"]
    assert llm["reachable"] is True
    assert llm["status"] == "connected"
    assert llm["error"] is None


# ── 3. sbert_v2: directory existence vs successful load ────────────────────
def test_sbert_v2_directory_present_but_not_loaded_yet(
    client, tmp_path, monkeypatch
):
    model_dir = tmp_path / "sbert_v2"
    model_dir.mkdir()
    monkeypatch.setenv("SBERT_MODEL_PATH", str(model_dir))

    v2 = client.get("/health").json()["data"]["models"]["sbert_v2"]
    assert v2["enabled"] is True
    assert v2["directory_exists"] is True
    assert v2["available"] is True  # legacy field: directory exists
    assert v2["loaded"] is False  # not loaded until first semantic match
    assert v2["last_error"] is None  # no attempt -> no error
    assert "lazily" in v2["note"]


def test_sbert_v2_missing_directory_reported_as_unavailable(
    client, tmp_path, monkeypatch
):
    monkeypatch.setenv("SBERT_MODEL_PATH", str(tmp_path / "no_such_dir"))

    v2 = client.get("/health").json()["data"]["models"]["sbert_v2"]
    assert v2["enabled"] is True
    assert v2["directory_exists"] is False
    assert v2["available"] is False
    assert v2["loaded"] is False
    assert "not a directory" in v2["note"]


def test_sbert_v2_corrupt_model_reports_load_failure(
    client, tmp_path, monkeypatch
):
    model_dir = tmp_path / "sbert_v2"
    model_dir.mkdir()
    (model_dir / "model.safetensors").write_bytes(b"not a real model")
    monkeypatch.setenv("SBERT_MODEL_PATH", str(model_dir))

    # Corruption is only observable after an actual load attempt.
    assert sb.get_finetuned_model() is None  # controlled: None, never raises

    v2 = client.get("/health").json()["data"]["models"]["sbert_v2"]
    assert v2["directory_exists"] is True  # the directory EXISTS ...
    assert v2["loaded"] is False  # ... but the model did NOT load
    assert v2["last_error"]  # failure reported, not silent
    assert "failed to load" in v2["note"]


def test_sbert_v2_disabled_when_env_var_unset(client, monkeypatch):
    monkeypatch.delenv("SBERT_MODEL_PATH", raising=False)

    v2 = client.get("/health").json()["data"]["models"]["sbert_v2"]
    assert v2["enabled"] is False
    assert v2["directory_exists"] is False
    assert v2["loaded"] is False
    assert v2["last_error"] is None
    assert "not active" in v2["note"]


# ── 4. Base SBERT singleton load state ─────────────────────────────────────
def test_base_sbert_loaded_state_reported_accurately(client, monkeypatch):
    # Not loaded: package importable, but singleton NOT in memory.
    st = client.get("/health").json()["data"]["models"]["sentence_transformers"]
    assert st["available"] is True  # package importable
    assert st["loaded"] is False  # singleton NOT in memory
    assert st["last_error"] is None  # no attempt -> no error

    # Loaded: singleton present (sentinel object avoids paying a real load).
    monkeypatch.setattr(sb, "_model", object())
    monkeypatch.setattr(sb, "_model_name", "stub-base-model")
    st = client.get("/health").json()["data"]["models"]["sentence_transformers"]
    assert st["loaded"] is True
    assert st["model"] == "stub-base-model"


def test_base_sbert_load_failure_reported(client, monkeypatch):
    monkeypatch.setattr(sb, "_base_last_error", "simulated load failure")
    st = client.get("/health").json()["data"]["models"]["sentence_transformers"]
    assert st["loaded"] is False
    assert st["last_error"] == "simulated load failure"


# ── 5. /health/models mirrors the same distinctions ────────────────────────
def test_health_models_endpoint_reports_directory_vs_loaded(
    client, tmp_path, monkeypatch
):
    model_dir = tmp_path / "sbert_v2"
    model_dir.mkdir()
    monkeypatch.setenv("SBERT_MODEL_PATH", str(model_dir))

    data = client.get("/health/models").json()["data"]
    assert data["sbert_v2"]["directory_exists"] is True
    assert data["sbert_v2"]["loaded"] is False
    assert data["sentence_transformers"]["available"] is True
    assert data["sentence_transformers"]["loaded"] is False


# ── 6. Contract preservation ───────────────────────────────────────────────
def test_main_health_keeps_scoring_contract_fields(client):
    data = client.get("/health").json()["data"]
    assert data["scoring"]["version"] == "2.0.0"
    assert data["scoring"]["skill_weight"] == 0.60
    assert data["scoring"]["semantic_weight"] == 0.40
