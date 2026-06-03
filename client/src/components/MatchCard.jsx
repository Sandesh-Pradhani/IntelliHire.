function MatchCard({

    similarity,

    finalScore

}) {

    const getRecommendation = () => {

        if (finalScore >= 85)
            return "Strong Match"

        if (finalScore >= 70)
            return "Good Match"

        if (finalScore >= 50)
            return "Average Match"

        return "Needs Improvement"
    }

    return (

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">

            <h2 className="text-2xl font-semibold text-slate-800">

                Candidate Match Analysis

            </h2>

            <div className="grid grid-cols-2 gap-6 mt-8">

                <div className="bg-blue-50 rounded-2xl p-6">

                    <p className="text-slate-500">

                        Similarity Score
                    </p>

                    <h1 className="text-5xl font-bold text-blue-600 mt-2">

                        {similarity}%
                    </h1>

                </div>

                <div className="bg-indigo-50 rounded-2xl p-6">

                    <p className="text-slate-500">

                        Final Score
                    </p>

                    <h1 className="text-5xl font-bold text-indigo-600 mt-2">

                        {finalScore}
                    </h1>

                </div>

            </div>

            <div className="mt-8 bg-slate-50 rounded-2xl p-6">

                <p className="text-slate-500">

                    Recommendation
                </p>

                <h3 className="text-xl font-semibold text-slate-800 mt-2">

                    {getRecommendation()}
                </h3>

            </div>

        </div>
    )
}

export default MatchCard