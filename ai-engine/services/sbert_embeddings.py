"""
SBERT (Sentence-BERT) embedding model manager with lazy loading.

WHY THIS FILE:
Provides semantic similarity computation using sentence-transformers.
The model is loaded lazily (on first use) to avoid memory usage when
only simple TF-IDF matching is needed.

WHY THIS APPROACH:
- Lazy loading: model is only loaded when semantic matching is requested
- Singleton pattern: model is loaded once and reused
- Graceful fallback: returns None if sentence-transformers is not installed

ALTERNATIVES CONSIDERED:
- Always-loaded model: wastes memory when not needed
- TF-IDF only: less accurate semantic matching
- OpenAI embeddings: adds cost and latency
"""

import logging
import os
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

# Global model instance (singleton pattern)
_model = None
_model_name = None
# Last base-model load failure, for health reporting only (None until an
# attempt fails; cleared by a later successful load). Read via
# get_load_states(); it never triggers a load and never affects a return
# value — an unavailable model still degrades exactly as before.
_base_last_error: Optional[str] = None

# ---------------------------------------------------------------------------
# A/B feature flag: SBERT_MODEL_PATH (Step 4 controlled integration testing)
#
# WHAT PROBLEM IT SOLVES:
# Allows the fine-tuned SBERT model (experiments/sbert_ranking_v1) to be
# evaluated against the production model WITHOUT changing any production
# score, field, or default behavior.
#
# CONTRACT (do not break):
# - Env var unset/empty  -> exactly the pre-flag behavior; the fine-tuned
#   model is NEVER loaded.
# - Env var set to a valid directory -> the PRODUCTION model still computes
#   `similarity` / `similarity_score` / `match_percentage` (unchanged values),
#   and the fine-tuned model's RAW cosine is added as a SEPARATE field
#   `similarity_score_finetuned_raw` (range [-1, 1], NOT multiplied by 100,
#   no thresholds). Step 9/10: the LOCKED identity calibration
#   clamp(100 * raw, 0, 100) is additionally exposed as
#   `match_percentage_v2_calibrated` (0-100, additive only). Both new fields
#   are derived from the same encode; they never influence any production
#   score, threshold, or blend. Existing fields are never replaced/re-scaled.
# ---------------------------------------------------------------------------

FINETUNED_ENV_VAR = "SBERT_MODEL_PATH"

# Optional local-directory override for the PRODUCTION base model
# (all-MiniLM-L6-v2). When SBERT_BASE_MODEL_PATH points at a valid
# SentenceTransformer directory, it is loaded from disk instead of the hub
# name. Unset/invalid -> default hub name, unchanged behavior.
BASE_MODEL_ENV_VAR = "SBERT_BASE_MODEL_PATH"

# Separate singleton for the fine-tuned model (never touches `_model`).
_ft_model = None
_ft_model_name = None
# Last fine-tuned (SBERT V2) load attempt failure, for health reporting only.
# Same contract as _base_last_error: read-only, additive, never raises.
_ft_last_error: Optional[str] = None


def get_finetuned_ab_path() -> Optional[str]:
    """Return the configured fine-tuned model path, or None when flag is OFF.

    Reads the env var at call time (not import time) so tests can toggle the
    flag per-process and behavior cannot drift with import order.
    """
    raw = os.environ.get(FINETUNED_ENV_VAR, "")
    raw = raw.strip()
    return raw or None


def get_finetuned_model():
    """Lazily load the fine-tuned model when SBERT_MODEL_PATH is set.

    Returns None (with a warning) when the flag is OFF or the path is not a
    valid directory. NEVER falls back to the production model and NEVER
    influences any existing return value.
    """
    global _ft_model, _ft_model_name, _ft_last_error
    path = get_finetuned_ab_path()
    if not path:
        return None
    if _ft_model is not None and _ft_model_name == path:
        return _ft_model
    try:
        if not os.path.isdir(path):
            logger.warning(
                "SBERT_MODEL_PATH is set but not a directory; ignoring A/B "
                "fine-tuned model: %s", path)
            _ft_last_error = f"configured path is not a directory: {path}"
            return None
        from sentence_transformers import SentenceTransformer
        logger.info("Loading A/B fine-tuned SBERT model: %s", path)
        _ft_model = SentenceTransformer(path)
        _ft_model_name = path
        _ft_last_error = None
        logger.info("A/B fine-tuned SBERT model loaded: %s", path)
        return _ft_model
    except ImportError:
        logger.warning("sentence-transformers not installed; A/B fine-tuned "
                       "model unavailable")
        _ft_last_error = "sentence-transformers not installed"
        return None
    except Exception as e:  # noqa: BLE001 - A/B must never break production
        logger.error("Failed to load A/B fine-tuned model %s: %s", path, e)
        _ft_last_error = str(e)
        return None


def get_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
    """
    Get or create the SBERT embedding model (lazy loaded).

    Args:
        model_name: Name of the sentence-transformers model to load.
                    Default: 'all-MiniLM-L6-v2' (fast, good quality)

    Returns:
        The model instance, or None if sentence-transformers is not installed.

    The model is cached after first load.

    Loading order (offline-first, added so a missing/unreachable HF Hub can
    never break candidate matching while the weights exist on disk):
      1. SBERT_BASE_MODEL_PATH -> local directory (no hub calls at all).
      2. model_name with local_files_only=True -> the local HF cache
         (~/.cache/huggingface). Honors HF_HUB_OFFLINE=1.
      3. model_name -> normal hub load (used when 1/2 fail, e.g. cache
         absent on a fresh machine).
      All failures return None (TF-IDF fallback), never raise.
    """
    global _model, _model_name, _base_last_error

    if _model is not None and _model_name == model_name:
        return _model

    local_override = os.environ.get(BASE_MODEL_ENV_VAR, "").strip()
    if local_override and os.path.isdir(local_override):
        model_name = local_override

    try:
        from sentence_transformers import SentenceTransformer

        # Pass 1: offline/local-cache load. For a local directory path this
        # is simply a faster no-hub load; for a hub name it loads from the
        # HF cache when present.
        try:
            logger.info(f"Loading SBERT model: {model_name}")
            try:
                _model = SentenceTransformer(model_name, local_files_only=True)
            except TypeError:
                # Older sentence-transformers versions do not accept
                # local_files_only; fall back to the plain constructor.
                _model = SentenceTransformer(model_name)
        except Exception as offline_error:  # noqa: BLE001
            # Pass 2: allow a normal (possibly online) load. Covers
            # first-boot machines whose HF cache does not contain the model
            # yet, and any version where local_files_only is too strict.
            logger.warning(
                f"Local-cache load of SBERT model {model_name} failed "
                f"({offline_error}); retrying with normal loading"
            )
            _model = SentenceTransformer(model_name)
        _model_name = model_name
        _base_last_error = None
        logger.info(f"SBERT model loaded: {model_name}")
        return _model
    except ImportError:
        logger.warning(
            "sentence-transformers not installed. "
            "Install with: pip install sentence-transformers"
        )
        _base_last_error = "sentence-transformers not installed"
        return None
    except Exception as e:
        logger.error(f"Failed to load SBERT model {model_name}: {e}")
        _base_last_error = str(e)
        return None


def get_load_states() -> dict:
    """Read-only snapshot of the singleton load states for health reporting.

    NEVER triggers a model load: health checks must stay cheap and must not
    change engine behavior or pay the ~4 s first-load cost.

    - `loaded`: whether the singleton is actually in memory (i.e. what
      scoring will reuse right now) — distinct from "the package imports"
      or "the model directory exists";
    - `last_error`: the most recent load failure for that singleton (None
      when no attempt has failed since the last success), so a corrupt model
      and an untouched model are distinguishable.
    """
    return {
        "base": {
            "loaded": _model is not None,
            "model": _model_name,
            "last_error": _base_last_error,
        },
        "finetuned_v2": {
            "loaded": _ft_model is not None,
            "model": _ft_model_name,
            "last_error": _ft_last_error,
        },
    }


def compute_embeddings(texts: list[str], model_name: str = "all-MiniLM-L6-v2") -> Optional[np.ndarray]:
    """
    Compute embeddings for a list of texts.

    Args:
        texts: List of text strings to embed
        model_name: Name of the sentence-transformers model

    Returns:
        numpy array of embeddings, or None if model is unavailable
    """
    model = get_embedding_model(model_name)
    if model is None:
        return None

    try:
        embeddings = model.encode(texts, show_progress_bar=False)
        return embeddings
    except Exception as e:
        logger.error(f"Failed to compute embeddings: {e}")
        return None


def compute_semantic_similarity(
    text1: str,
    text2: str,
    model_name: str = "all-MiniLM-L6-v2",
) -> dict:
    """
    Compute semantic similarity between two texts using SBERT.

    Args:
        text1: First text (e.g., resume)
        text2: Second text (e.g., job description)
        model_name: Name of the sentence-transformers model

    Returns:
        Dict with:
        - similarity: Cosine similarity score (0-100)
        - model_used: The model name used
        - error: Error message if failed, None otherwise
    """
    model = get_embedding_model(model_name)
    if model is None:
        return {
            "similarity": 0.0,
            "model_used": None,
            "error": "sentence-transformers not available. Install with: pip install sentence-transformers",
        }

    try:
        embeddings = model.encode([text1, text2], show_progress_bar=False)
        # Cosine similarity
        from sklearn.metrics.pairwise import cosine_similarity
        sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        response = {
            "similarity": round(float(sim) * 100, 2),
            "model_used": model_name,
            "error": None,
        }
        # ---- Step 4 A/B (additive only) ---------------------------------
        # The production score above is computed by the production model and
        # is never altered. When SBERT_MODEL_PATH is enabled, the fine-tuned
        # model's RAW cosine is attached as a separate field (no ×100, no
        # thresholds). Any failure here degrades to omission, never to an
        # error in the production fields.
        ft_model = get_finetuned_model()
        if ft_model is not None:
            try:
                ft_emb = ft_model.encode([text1, text2],
                                         show_progress_bar=False)
                ft_sim = cosine_similarity([ft_emb[0]], [ft_emb[1]])[0][0]
                ft_raw = float(max(-1.0, min(1.0, ft_sim)))
                response["similarity_score_finetuned_raw"] = ft_raw
                # ---- Step 10 calibrated V2 (additive only) --------------
                # Locked Step 9 mapping: clamp(100 * raw_cosine, 0, 100).
                # Zero fitted parameters: V2's CosineSimilarityLoss already
                # regresses cosine onto the matched_score scale, so x100 is
                # the model's native calibration. Derived from ft_raw above
                # (no extra model load or encode); production fields above
                # are never altered; failure degrades to omission.
                response["match_percentage_v2_calibrated"] = round(
                    max(0.0, min(100.0, ft_raw * 100.0)), 2)
            except Exception as e:  # noqa: BLE001
                logger.warning("A/B fine-tuned scoring failed; field omitted: "
                               "%s", e)
        return response
    except Exception as e:
        logger.error(f"Failed to compute semantic similarity: {e}")
        return {
            "similarity": 0.0,
            "model_used": model_name,
            "error": str(e),
        }


def compute_semantic_match_with_reasons(
    resume_text: str,
    job_text: str,
    model_name: str = "all-MiniLM-L6-v2",
) -> dict:
    """
    Compute semantic similarity and provide match percentage + reasons.

    Args:
        resume_text: Resume or candidate text
        job_text: Job description text
        model_name: Name of the sentence-transformers model

    Returns:
        Dict with:
        - match_percentage: Overall semantic match (0-100)
        - similarity_score: Raw cosine similarity (0-100)
        - reasons: List of match/mismatch reasons
        - model_used: The model name used
    """
    result = compute_semantic_similarity(resume_text, job_text, model_name)
    similarity = result["similarity"]

    # Generate reasons based on similarity
    reasons = []
    if similarity >= 80:
        reasons.append("Strong semantic alignment between resume and job description")
        reasons.append("Language and terminology closely match the job requirements")
    elif similarity >= 60:
        reasons.append("Good semantic overlap with some areas of misalignment")
        reasons.append("Consider highlighting relevant experience more prominently")
    elif similarity >= 40:
        reasons.append("Moderate semantic match; resume may need tailoring")
        reasons.append("Key job requirements may not be adequately addressed")
    else:
        reasons.append("Low semantic similarity; resume needs significant tailoring")
        reasons.append("Consider rewriting resume to better match job description keywords")

    # Specific matches (keywords found in both)
    resume_lower = resume_text.lower()
    job_lower = job_text.lower()
    common_keywords = set(resume_lower.split()) & set(job_lower.split())
    if common_keywords:
        reasons.append(f"Shared vocabulary: {min(len(common_keywords), 10)} common terms identified")

    payload = {
        "match_percentage": round(similarity, 2),
        "similarity_score": similarity,
        "reasons": reasons,
        "model_used": result.get("model_used", model_name),
    }
    # ---- Step 4 A/B (additive only) -------------------------------------
    # Pass through the fine-tuned RAW cosine when the flag produced it, and
    # expose explicit provenance. All production fields above are unchanged;
    # `ab_finetuned_*` metadata is safe for existing consumers (additive keys).
    if "similarity_score_finetuned_raw" in result:
        payload["similarity_score_finetuned_raw"] = \
            result["similarity_score_finetuned_raw"]
    if "match_percentage_v2_calibrated" in result:
        payload["match_percentage_v2_calibrated"] = \
            result["match_percentage_v2_calibrated"]
    payload["ab_finetuned_enabled"] = \
        "similarity_score_finetuned_raw" in result
    payload["ab_finetuned_model_path"] = get_finetuned_ab_path()
    payload["production_model"] = model_name
    return payload