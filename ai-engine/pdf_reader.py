from PyPDF2 import PdfReader

"""
WHY THIS FILE?

Single responsibility principle.

This file ONLY extracts PDF text.
"""


def extract_text_from_pdf(file_path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        text += page.extract_text()

    return text