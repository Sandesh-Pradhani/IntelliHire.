"""
Results Caching Utilities for IntelliHire AI Engine.

WHY THIS FILE:
Provides caching for AI analysis results to avoid redundant computations.
Caches skill extraction, ATS scores, and semantic matching results.

WHY THIS APPROACH:
- Improves response time for repeated analyses
- Reduces CPU usage for identical requests
- TTL-based cache invalidation
- Thread-safe for concurrent access
"""

import time
import hashlib
import logging
import threading
from typing import Any, Optional, Dict
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """A single cache entry with TTL tracking."""
    key: str
    value: Any
    created_at: float = field(default_factory=time.time)
    ttl_seconds: float = 3600.0  # 1 hour default TTL

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.created_at) > self.ttl_seconds


class ResultsCache:
    """
    Thread-safe in-memory cache for AI analysis results.
    
    Uses content hash as key for automatic invalidation.
    """

    def __init__(self, default_ttl: float = 3600.0):
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl
        self._hits = 0
        self._misses = 0

    def _make_key(self, data: str) -> str:
        """Create a cache key from data content."""
        return hashlib.md5(data.encode('utf-8')).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """
        Get cached value by key.
        
        Returns None if not cached or expired.
        """
        cache_key = self._make_key(key)
        with self._lock:
            entry = self._cache.get(cache_key)
            if entry is not None and not entry.is_expired:
                self._hits += 1
                return entry.value
            if entry is not None:
                # Remove expired entry
                del self._cache[cache_key]
            self._misses += 1
            return None

    def set(self, key: str, value: Any, ttl: Optional[float] = None):
        """
        Cache a value with optional TTL.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if None)
        """
        cache_key = self._make_key(key)
        entry = CacheEntry(
            key=cache_key,
            value=value,
            ttl_seconds=ttl if ttl is not None else self._default_ttl,
        )
        with self._lock:
            self._cache[cache_key] = entry

    def invalidate(self, key: str):
        """Invalidate cache entry for a specific key."""
        cache_key = self._make_key(key)
        with self._lock:
            self._cache.pop(cache_key, None)

    def invalidate_all(self):
        """Clear entire cache."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0

    @property
    def stats(self) -> dict:
        """Get cache statistics."""
        with self._lock:
            return {
                "size": len(self._cache),
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": round(
                    self._hits / (self._hits + self._misses) * 100, 2
                ) if (self._hits + self._misses) > 0 else 0,
            }


# Global cache instances
_skills_cache = ResultsCache(default_ttl=3600.0)  # 1 hour
_ats_cache = ResultsCache(default_ttl=1800.0)  # 30 minutes
_semantic_cache = ResultsCache(default_ttl=3600.0)  # 1 hour
_results_cache = ResultsCache(default_ttl=1800.0)  # 30 minutes


def get_skills_cache() -> ResultsCache:
    """Get the skills extraction cache."""
    return _skills_cache


def get_ats_cache() -> ResultsCache:
    """Get the ATS scoring cache."""
    return _ats_cache


def get_semantic_cache() -> ResultsCache:
    """Get the semantic matching cache."""
    return _semantic_cache


def get_results_cache() -> ResultsCache:
    """Get the general results cache."""
    return _results_cache


def cached_skills_extraction(text: str, extraction_func):
    """
    Cache wrapper for skills extraction.
    
    Args:
        text: Text to extract skills from
        extraction_func: Function to extract skills
        
    Returns:
        Cached or freshly computed skills list
    """
    cache = get_skills_cache()
    cached = cache.get(text)
    if cached is not None:
        return cached
    
    result = extraction_func(text)
    cache.set(text, result)
    return result


def cached_ats_scoring(resume_text: str, skills: list, scoring_func):
    """
    Cache wrapper for ATS scoring.
    
    Args:
        resume_text: Resume text
        skills: Extracted skills
        scoring_func: Function to calculate ATS score
        
    Returns:
        Cached or freshly computed ATS result
    """
    cache = get_ats_cache()
    cache_key = f"{resume_text[:500]}:{','.join(sorted(skills[:20]))}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    result = scoring_func(resume_text, skills)
    cache.set(cache_key, result)
    return result


def cached_semantic_match(text1: str, text2: str, match_func):
    """
    Cache wrapper for semantic matching.
    
    Args:
        text1: First text
        text2: Second text
        match_func: Function to compute semantic match
        
    Returns:
        Cached or freshly computed match result
    """
    cache = get_semantic_cache()
    cache_key = f"{text1[:300]}:{text2[:300]}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    
    result = match_func(text1, text2)
    cache.set(cache_key, result)
    return result


def get_all_cache_stats() -> dict:
    """Get statistics from all caches."""
    return {
        "skills_cache": get_skills_cache().stats,
        "ats_cache": get_ats_cache().stats,
        "semantic_cache": get_semantic_cache().stats,
        "results_cache": get_results_cache().stats,
    }


def invalidate_all_caches():
    """Invalidate all caches."""
    get_skills_cache().invalidate_all()
    get_ats_cache().invalidate_all()
    get_semantic_cache().invalidate_all()
    get_results_cache().invalidate_all()
    logger.info("All caches invalidated")
