"""
ATS Model Interface

WHY THIS FILE:
Abstracts ATS scoring behind a common interface.
Allows swapping between rule-based, ML-based, or hybrid scoring.
"""

import logging
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)


class ATSModel:
    """Abstract ATS scoring interface."""
    
    def calculate_score(self, resume_text: str, skills: List[str]) -> Dict[str, Any]:
        """Calculate ATS score with breakdown and suggestions."""
        raise NotImplementedError


class WeightedATSModel(ATSModel):
    """
    Weighted ATS scoring model.
    Uses configurable weights for different categories.
    """
    
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or {
            "experience": 0.20,
            "skills": 0.35,
            "projects": 0.15,
            "education": 0.10,
            "keywords": 0.10,
            "formatting": 0.10,
        }
    
    def calculate_score(self, resume_text: str, skills: List[str]) -> Dict[str, Any]:
        from services.ats_engine import calculate_weighted_ats
        return calculate_weighted_ats(resume_text, skills, self.weights)


# Global instance with default weights
_default_ats = WeightedATSModel()


def get_ats_model() -> ATSModel:
    """Get the default ATS model."""
    return _default_ats