import Layout from '../components/Layout'

function Rankings() {

    const mockCandidates = [

        {
            name: 'Sandesh',
            score: 92,
            skills: ['Python', 'React', 'MongoDB']
        },

        {
            name: 'Rahul',
            score: 84,
            skills: ['Java', 'NodeJS']
        }
    ]

    return (

        <Layout>

            <h1 className="text-5xl font-bold text-slate-800">

                Candidate Rankings
            </h1>

            <div className="mt-10 space-y-6">

                {
                    mockCandidates.map((candidate, index) => (

                        <div

                            key={index}

                            className="bg-white rounded-3xl shadow-lg p-8 flex justify-between"

                        >

                            <div>

                                <h2 className="text-2xl font-semibold">

                                    {candidate.name}
                                </h2>

                                <div className="flex gap-3 mt-4">

                                    {
                                        candidate.skills.map((skill, idx) => (

                                            <span

                                                key={idx}

                                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full"

                                            >
                                                {skill}
                                            </span>
                                        ))
                                    }

                                </div>

                            </div>

                            <div>

                                <h2 className="text-5xl font-bold text-blue-600">

                                    {candidate.score}
                                </h2>

                                <p className="text-slate-500">

                                    Match Score
                                </p>

                            </div>

                        </div>
                    ))
                }

            </div>

        </Layout>
    )
}

export default Rankings