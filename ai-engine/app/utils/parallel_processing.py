"""
Parallel Processing Utilities for IntelliHire AI Engine.

WHY THIS FILE:
Provides utilities for parallel processing to improve performance.
Uses threading for CPU-bound tasks and asyncio for I/O-bound tasks.

WHY THIS APPROACH:
- Improves response time for batch operations
- Uses thread pools for CPU-bound skill extraction
- Provides configurable concurrency limits
- Graceful fallback to sequential processing
"""

import logging
import asyncio
from typing import List, Callable, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial

logger = logging.getLogger(__name__)

# Thread pool for CPU-bound tasks
_thread_pool = ThreadPoolExecutor(max_workers=4)


def parallel_map(
    func: Callable,
    items: List[Any],
    max_workers: Optional[int] = None,
) -> List[Any]:
    """
    Apply a function to items in parallel using threads.
    
    Args:
        func: Function to apply to each item
        items: List of items to process
        max_workers: Maximum number of worker threads
        
    Returns:
        List of results in the same order as input
    """
    if not items:
        return []
    
    if len(items) == 1:
        return [func(items[0])]
    
    try:
        results = [None] * len(items)
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_index = {
                executor.submit(func, item): i
                for i, item in enumerate(items)
            }
            
            for future in as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    results[index] = future.result()
                except Exception as e:
                    logger.error(f"Parallel processing error at index {index}: {e}")
                    results[index] = None
        
        return results
    except Exception as e:
        logger.error(f"Parallel map failed, falling back to sequential: {e}")
        return [func(item) for item in items]


def parallel_extract_skills(texts: List[str]) -> List[List[str]]:
    """
    Extract skills from multiple texts in parallel.
    
    Args:
        texts: List of resume/job texts
        
    Returns:
        List of skill lists, one per text
    """
    from skill_extractor import extract_skills
    
    return parallel_map(extract_skills, texts)


def parallel_analyze_candidates(
    candidates: List[dict],
    job_description: str,
) -> List[dict]:
    """
    Analyze multiple candidates in parallel.
    
    Args:
        candidates: List of candidate dicts
        job_description: Job description text
        
    Returns:
        List of analysis results
    """
    from skill_extractor import extract_skills
    from services.skill_gap_service import analyze_skill_gap
    from services.ranking_service import calculate_unified_ranking
    
    required_skills = extract_skills(job_description)
    
    def analyze_candidate(candidate):
        candidate_skills = [s.lower() for s in candidate.get("skills", [])]
        gap_analysis = analyze_skill_gap(candidate_skills, required_skills)
        ats_score = min(len(candidate_skills) * 10, 100)
        ranking = calculate_unified_ranking(
            ats_score=ats_score,
            semantic_similarity=gap_analysis["match_percentage"],
        )
        return {
            "candidateId": candidate.get("id", candidate.get("_id", "")),
            "candidateName": candidate.get("name", "Unknown"),
            "score": round(ranking["overall"]),
            "matchedSkills": gap_analysis["matched"],
            "missingSkills": gap_analysis["missing"],
            "matchPercentage": gap_analysis["match_percentage"],
        }
    
    results = parallel_map(analyze_candidate, candidates)
    
    # Sort by score descending
    results.sort(key=lambda r: r["score"] if r else 0, reverse=True)
    
    return results


async def async_parallel_map(
    func: Callable,
    items: List[Any],
    max_concurrent: int = 5,
) -> List[Any]:
    """
    Apply an async function to items in parallel with concurrency limit.
    
    Args:
        func: Async function to apply to each item
        items: List of items to process
        max_concurrent: Maximum concurrent operations
        
    Returns:
        List of results in the same order as input
    """
    if not items:
        return []
    
    if len(items) == 1:
        return [await func(items[0])]
    
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def bounded_func(item):
        async with semaphore:
            return await func(item)
    
    tasks = [bounded_func(item) for item in items]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle exceptions
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Async processing error at index {i}: {result}")
            processed_results.append(None)
        else:
            processed_results.append(result)
    
    return processed_results


def get_thread_pool_stats() -> dict:
    """Get thread pool statistics."""
    return {
        "max_workers": _thread_pool._max_workers,
        "queue_size": _thread_pool._work_queue.qsize(),
    }
