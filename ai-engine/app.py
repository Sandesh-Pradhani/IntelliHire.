from flask import Flask, request, jsonify
from skill_extractor import extract_skills

app = Flask(__name__)

@app.route('/')
def home():
    return "IntelliHire AI Engine Running"

@app.route('/extract-skills', methods=['POST'])
def skills():

    data = request.json

    text = data['text']

    skills = extract_skills(text)

    return jsonify({
        'skills': skills
    })

if __name__ == '__main__':
    app.run(port=8000)