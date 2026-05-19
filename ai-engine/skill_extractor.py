import spacy

nlp = spacy.load("en_core_web_sm")

SKILLS_DB = [

    "python",
    "java",
    "react",
    "mongodb",
    "machine learning",
    "javascript",
    "nodejs",
    "html",
    "css",
    "sql"

]


def extract_skills(text):

    text = text.lower()

    extracted_skills = []

    for skill in SKILLS_DB:

        if skill.lower() in text:

            extracted_skills.append(skill)

    return list(set(extracted_skills))