
def calculate_ats_score(skills_count, coding_score, cgpa):
    score = (
        skills_count * 10 +
        coding_score * 0.5 +
        cgpa * 5
    )

    return score