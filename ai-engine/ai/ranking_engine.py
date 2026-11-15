def _clamp_percentage(value):
    """Keep score inputs inside the 0-100 percentage range."""
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        numeric_value = 0

    return max(0, min(100, numeric_value))


def calculate_final_score(
    skill_match_score,
    similarity_score,
    weights=None,
):
    """
    Calculate the final job match score as a bounded weighted average.

    skill_match_score is the required-skill coverage percentage:
    matched required skills / total required skills * 100.

    similarity_score is the vector similarity percentage.
    """
    if weights is None:
        weights = {
            "skills": 0.6,
            "similarity": 0.4,
        }

    total_weight = sum(weights.values())
    if total_weight <= 0:
        return 0

    normalized_weights = {
        key: value / total_weight
        for key, value in weights.items()
    }

    skill_component = _clamp_percentage(skill_match_score) * normalized_weights.get("skills", 0)
    similarity_component = _clamp_percentage(similarity_score) * normalized_weights.get("similarity", 0)
    final_score = skill_component + similarity_component

    return round(_clamp_percentage(final_score))
