from sklearn.feature_extraction.text import TfidfVectorizer

def build_vectors(job_text, resume_text):

    documents = [

        job_text,
        resume_text

    ]

    vectorizer = TfidfVectorizer()

    vectors = vectorizer.fit_transform(documents)

    return vectors