"""
Semantic Job Matching Engine v2.0

WHY THIS FILE:
Replaces keyword-only matching with embedding-based semantic similarity.
Uses sentence-transformers (all-MiniLM-L6-v2) for dense embeddings
and cosine similarity for matching.

WHY THIS APPROACH:
- Semantic understanding > keyword matching
- all-MiniLM-L6-v2 is lightweight (80MB) and fast
- Graceful fallback to TF-IDF when SBERT unavailable
- Results are explainable with matched/missing reasons

ALTERNATIVES CONSIDERED:
- TF-IDF only: misses semantic relationships
- OpenAI embeddings: adds cost and latency
- Custom fine-tuned model: requires training data
"""

import logging
from typing import List, Dict, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)


def compute_semantic_match(
    resume_text: str,
    job_text: str,
    model_type: str = "sbert",
) -> Dict:
    """
    Compute semantic match between resume and job description.
    
    Uses sentence-transformers for dense embeddings and cosine similarity.
    Falls back to TF-IDF if SBERT is not available.
    
    Args:
        resume_text: Resume text to match
        job_text: Job description text
        model_type: 'sbert' or 'tfidf'
        
    Returns:
        Dict with similarity scores, explanations, and matching details
    """
    from app.models.embedding_model import get_embedding_model
    from app.models.similarity_model import get_similarity_model
    
    model = get_embedding_model(model_type)
    similarity = get_similarity_model()
    
    if model is None or not model.load():
        logger.warning(f"{model_type} model unavailable, trying TF-IDF fallback")
        if model_type == "sbert":
            return compute_semantic_match(resume_text, job_text, "tfidf")
        return _compute_tfidf_fallback(resume_text, job_text)
    
    try:
        # Compute embeddings
        embeddings = model.encode([resume_text, job_text])
        if embeddings is None:
            return _compute_tfidf_fallback(resume_text, job_text)
        
        # Compute similarity
        sim_score = similarity.compute_similarity(embeddings[0], embeddings[1])
        sim_percentage = round(float(sim_score) * 100, 2)
        
        # Generate match analysis
        analysis = _analyze_semantic_match(resume_text, job_text, sim_percentage)
        
        return {
            "similarity_score": sim_percentage,
            "match_percentage": sim_percentage,
            "model_used": model.name if model else model_type,
            "method": "semantic",
            "analysis": analysis,
        }
        
    except Exception as e:
        logger.error(f"Semantic matching failed: {e}")
        return _compute_tfidf_fallback(resume_text, job_text)


def compute_batch_semantic_match(
    resume_text: str,
    job_texts: List[str],
    model_type: str = "sbert",
) -> List[Dict]:
    """
    Compute semantic match between one resume and multiple job descriptions.
    
    Args:
        resume_text: Single resume text
        job_texts: List of job descriptions
        model_type: 'sbert' or 'tfidf'
        
    Returns:
        List of match results sorted by similarity (descending)
    """
    from app.models.embedding_model import get_embedding_model
    from app.models.similarity_model import get_similarity_model
    
    model = get_embedding_model(model_type)
    similarity = get_similarity_model()
    
    if model is None or not model.load():
        return [_compute_tfidf_fallback(resume_text, jt) for jt in job_texts]
    
    results = []
    try:
        # Encode resume once
        resume_embedding = model.encode([resume_text])
        if resume_embedding is None:
            return [_compute_tfidf_fallback(resume_text, jt) for jt in job_texts]
        
        resume_embedding = resume_embedding[0]
        
        # Encode all jobs
        all_texts = [resume_text] + job_texts
        all_embeddings = model.encode(all_texts)
        
        if all_embeddings is None:
            return [_compute_tfidf_fallback(resume_text, jt) for jt in job_texts]
        
        # Compute similarities
        for i, job_embedding in enumerate(all_embeddings[1:]):
            sim_score = similarity.compute_similarity(resume_embedding, job_embedding)
            sim_percentage = round(float(sim_score) * 100, 2)
            
            analysis = _analyze_semantic_match(resume_text, job_texts[i], sim_percentage)
            
            results.append({
                "job_index": i,
                "similarity_score": sim_percentage,
                "match_percentage": sim_percentage,
                "model_used": model.name if model else model_type,
                "method": "semantic",
                "analysis": analysis,
            })
        
        # Sort descending
        results.sort(key=lambda r: r["similarity_score"], reverse=True)
        
    except Exception as e:
        logger.error(f"Batch semantic matching failed: {e}")
        results = [_compute_tfidf_fallback(resume_text, jt) for jt in job_texts]
    
    return results


def _analyze_semantic_match(resume_text: str, job_text: str, similarity: float) -> Dict:
    """
    Analyze semantic match and generate explainable insights.
    
    Returns:
        Dict with match level, strengths, weaknesses, and recommendations
    """
    from skill_extractor import extract_skills
    
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_text)
    
    # Find matched and missing skills
    resume_lower = [s.lower() for s in resume_skills]
    job_lower = [s.lower() for s in job_skills]
    
    matched_skills = [s for s in job_skills if s.lower() in resume_lower]
    missing_skills = [s for s in job_skills if s.lower() not in resume_lower]
    
    # Determine match level
    if similarity >= 80:
        match_level = "excellent"
        recommendation = "Strong candidate. Schedule interview."
    elif similarity >= 65:
        match_level = "good"
        recommendation = "Good match. Consider for interview."
    elif similarity >= 45:
        match_level = "moderate"
        recommendation = "Partial match. Review skill gaps."
    else:
        match_level = "weak"
        recommendation = "Low match. Look for stronger candidates."
    
    # Strengths and weaknesses
    strengths = []
    weaknesses = []
    
    if len(matched_skills) >= 5:
        strengths.append(f"Strong alignment: {len(matched_skills)} skills match job requirements")
    elif len(matched_skills) >= 3:
        strengths.append(f"Good skill overlap: {len(matched_skills)} matching skills")
    
    if len(missing_skills) >= 5:
        weaknesses.append(f"Significant gaps: missing {len(missing_skills)} required skills")
    elif len(missing_skills) >= 3:
        weaknesses.append(f"Some gaps: missing {len(missing_skills)} skills")
    elif missing_skills:
        weaknesses.append(f"Minor gaps: missing {len(missing_skills)} skill(s)")
    
    return {
        "match_level": match_level,
        "recommendation": recommendation,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "skill_match_percentage": round(
            (len(matched_skills) / len(job_skills)) * 100, 1
        ) if job_skills else 0,
    }


def _compute_tfidf_fallback(text1: str, text2: str) -> Dict:
    """
    Fallback TF-IDF based matching.
    Used when SBERT model is unavailable.
    """
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        sim_percentage = round(float(sim) * 100, 2)
        
        analysis = _analyze_semantic_match(text1, text2, sim_percentage)
        
        return {
            "similarity_score": sim_percentage,
            "match_percentage": sim_percentage,
            "model_used": "tfidf",
            "method": "tfidf",
            "analysis": analysis,
        }
    except ImportError:
        # Ultimate fallback - skill-based matching
        from skill_extractor import extract_skills
        resume_skills = extract_skills(text1)
        job_skills = extract_skills(text2)
        
        resume_lower = [s.lower() for s in resume_skills]
        job_lower = [s.lower() for s in job_skills]
        
        matched = sum(1 for s in job_skills if s.lower() in resume_lower)
        match_pct = round((matched / len(job_skills)) * 100, 1) if job_skills else 0
        
        return {
            "similarity_score": match_pct,
            "match_percentage": match_pct,
            "model_used": "skill-match",
            "method": "keyword",
            "analysis": {
                "match_level": "good" if match_pct >= 60 else "moderate" if match_pct >= 30 else "weak",
                "recommendation": "Based on keyword matching only",
                "matched_skills": [s for s in job_skills if s.lower() in resume_lower],
                "missing_skills": [s for s in job_skills if s.lower() not in resume_lower],
                "strengths": [],
                "weaknesses": [],
                "skill_match_percentage": match_pct,
            },
        }