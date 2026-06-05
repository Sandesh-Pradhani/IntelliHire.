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

    resume_text = data.get('resumeText')

    if not resume_text:

        return jsonify({

            "message": "Resume text missing"

        }), 400

    skills = extract_skills(

        resume_text
    )

    ats_score = min(

        len(skills) * 10,

        100
    )

    return jsonify({

        "skills": skills,

        "ats_score": ats_score

    })

@app.route('/job-match', methods=['POST'])
def job_match():

    data = request.json

    resume_text = data.get(

        'resume',
        ''
    )

    job_text = data.get(

        'job',
        ''
    )

    candidate_skills = extract_skills(

        resume_text
    )

    required_skills = extract_skills(

        job_text
    )

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

        len(candidate_skills) * 10,

        similarity_score
    )

    return jsonify({

        "similarity": similarity_score,

        "finalScore": final_score,

        "matchedSkills": gaps["matched"],

        "missingSkills": gaps["missing"],

        "candidateSkills": candidate_skills,

        "requiredSkills": required_skills

    })

if __name__ == '__main__':

    app.run(port=8000)