"""
Background task management router for IntelliHire AI Engine.

WHY THIS FILE:
Provides endpoints for managing and monitoring background tasks
(parsing, embedding, ranking) with progress tracking.

WHY THIS APPROACH:
- Separate router isolates task management from domain logic
- Progress endpoint allows polling for long-running operations
- Task creation triggers background threads
"""

import time
import threading
import logging
import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional

from app.utils.response import _execution_time, success_response
from services.embedding_cache import (
    get_task_manager,
    run_parse_resume_background,
    run_embed_resume_background,
    run_rank_candidates_background,
    get_cache,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Background Tasks"])


# ──────────────────────────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────────────────────────

class RankCandidatesBackgroundRequest(BaseModel):
    jobDescription: str = Field(default="", description="Job description text")
    candidates: List[dict] = Field(default_factory=list, description="List of candidates with skills")


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.post(
    "/tasks/parse-resume",
    summary="Start background resume parsing task",
)
async def start_parse_resume(file: UploadFile = File(...)):
    """
    Start a background task to parse a resume PDF.

    Returns a task_id that can be used to poll progress via /tasks/{task_id}.
    """
    start = time.perf_counter()

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save uploaded file temporarily
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"bg_{file.filename}")

    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)

        # Create background task
        manager = get_task_manager()
        task_id = manager.create_task("parse")
        manager.update_task(task_id, "running", progress=0.0)

        # Start background thread
        thread = threading.Thread(
            target=run_parse_resume_background,
            args=(task_id, file_path),
            daemon=True,
        )
        thread.start()

        return success_response(
            data={
                "task_id": task_id,
                "status": "running",
                "file_name": file.filename,
            },
            message="Resume parsing started in background",
            execution_time_ms=_execution_time(start),
            model_used="rule-based",
        )
    except Exception as e:
        logger.error(f"Failed to start background parse task: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/tasks/rank-candidates",
    summary="Start background candidate ranking task",
)
async def start_rank_candidates(request: RankCandidatesBackgroundRequest):
    """
    Start a background task to rank candidates against a job description.

    Returns a task_id that can be used to poll progress via /tasks/{task_id}.
    """
    start = time.perf_counter()

    if not request.candidates:
        raise HTTPException(status_code=400, detail="At least one candidate is required")

    # Create background task
    manager = get_task_manager()
    task_id = manager.create_task("rank")
    manager.update_task(task_id, "running", progress=0.0)

    # Start background thread
    candidates_data = [c for c in request.candidates]
    thread = threading.Thread(
        target=run_rank_candidates_background,
        args=(task_id, request.jobDescription, candidates_data),
        daemon=True,
    )
    thread.start()

    return success_response(
        data={
            "task_id": task_id,
            "status": "running",
            "total_candidates": len(request.candidates),
        },
        message="Candidate ranking started in background",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.get(
    "/tasks/{task_id}",
    summary="Get background task status and progress",
)
async def get_task_progress(task_id: str):
    """
    Get the status and progress of a background task.

    Returns:
    - task_id: The task's unique identifier
    - task_type: Type of task (parse, embed, rank)
    - status: Current status (pending, running, completed, failed)
    - progress: Progress from 0.0 to 1.0
    - result: Task result (only when completed)
    - error: Error message (only when failed)
    """
    start = time.perf_counter()

    manager = get_task_manager()
    task = manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    response_data = {
        "task_id": task.task_id,
        "task_type": task.task_type,
        "status": task.status,
        "progress": task.progress,
        "error": task.error,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }

    if task.status == "completed" and task.result is not None:
        response_data["result"] = task.result

    return success_response(
        data=response_data,
        message=f"Task {task_id} status: {task.status}",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.get(
    "/tasks",
    summary="List all background tasks",
)
async def list_tasks():
    """
    List all background tasks sorted by creation time (newest first).
    """
    start = time.perf_counter()

    manager = get_task_manager()
    tasks = manager.get_all_tasks()

    return success_response(
        data={
            "tasks": tasks,
            "total": len(tasks),
        },
        message=f"Found {len(tasks)} tasks",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.get(
    "/cache/stats",
    summary="Get embedding cache statistics",
)
async def cache_stats():
    """
    Get statistics about the embedding cache (hit rate, size, etc.).
    """
    start = time.perf_counter()

    cache = get_cache()
    stats = cache.stats

    return success_response(
        data=stats,
        message="Cache statistics retrieved",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )


@router.post(
    "/cache/invalidate",
    summary="Invalidate the embedding cache",
)
async def invalidate_cache():
    """
    Clear all cached embeddings.
    """
    start = time.perf_counter()

    cache = get_cache()
    cache.invalidate_all()

    return success_response(
        data={"cleared": True},
        message="Cache invalidated successfully",
        execution_time_ms=_execution_time(start),
        model_used="rule-based",
    )