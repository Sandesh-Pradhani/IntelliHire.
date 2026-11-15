"""
Skill Extractor Model Interface

WHY THIS FILE:
Abstracts skill extraction behind a common interface.
Allows swapping between rule-based, ML-based, or LLM-based extraction.
"""

import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class SkillExtractorModel:
    """Abstract skill extractor interface."""
    
    def extract(self, text: str) -> List[str]:
        """Extract skills from text."""
        raise NotImplementedError
    
    def extract_with_categories(self, text: str) -> Dict[str, List[str]]:
        """Extract skills organized by category."""
        raise NotImplementedError


class RuleBasedSkillExtractor(SkillExtractorModel):
    """
    Rule-based skill extractor using comprehensive skill database.
    Fast, deterministic, works offline.
    """
    
    def extract(self, text: str) -> List[str]:
        from skill_extractor import extract_skills
        return extract_skills(text)
    
    def extract_with_categories(self, text: str) -> Dict[str, List[str]]:
        from skill_extractor import extract_skills_with_categories
        return extract_skills_with_categories(text)


# Global instance
_default_extractor = RuleBasedSkillExtractor()


def get_skill_extractor() -> SkillExtractorModel:
    """Get the default skill extractor."""
    return _default_extractor