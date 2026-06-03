from flask import Flask, request, jsonify

from skill_extractor import extract_skills
from pdf_reader import extract_text_from_pdf
from ai.tfidf_engine import build_vectors
from ai.similarity_engine import calculate_similarity
from ai.skill_gap import skill_gap_analysis
from ai.ranking_engine import calculate_final_score

app = Flask(__name__)


@app.route('/')
def home():

    return "IntelliHire AI Engine Running"


@app.route('/analyze-resume', methods=['POST'])
def analyze_resume():

    data = request.json

    file_path = data.get('filePath')

    """
    PDF → TEXT
    """

    resume_text = extract_text_from_pdf(file_path)

    """
    TEXT → SKILLS
    """

    skills = extract_skills(resume_text)

    """
    SIMPLE ATS SCORING
    """

    ats_score = len(skills) * 10

    return jsonify({

        "skills": skills,
        "ats_score": ats_score

    })

@app.route('/job-match', methods=['POST'])
def job_match():

    data = request.json

    resume_text = data['resume']

    job_text = data['job']

    candidate_skills = data['candidateSkills']

    required_skills = data['requiredSkills']

    vectors = build_vectors(

        job_text,

        resume_text

    )

    similarity_score = calculate_similarity(

        vectors
    )

    gaps = skill_gap_analysis(

        candidate_skills,

        required_skills
    )

    final_score = calculate_final_score(

        80,
        similarity_score
    )

    return jsonify({

        "similarity": similarity_score,

        "finalScore": final_score,

        "matchedSkills": gaps["matched"],

        "missingSkills": gaps["missing"]

    })

if __name__ == '__main__':

    app.run(port=8000)