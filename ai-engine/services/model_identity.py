"""
Semantic-model identity for scoring snapshots.

WHY THIS FILE:
A snapshot must record which semantic model actually produced the semantic
component at calculation time, and it must never invent an identifier or a
hash. The only verifiable sources are:

  - the fine-tuned SBERT V2 directory (SBERT_MODEL_PATH): the weights are on
    local disk, so SHA-256 over `model.safetensors` is verifiable;
  - the TF-IDF fallback: it has no weight file, so the hash is explicitly None
    and the calibration is explicitly None.

Everything here is additive-only: no existing score, field, or default
behavior changes. The weights hash is computed once per resolved path per
process (a ~90 MB file read) and cached, so the first scored request after an
engine start pays the cost exactly once.

NO SCORING LOGIC: this module never returns or alters a score.
"""

import hashlib
import os

# Fixed in code (Step 9 LOCKED identity calibration, implemented verbatim in
# services/sbert_embeddings.py): x100 mapping of the raw fine-tuned cosine,
# clamped into 0-100. It is a calibrated fixed mapping, not a model artifact.
SBERT_V2_CALIBRATION = "clamp(100*raw_cosine, 0, 100)"

FALLBACK_MODEL_ID = "tf-idf"

_WEIGHTS_FILENAME = "model.safetensors"
_WEIGHTS_HASH_CACHE = {}


def compute_weights_sha256(model_path: str):
    """Return the SHA-256 hex digest of the model's weights file, or None.

    None means "hash not verifiable" — a missing weights file must never be
    reported as a fabricated checksum.
    """
    if not model_path:
        return None
    weights_path = os.path.join(str(model_path), _WEIGHTS_FILENAME)
    if not os.path.isfile(weights_path):
        return None

    resolved = os.path.realpath(weights_path)
    try:
        stat = os.stat(resolved)
    except OSError:
        return None

    cache_key = (resolved, stat.st_mtime_ns, stat.st_size)
    cached = _WEIGHTS_HASH_CACHE.get(cache_key)
    if cached is not None:
        return cached

    digest = hashlib.sha256()
    try:
        with open(resolved, "rb") as handle:
            for block in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(block)
    except OSError:
        return None

    value = digest.hexdigest()
    _WEIGHTS_HASH_CACHE[cache_key] = value
    return value


def get_sbert_v2_identity(model_path):
    """Identity block for the fine-tuned SBERT V2 semantic source.

    `model_path` is the configured/loaded directory (verbatim; it may be a
    filesystem path). The weights hash is None both for remote/hub model
    identifiers and when the weights file cannot be read — never invented.
    """
    return {
        "modelId": str(model_path) if model_path else None,
        "weightsSHA256": compute_weights_sha256(model_path),
        "calibration": SBERT_V2_CALIBRATION,
    }


def get_fallback_identity():
    """Identity block for the TF-IDF fallback semantic source."""
    return {
        "modelId": FALLBACK_MODEL_ID,
        "weightsSHA256": None,
        "calibration": None,
    }


def resolve_semantic_model_info(semantic_model, fallback_enabled: bool=False):
    """Build the `semanticModelInfo` payload for one /job-match response.

    `semantic_model` is the value the scoring breakdown already reports for
    the run (fine-tuned path / model name / "tf-idf"). When `fallback_enabled`
    is True the result is the TF-IDF identity. A model identifier that is a
    real local directory gets its weights hash verified; anything else keeps
    hash and calibration explicitly None.

    Returns None for an unrecognized input so the caller can omit the field
    instead of guessing.
    """
    if fallback_enabled:
        return get_fallback_identity()

    if not semantic_model or not str(semantic_model).strip():
        return None

    model_str = str(semantic_model)
    if os.path.isdir(model_str):
        return get_sbert_v2_identity(model_str)

    # A hub model identifier or an unresolvable path: identifier is reported
    # verbatim, hash and calibration stay explicitly None.
    if model_str == FALLBACK_MODEL_ID:
        return None
    return {
        "modelId": model_str,
        "weightsSHA256": None,
        "calibration": None,
    }
