function SkillGapCard({

    matchedSkills,

    missingSkills

}) {

    return (

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">

            <h2 className="text-2xl font-semibold text-slate-800">

                Skill Gap Analysis

            </h2>

            {/* MATCHED */}

            <div className="mt-8">

                <h3 className="font-semibold text-green-600 mb-4">

                    Matched Skills
                </h3>

                <div className="flex flex-wrap gap-3">

                    {
                        matchedSkills?.map(

                            (skill, index) => (

                                <span

                                    key={index}

                                    className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium"

                                >
                                    {skill}
                                </span>
                            )
                        )
                    }

                </div>

            </div>

            {/* MISSING */}

            <div className="mt-10">

                <h3 className="font-semibold text-red-600 mb-4">

                    Missing Skills
                </h3>

                <div className="flex flex-wrap gap-3">

                    {
                        missingSkills?.map(

                            (skill, index) => (

                                <span

                                    key={index}

                                    className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium"

                                >
                                    {skill}
                                </span>
                            )
                        )
                    }

                </div>

            </div>

        </div>
    )
}

export default SkillGapCard