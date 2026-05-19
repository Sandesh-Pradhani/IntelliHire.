from flask import Flask, request, jsonify

from skill_extractor import extract_skills
from pdf_reader import extract_text_from_pdf

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


if __name__ == '__main__':

    app.run(port=8000)