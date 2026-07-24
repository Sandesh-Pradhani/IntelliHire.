"""
IntelliHire Model Abstraction Layer

WHY THIS FILE:
Provides abstract base classes and interfaces for all AI models.
Ensures models can be swapped without changing business logic.
Follows the Strategy pattern for model selection.

WHY THIS APPROACH:
- Abstract base classes define interfaces
- Concrete implementations can be swapped via config
- Easy to add new models without modifying existing code
- Testing is simplified with mock models

ALTERNATIVES CONSIDERED:
- Direct imports: hard to swap models
- Global singletons: tight coupling
- Factory pattern: adds complexity for simple case
"""

from .embedding_model import EmbeddingModel
from .skill_extractor_model import SkillExtractorModel
from .similarity_model import SimilarityModel
from .ats_model import ATSModel

__all__ = [
    "EmbeddingModel",
    "SkillExtractorModel",
    "SimilarityModel",
    "ATSModel",
]