import spacy

nlp = spacy.load('en_core_web_sm')

SKILLS_DB = [
    'python',
    'java',
    'react',
    'mongodb',
    'machine learning',
    'nodejs'
]


def extract_skills(text):
    doc = nlp(text.lower())

    found_skills = []

    for token in doc:
        if token.text in SKILLS_DB:
            found_skills.append(token.text)

    return list(set(found_skills))