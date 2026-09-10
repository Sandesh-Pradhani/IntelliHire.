"""
Similarity Model Interface

WHY THIS FILE:
Abstracts similarity computation behind a common interface.
Supports cosine similarity, dot product, and other metrics.
"""

import logging
from typing import List, Optional, Dict, Any
import numpy as np

logger = logging.getLogger(__name__)


class SimilarityModel:
    """Abstract similarity computation interface."""
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Compute similarity between two embeddings."""
        raise NotImplementedError
    
    def compute_similarities(self, query: np.ndarray, candidates: np.ndarray) -> List[float]:
        """Compute similarity between query and multiple candidates."""
        raise NotImplementedError


class CosineSimilarityModel(SimilarityModel):
    """Cosine similarity computation."""
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            sim = cosine_similarity([embedding1], [embedding2])[0][0]
            return float(sim)
        except ImportError:
            # Manual cosine similarity fallback
            dot = np.dot(embedding1, embedding2)
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            if norm1 == 0 or norm2 == 0:
                return 0.0
            return float(dot / (norm1 * norm2))
    
    def compute_similarities(self, query: np.ndarray, candidates: np.ndarray) -> List[float]:
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            sims = cosine_similarity([query], candidates)[0]
            return [float(s) for s in sims]
        except ImportError:
            sims = []
            for candidate in candidates:
                sims.append(self.compute_similarity(query, candidate))
            return sims


# Global instance
_default_similarity = CosineSimilarityModel()


def get_similarity_model() -> SimilarityModel:
    """Get the default similarity model."""
    return _default_similarity