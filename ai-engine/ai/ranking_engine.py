def calculate_final_score(

    ats_score,

    similarity_score

):

    final_score = (

        ats_score * 0.4 +

        similarity_score * 0.6

    )

    return round(final_score)