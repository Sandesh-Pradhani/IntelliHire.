"""
Embedding Model Abstraction

WHY THIS FILE:
Abstracts embedding computation behind a common interface.
Allows swapping between SBERT, TF-IDF, or future embedding models.

WHY THIS APPROACH:
- Strategy pattern: models are interchangeable
- Lazy loading: models load on first use
- Graceful fallback: returns None if model unavailable
"""

import logging
from typing import List, Optional, Any
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingModel:
    """
    Abstract embedding model interface.
    
    All embedding models should implement this interface.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
    
    def load(self) -> bool:
        """Load the model. Returns True if successful."""
        raise NotImplementedError
    
    def encode(self, texts: List[str]) -> Optional[np.ndarray]:
        """Encode texts into embeddings."""
        raise NotImplementedError
    
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._model is not None
    
    @property
    def name(self) -> str:
        return self.model_name


class SBERTEmbeddingModel(EmbeddingModel):
    """
    Sentence-BERT embedding model.
    Uses sentence-transformers for semantic embeddings.
    """
    
    def load(self) -> bool:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading SBERT model: {self.model_name}")
            self._model = SentenceTransformer(self.model_name)
            logger.info(f"SBERT model loaded: {self.model_name}")
            return True
        except ImportError:
            logger.warning("sentence-transformers not installed")
            return False
        except Exception as e:
            logger.error(f"Failed to load SBERT model: {e}")
            return False
    
    def encode(self, texts: List[str]) -> Optional[np.ndarray]:
        if self._model is None:
            if not self.load():
                return None
        try:
            return self._model.encode(texts, show_progress_bar=False)
        except Exception as e:
            logger.error(f"SBERT encode failed: {e}")
            return None


class TFIDFEmbeddingModel(EmbeddingModel):
    """
    TF-IDF based embedding model.
    Lightweight alternative when SBERT is not available.
    """
    
    def __init__(self, model_name: str = "tfidf"):
        super().__init__(model_name)
        self._vectorizer = None
    
    def load(self) -> bool:
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self._vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
            logger.info("TF-IDF vectorizer initialized")
            return True
        except ImportError:
            logger.warning("scikit-learn not installed")
            return False
        except Exception as e:
            logger.error(f"Failed to load TF-IDF: {e}")
            return False
    
    def encode(self, texts: List[str]) -> Optional[np.ndarray]:
        if self._vectorizer is None:
            if not self.load():
                return None
        try:
            return self._vectorizer.fit_transform(texts).toarray()
        except Exception as e:
            logger.error(f"TF-IDF encode failed: {e}")
            return None


# Global model instances (singleton pattern)
_sbert_model: Optional[SBERTEmbeddingModel] = None
_tfidf_model: Optional[TFIDFEmbeddingModel] = None


def get_embedding_model(model_type: str = "sbert", model_name: str = "all-MiniLM-L6-v2") -> Optional[EmbeddingModel]:
    """
    Get or create an embedding model instance.
    
    Args:
        model_type: 'sbert' or 'tfidf'
        model_name: Model name for SBERT
        
    Returns:
        EmbeddingModel instance, or None if unavailable
    """
    global _sbert_model, _tfidf_model
    
    if model_type == "sbert":
        if _sbert_model is None:
            _sbert_model = SBERTEmbeddingModel(model_name)
        return _sbert_model
    elif model_type == "tfidf":
        if _tfidf_model is None:
            _tfidf_model = TFIDFEmbeddingModel()
        return _tfidf_model
    else:
        logger.error(f"Unknown model type: {model_type}")
        return None