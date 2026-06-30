"""
Embedding cache with auto-invalidation and background task management.

WHY THIS FILE:
Caches embeddings to avoid recomputing them for the same text.
Auto-invalidates when resume data is updated.
Provides background task execution for parsing/embedding/ranking.

WHY THIS APPROACH:
- In-memory cache with TTL for fast access
- Auto-invalidation when content changes
- Background task queue for async processing
- Progress tracking for long-running operations

ALTERNATIVES CONSIDERED:
- Redis cache: adds infrastructure dependency
- Database storage: slower for embeddings
- No cache: recomputes embeddings every time
"""

import time
import hashlib
import logging
import threading
import uuid
from typing import Any, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Cache Entry
# ──────────────────────────────────────────────────────────────────────────────

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


# ──────────────────────────────────────────────────────────────────────────────
# Background Task
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class BackgroundTask:
    """A background task with progress tracking."""
    task_id: str
    task_type: str  # 'parse', 'embed', 'rank'
    status: str = "pending"  # pending, running, completed, failed
    progress: float = 0.0  # 0.0 to 1.0
    result: Any = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)


# ──────────────────────────────────────────────────────────────────────────────
# Embedding Cache
# ──────────────────────────────────────────────────────────────────────────────

class EmbeddingCache:
    """
    Thread-safe in-memory embedding cache with TTL.

    Uses content hash as key for automatic invalidation.
    """

    def __init__(self, default_ttl: float = 3600.0):
        self._cache: dict[str, CacheEntry] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl
        self._hits = 0
        self._misses = 0

    def _make_key(self, text: str, model_name: str) -> str:
        """Create a cache key from text content and model name."""
        content_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        return f"{model_name}:{content_hash}"

    def get(self, text: str, model_name: str = "all-MiniLM-L6-v2") -> Optional[Any]:
        """
        Get cached embedding for text.

        Returns None if not cached or expired.
        """
        key = self._make_key(text, model_name)
        with self._lock:
            entry = self._cache.get(key)
            if entry is not None and not entry.is_expired:
                self._hits += 1
                return entry.value
            if entry is not None:
                # Remove expired entry
                del self._cache[key]
            self._misses += 1
            return None

    def set(self, text: str, embedding: Any, model_name: str = "all-MiniLM-L6-v2", ttl: Optional[float] = None):
        """
        Cache an embedding for text.

        Args:
            text: The original text
            embedding: The computed embedding
            model_name: Name of the model used
            ttl: Time-to-live in seconds (uses default if None)
        """
        key = self._make_key(text, model_name)
        entry = CacheEntry(
            key=key,
            value=embedding,
            ttl_seconds=ttl if ttl is not None else self._default_ttl,
        )
        with self._lock:
            self._cache[key] = entry

    def invalidate(self, text: str, model_name: str = "all-MiniLM-L6-v2"):
        """Invalidate cache entry for a specific text."""
        key = self._make_key(text, model_name)
        with self._lock:
            self._cache.pop(key, None)

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
                "hit_rate": round(self._hits / (self._hits + self._misses) * 100, 2) if (self._hits + self._misses) > 0 else 0,
            }

    @property
    def size(self) -> int:
        with self._lock:
            return len(self._cache)


# Global cache instance
_embedding_cache = EmbeddingCache()


def get_cache() -> EmbeddingCache:
    """Get the global embedding cache instance."""
    return _embedding_cache


# ──────────────────────────────────────────────────────────────────────────────
# Background Task Manager
# ──────────────────────────────────────────────────────────────────────────────

class BackgroundTaskManager:
    """
    Manages background tasks with progress tracking.

    Tasks are executed in separate threads and their progress
    can be queried via the progress endpoint.
    """

    def __init__(self):
        self._tasks: dict[str, BackgroundTask] = {}
        self._lock = threading.Lock()

    def create_task(self, task_type: str) -> str:
        """Create a new background task and return its ID."""
        task_id = str(uuid.uuid4())
        task = BackgroundTask(task_id=task_id, task_type=task_type)
        with self._lock:
            self._tasks[task_id] = task
        return task_id

    def update_task(self, task_id: str, status: str, progress: float = None, result: Any = None, error: Optional[str] = None):
        """Update task status and progress."""
        with self._lock:
            task = self._tasks.get(task_id)
            if task:
                task.status = status
                task.updated_at = time.time()
                if progress is not None:
                    task.progress = progress
                if result is not None:
                    task.result = result
                if error is not None:
                    task.error = error

    def get_task(self, task_id: str) -> Optional[BackgroundTask]:
        """Get task by ID."""
        with self._lock:
            return self._tasks.get(task_id)

    def get_all_tasks(self) -> list[dict]:
        """Get all tasks (sorted by creation time, newest first)."""
        with self._lock:
            tasks = [
                {
                    "task_id": t.task_id,
                    "task_type": t.task_type,
                    "status": t.status,
                    "progress": t.progress,
                    "error": t.error,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at,
                }
                for t in sorted(self._tasks.values(), key=lambda x: x.created_at, reverse=True)
            ]
            return tasks

    def cleanup_old_tasks(self, max_age_hours: float = 24):
        """Remove tasks older than max_age_hours."""
        cutoff = time.time() - (max_age_hours * 3600)
        with self._lock:
            self._tasks = {
                tid: task for tid, task in self._tasks.items()
                if task.created_at > cutoff
            }


# Global task manager instance
_task_manager = BackgroundTaskManager()


def get_task_manager() -> BackgroundTaskManager:
    """Get the global background task manager instance."""
    return _task_manager


# ──────────────────────────────────────────────────────────────────────────────
# Background Task Functions
# ──────────────────────────────────────────────────────────────────────────────

def run_parse_resume_background(task_id: str, pdf_path: str):
    """
    Run resume parsing in background.

    Args:
        task_id: Background task ID for progress tracking
        pdf_path: Path to the PDF file
    """
    manager = get_task_manager()
    try:
        manager.update_task(task_id, "running", progress=0.1)

        from services.resume_parser_service import parse_resume_full

        manager.update_task(task_id, "running", progress=0.3)
        result = parse_resume_full(pdf_path)

        manager.update_task(task_id, "running", progress=0.9)
        manager.update_task(task_id, "completed", progress=1.0, result=result)

        logger.info(f"Background parse task {task_id} completed")
    except Exception as e:
        logger.error(f"Background parse task {task_id} failed: {e}")
        manager.update_task(task_id, "failed", error=str(e))


def run_embed_resume_background(task_id: str, text: str, model_name: str = "all-MiniLM-L6-v2"):
    """
    Run embedding computation in background.

    Args:
        task_id: Background task ID for progress tracking
        text: Text to embed
        model_name: Name of the sentence-transformers model
    """
    manager = get_task_manager()
    try:
        manager.update_task(task_id, "running", progress=0.1)

        from services.sbert_embeddings import compute_embeddings

        manager.update_task(task_id, "running", progress=0.5)
        embeddings = compute_embeddings([text], model_name)

        manager.update_task(task_id, "running", progress=0.9)
        manager.update_task(task_id, "completed", progress=1.0, result={
            "shape": list(embeddings.shape) if embeddings is not None else None,
            "model_used": model_name,
        })

        logger.info(f"Background embed task {task_id} completed")
    except Exception as e:
        logger.error(f"Background embed task {task_id} failed: {e}")
        manager.update_task(task_id, "failed", error=str(e))


def run_rank_candidates_background(
    task_id: str,
    job_description: str,
    candidates: list[dict],
):
    """
    Run candidate ranking in background.

    Args:
        task_id: Background task ID for progress tracking
        job_description: Job description text
        candidates: List of candidate dicts with skills
    """
    manager = get_task_manager()
    try:
        manager.update_task(task_id, "running", progress=0.1)

        from skill_extractor import extract_skills
        from services.skill_gap_service import analyze_skill_gap
        from services.ranking_service import calculate_unified_ranking

        required_skills = extract_skills(job_description)
        manager.update_task(task_id, "running", progress=0.3)

        rankings = []
        total = len(candidates)
        for i, candidate in enumerate(candidates):
            candidate_skills = [s.lower() for s in candidate.get("skills", [])]
            enhanced_gaps = analyze_skill_gap(candidate_skills, required_skills)

            ats_score = min(len(candidate_skills) * 10, 100)
            ranking = calculate_unified_ranking(
                ats_score=ats_score,
                semantic_similarity=enhanced_gaps["match_percentage"],
            )

            rankings.append({
                "candidateId": candidate.get("_id", ""),
                "candidateName": candidate.get("name", "Unknown"),
                "score": round(ranking["overall"]),
                "matchedSkills": enhanced_gaps["matched"],
                "missingSkills": enhanced_gaps["missing"],
            })

            # Update progress
            progress = 0.3 + (0.6 * (i + 1) / total)
            manager.update_task(task_id, "running", progress=progress)

        # Sort by score descending
        rankings.sort(key=lambda r: r["score"], reverse=True)

        manager.update_task(task_id, "completed", progress=1.0, result={
            "rankings": rankings,
            "total_candidates": len(rankings),
        })

        logger.info(f"Background ranking task {task_id} completed")
    except Exception as e:
        logger.error(f"Background ranking task {task_id} failed: {e}")
        manager.update_task(task_id, "failed", error=str(e))