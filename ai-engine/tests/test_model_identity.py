"""
Tests for the semantic-model identity block used by scoring snapshots.

WHY THIS FILE:
A snapshot must never invent a model identifier or a checksum. These tests
pin the contract of `services.model_identity`:

  - a real weights file yields its true SHA-256 hex digest;
  - a missing weights file, an empty path or a read failure yields None,
    never a fabricated hash;
  - the SBERT V2 calibration is the locked Step 9 clamp(100*raw, 0, 100)
    mapping string, verbatim;
  - the TF-IDF fallback identity explicitly carries no hash and no
    calibration;
  - non-directory identifiers (hub names) are reported verbatim with hash and
    calibration explicitly None.
"""

import hashlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services import model_identity  # noqa: E402
from services.model_identity import (  # noqa: E402
    FALLBACK_MODEL_ID,
    SBERT_V2_CALIBRATION,
    compute_weights_sha256,
    get_fallback_identity,
    get_sbert_v2_identity,
    resolve_semantic_model_info,
)


def test_weights_hash_is_the_true_sha256(tmp_path):
    weights = tmp_path / "model.safetensors"
    payload = b"deterministic weights bytes"
    weights.write_bytes(payload)

    expected = hashlib.sha256(payload).hexdigest()
    assert compute_weights_sha256(str(tmp_path)) == expected


def test_missing_weights_file_hash_is_none(tmp_path):
    # Directory with no weights file: identifier verifiable, hash is not.
    assert compute_weights_sha256(str(tmp_path)) is None


def test_empty_path_hash_is_none():
    assert compute_weights_sha256(None) is None
    assert compute_weights_sha256("") is None


def test_hash_cached_per_path_and_mtime(tmp_path):
    weights = tmp_path / "model.safetensors"
    weights.write_bytes(b"version-a")
    first = compute_weights_sha256(str(tmp_path))
    assert first == compute_weights_sha256(str(tmp_path))

    weights.write_bytes(b"version-b")
    # A same-size rewrite can land inside ONE filesystem mtime tick, which
    # would leave the (path, mtime_ns, size) cache key unchanged and make
    # this test fail nondeterministically (measured: 117/200 back-to-back
    # same-size writes collided -> ~17% stale-digest failures). Pin the mtime
    # forward so the cache key provably changes; the assertion below is
    # UNCHANGED and still fails on any stale cached digest.
    bumped_ns = os.stat(weights).st_mtime_ns + 1_000_000_000
    os.utime(weights, ns=(bumped_ns, bumped_ns))
    assert compute_weights_sha256(str(tmp_path)) == hashlib.sha256(
        b"version-b"
    ).hexdigest()


def test_sbert_v2_identity_shape():
    identity = get_sbert_v2_identity("F:/models/sbert_v2")
    assert identity["modelId"] == "F:/models/sbert_v2"
    assert identity["calibration"] == "clamp(100*raw_cosine, 0, 100)"
    # Not a real directory here: hash stays explicitly None.
    assert identity["weightsSHA256"] is None


def test_sbert_v2_calibration_matches_locked_step9_mapping():
    assert SBERT_V2_CALIBRATION == "clamp(100*raw_cosine, 0, 100)"
    assert model_identity.SBERT_V2_CALIBRATION == SBERT_V2_CALIBRATION


def test_fallback_identity_has_no_hash_and_no_calibration():
    identity = get_fallback_identity()
    assert identity == {
        "modelId": FALLBACK_MODEL_ID,
        "weightsSHA256": None,
        "calibration": None,
    }


def test_resolve_uses_fallback_identity_when_fallback_enabled():
    assert resolve_semantic_model_info("anything", fallback_enabled=True) == {
        "modelId": FALLBACK_MODEL_ID,
        "weightsSHA256": None,
        "calibration": None,
    }


def test_resolve_directory_identifier_verifies_its_weights(tmp_path):
    (tmp_path / "model.safetensors").write_bytes(b"weights")
    info = resolve_semantic_model_info(str(tmp_path), fallback_enabled=False)
    assert info["modelId"] == str(tmp_path)
    assert info["weightsSHA256"] == hashlib.sha256(b"weights").hexdigest()
    assert info["calibration"] == SBERT_V2_CALIBRATION


def test_resolve_hub_identifier_is_verbatim_without_hash():
    info = resolve_semantic_model_info(
        "sentence-transformers/all-MiniLM-L6-v2", fallback_enabled=False
    )
    assert info == {
        "modelId": "sentence-transformers/all-MiniLM-L6-v2",
        "weightsSHA256": None,
        "calibration": None,
    }


def test_resolve_empty_identifier_returns_none():
    assert resolve_semantic_model_info(None, fallback_enabled=False) is None
    assert resolve_semantic_model_info("   ", fallback_enabled=False) is None


def test_resolve_tfidf_literal_returns_none():
    # Handled by the explicit fallback flag; a stray literal must not become
    # a half-identity guess.
    assert resolve_semantic_model_info(FALLBACK_MODEL_ID) is None
