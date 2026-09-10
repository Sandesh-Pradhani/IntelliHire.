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
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

# Global model instance (singleton pattern)
_model = None
_model_name = None


def get_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
    """
    Get or create the SBERT embedding model (lazy loaded).

    Args:
        model_name: Name of the sentence-transformers model to load.
                    Default: 'all-MiniLM-L6-v2' (fast, good quality)

    Returns:
        The model instance, or None if sentence-transformers is not installed.

    The model is cached after first load to avoid re-downloading.
    """
    global _model, _model_name

    if _model is not None and _model_name == model_name:
        return _model

    try:
        from sentence_transformers import SentenceTransformer

        logger.info(f"Loading SBERT model: {model_name}")
        _model = SentenceTransformer(model_name)
        _model_name = model_name
        logger.info(f"SBERT model loaded: {model_name}")
        return _model
    except ImportError:
        logger.warning(
            "sentence-transformers not installed. "
            "Install with: pip install sentence-transformers"
        )
        return None
    except Exception as e:
        logger.error(f"Failed to load SBERT model {model_name}: {e}")
        return None


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
        return {
            "similarity": round(float(sim) * 100, 2),
            "model_used": model_name,
            "error": None,
        }
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

    return {
        "match_percentage": round(similarity, 2),
        "similarity_score": similarity,
        "reasons": reasons,
        "model_used": result.get("model_used", model_name),
    }