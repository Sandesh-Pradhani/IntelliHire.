def calculate_match_score(

    candidate_skills,

    required_skills

):

    matched = 0

    missing = []

    for skill in required_skills:

        if skill.lower() in candidate_skills:

            matched += 1

        else:

            missing.append(skill)

    score = (

        matched /

        len(required_skills)

    ) * 100

    return {

        "score": round(score),

        "missing_skills": missing

    }