import spacy

# WHY?
# spaCy model provides NLP processing.
nlp = spacy.load("en_core_web_sm")

"""
SKILLS DATABASE

In real systems:
- stored in database
- thousands of skills

V1:
simple Python list
"""

SKILLS_DB = [
    "python",
    "java",
    "react",
    "mongodb",
    "machine learning",
    "nodejs",
    "javascript",
    "html",
    "css",
    "sql"
]


def extract_skills(text):

    """
    WHY LOWERCASE?

    Prevent:
    Python != python
    """

    text = text.lower()

    doc = nlp(text)

    extracted_skills = []

    """
    BETTER APPROACH

    Instead of checking tokens,
    check full text matching.
    """

    for skill in SKILLS_DB:

        if skill.lower() in text:

            extracted_skills.append(skill)

    """
    WHY set()?

    Removes duplicates.
    """

    return list(set(extracted_skills))