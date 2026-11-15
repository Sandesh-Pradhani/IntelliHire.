"""
Career Insights Engine v2.0

WHY THIS FILE:
Generates comprehensive career insights including best career paths,
suitable roles, salary ranges, learning suggestions, certification
suggestions, and project suggestions.

WHY THIS APPROACH:
- Rule-based with comprehensive career database
- Semantic matching for role recommendations
- Actionable learning roadmaps
- Mock salary data for guidance
"""

import logging
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)

# ── Career Path Database ──
CAREER_PATHS = {
    "frontend": {
        "title": "Frontend Development",
        "roles": ["Junior Frontend Developer", "Frontend Developer", "Senior Frontend Developer", "Frontend Architect", "UI Engineering Lead"],
        "skills_needed": ["react", "typescript", "css", "html", "javascript", "responsive design", "web accessibility"],
        "salary_range": {"entry": "3-5 LPA", "mid": "8-15 LPA", "senior": "18-30 LPA", "lead": "30-50 LPA"},
        "certifications": ["Meta Frontend Developer", "Google UX Design", "AWS Certified Developer"],
        "projects": ["E-commerce platform with React", "Real-time dashboard with charts", "Progressive web app"],
    },
    "backend": {
        "title": "Backend Development",
        "roles": ["Junior Backend Developer", "Backend Developer", "Senior Backend Developer", "Backend Architect", "Engineering Manager"],
        "skills_needed": ["python", "node.js", "java", "sql", "mongodb", "docker", "aws", "system design"],
        "salary_range": {"entry": "4-7 LPA", "mid": "10-18 LPA", "senior": "20-35 LPA", "lead": "35-55 LPA"},
        "certifications": ["AWS Certified Developer", "MongoDB Developer", "Docker Certified"],
        "projects": ["RESTful API service", "Microservices architecture", "Real-time chat backend"],
    },
    "fullstack": {
        "title": "Full Stack Development",
        "roles": ["Junior Full Stack Developer", "Full Stack Developer", "Senior Full Stack Developer", "Full Stack Architect", "Tech Lead"],
        "skills_needed": ["react", "node.js", "python", "sql", "mongodb", "docker", "aws", "typescript"],
        "salary_range": {"entry": "4-7 LPA", "mid": "10-20 LPA", "senior": "22-38 LPA", "lead": "35-55 LPA"},
        "certifications": ["AWS Certified Developer", "Full Stack Web Development", "Google Cloud Engineer"],
        "projects": ["Full stack e-commerce app", "Social media platform", "Project management tool"],
    },
    "data_science": {
        "title": "Data Science & ML",
        "roles": ["Junior Data Scientist", "Data Scientist", "Senior Data Scientist", "ML Engineer", "AI Research Scientist"],
        "skills_needed": ["python", "machine learning", "sql", "tensorflow", "pytorch", "statistics", "nlp"],
        "salary_range": {"entry": "5-8 LPA", "mid": "12-22 LPA", "senior": "25-45 LPA", "lead": "40-70 LPA"},
        "certifications": ["TensorFlow Developer", "AWS ML Specialty", "Google Data Engineer"],
        "projects": ["Predictive analytics model", "NLP chatbot", "Computer vision system"],
    },
    "devops": {
        "title": "DevOps & Cloud",
        "roles": ["Junior DevOps Engineer", "DevOps Engineer", "Senior DevOps Engineer", "Cloud Architect", "SRE Lead"],
        "skills_needed": ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux", "python", "monitoring"],
        "salary_range": {"entry": "5-8 LPA", "mid": "12-20 LPA", "senior": "22-40 LPA", "lead": "38-60 LPA"},
        "certifications": ["AWS Solutions Architect", "CKA", "Terraform Associate", "Google Cloud Engineer"],
        "projects": ["CI/CD pipeline automation", "Kubernetes cluster setup", "Infrastructure as Code project"],
    },
    "mobile": {
        "title": "Mobile Development",
        "roles": ["Junior Mobile Developer", "Mobile Developer", "Senior Mobile Developer", "Mobile Architect", "Mobile Tech Lead"],
        "skills_needed": ["react native", "flutter", "swift", "kotlin", "firebase", "mobile ui/ux"],
        "salary_range": {"entry": "4-6 LPA", "mid": "10-18 LPA", "senior": "20-35 LPA", "lead": "32-50 LPA"},
        "certifications": ["Google Associate Android Developer", "Apple iOS Developer", "Flutter Developer"],
        "projects": ["Cross-platform mobile app", "Food delivery app", "Fitness tracking app"],
    },
    "security": {
        "title": "Cybersecurity",
        "roles": ["Security Analyst", "Security Engineer", "Penetration Tester", "Security Architect", "CISO"],
        "skills_needed": ["network security", "penetration testing", "python", "linux", "cloud security", "compliance"],
        "salary_range": {"entry": "5-8 LPA", "mid": "12-22 LPA", "senior": "25-45 LPA", "lead": "40-65 LPA"},
        "certifications": ["CISSP", "CEH", "CompTIA Security+", "OSCP"],
        "projects": ["Security audit tool", "Vulnerability scanner", "Security monitoring dashboard"],
    },
}


def generate_career_insights(
    skills: List[str],
    experience_years: Optional[float] = None,
    interests: Optional[List[str]] = None,
) -> Dict:
    """
    Generate comprehensive career insights.
    
    Args:
        skills: List of candidate's skills
        experience_years: Years of experience
        interests: Areas of interest
        
    Returns:
        Dict with career path, roles, salary, learning suggestions
    """
    if not skills:
        return {
            "best_career_path": "Unknown",
            "suitable_roles": [],
            "salary_range": {},
            "learning_suggestions": [],
            "certification_suggestions": [],
            "project_suggestions": [],
            "career_progression": [],
            "message": "No skills provided for analysis.",
        }
    
    skills_lower = [s.lower() for s in skills]
    
    # Find best matching career path
    path_scores = _score_career_paths(skills_lower)
    best_path = path_scores[0]["path"] if path_scores else "fullstack"
    path_data = CAREER_PATHS.get(best_path, CAREER_PATHS["fullstack"])
    
    # Determine level based on experience
    level = _determine_level(experience_years)
    
    # Generate suitable roles
    suitable_roles = _generate_suitable_roles(skills_lower, experience_years)
    
    # Generate learning suggestions
    learning_suggestions = _generate_learning_suggestions(skills_lower, best_path)
    
    # Generate certification suggestions
    certification_suggestions = path_data.get("certifications", [])
    
    # Generate project suggestions
    project_suggestions = path_data.get("projects", [])
    
    # Generate career progression
    career_progression = _generate_career_progression(best_path, experience_years)
    
    # Salary range
    salary_range = path_data.get("salary_range", {})
    
    return {
        "best_career_path": path_data["title"],
        "path_confidence": path_scores[0]["score"] if path_scores else 0,
        "suitable_roles": suitable_roles,
        "salary_range": salary_range,
        "current_level": level,
        "learning_suggestions": learning_suggestions,
        "certification_suggestions": certification_suggestions,
        "project_suggestions": project_suggestions,
        "career_progression": career_progression,
        "skills_to_develop": _get_skills_to_develop(skills_lower, best_path),
        "estimated_preparation_time": _estimate_preparation_time(experience_years),
    }


def _score_career_paths(skills: List[str]) -> List[Dict]:
    """Score each career path based on skill match."""
    scores = []
    
    for path_key, path_data in CAREER_PATHS.items():
        required = [s.lower() for s in path_data["skills_needed"]]
        matched = sum(1 for s in required if s in skills)
        score = round((matched / len(required)) * 100, 1) if required else 0
        scores.append({"path": path_key, "score": score, "matched": matched, "total": len(required)})
    
    scores.sort(key=lambda x: x["score"], reverse=True)
    return scores


def _determine_level(experience_years: Optional[float]) -> str:
    """Determine career level based on experience."""
    if experience_years is None:
        return "entry"
    elif experience_years < 2:
        return "entry"
    elif experience_years < 5:
        return "mid"
    elif experience_years < 10:
        return "senior"
    else:
        return "lead"


def _generate_suitable_roles(skills: List[str], experience_years: Optional[float]) -> List[Dict]:
    """Generate suitable roles based on skills."""
    roles = []
    
    for path_key, path_data in CAREER_PATHS.items():
        required = [s.lower() for s in path_data["skills_needed"]]
        matched = sum(1 for s in required if s in skills)
        match_pct = round((matched / len(required)) * 100, 1) if required else 0
        
        if match_pct >= 30:  # Only include if at least 30% match
            level_prefix = "Senior" if (experience_years or 0) >= 5 else "Mid-level" if (experience_years or 0) >= 2 else "Junior"
            roles.append({
                "role": f"{level_prefix} {path_data['title'].split(' ')[0]} Developer",
                "path": path_data["title"],
                "match_percentage": match_pct,
                "matching_skills": [s for s in path_data["skills_needed"] if s.lower() in skills],
                "missing_skills": [s for s in path_data["skills_needed"] if s.lower() not in skills],
            })
    
    roles.sort(key=lambda r: r["match_percentage"], reverse=True)
    return roles[:5]


def _generate_learning_suggestions(skills: List[str], best_path: str) -> List[Dict]:
    """Generate learning suggestions based on skill gaps."""
    path_data = CAREER_PATHS.get(best_path, CAREER_PATHS["fullstack"])
    required = [s.lower() for s in path_data["skills_needed"]]
    
    suggestions = []
    for skill in required:
        if skill not in skills:
            suggestions.append({
                "skill": skill,
                "priority": "high" if skill in ["python", "javascript", "react", "docker", "sql"] else "medium",
                "estimated_time": "2-4 weeks" if skill in ["html", "css", "git"] else "4-8 weeks" if skill in ["javascript", "python", "sql"] else "8-12 weeks",
                "resources": [
                    f"Online course for {skill}",
                    f"Build projects using {skill}",
                    f"Practice {skill} on coding platforms",
                ],
            })
    
    return suggestions


def _get_skills_to_develop(skills: List[str], best_path: str) -> List[str]:
    """Get skills the candidate should develop next."""
    path_data = CAREER_PATHS.get(best_path, CAREER_PATHS["fullstack"])
    required = [s.lower() for s in path_data["skills_needed"]]
    return [s for s in path_data["skills_needed"] if s.lower() not in skills][:5]


def _generate_career_progression(best_path: str, experience_years: Optional[float]) -> List[str]:
    """Generate career progression steps."""
    path_data = CAREER_PATHS.get(best_path, CAREER_PATHS["fullstack"])
    roles = path_data["roles"]
    
    progression = []
    for i, role in enumerate(roles):
        if i == 0:
            progression.append(f"Start as {role}")
        elif i == len(roles) - 1:
            progression.append(f"Long-term goal: {role}")
        else:
            progression.append(f"Progress to {role}")
    
    # Add timeline
    if experience_years is None or experience_years < 2:
        progression.append("Apply for positions after building 2-3 strong projects")
        progression.append("Expected timeline to first role: 3-6 months")
    elif experience_years < 5:
        progression.append("Focus on deepening expertise and taking on complex projects")
        progression.append("Expected timeline to senior role: 2-3 years")
    else:
        progression.append("Consider leadership or architecture roles")
        progression.append("Share knowledge through mentoring and content creation")
    
    return progression


def _estimate_preparation_time(experience_years: Optional[float]) -> str:
    """Estimate preparation time for career transition."""
    if experience_years is None or experience_years < 1:
        return "3-6 months of focused learning and project building"
    elif experience_years < 3:
        return "1-3 months to fill skill gaps and update portfolio"
    elif experience_years < 5:
        return "2-4 weeks to tailor resume and prepare for interviews"
    else:
        return "Ready to apply - focus on interview preparation"