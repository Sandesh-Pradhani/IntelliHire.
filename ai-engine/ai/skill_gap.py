def skill_gap_analysis(

    candidate_skills,

    required_skills

):

    missing = []

    matched = []

    for skill in required_skills:

        if skill.lower() in candidate_skills:

            matched.append(skill)

        else:

            missing.append(skill)

    return {

        "matched": matched,

        "missing": missing

    }