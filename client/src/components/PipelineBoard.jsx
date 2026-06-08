function PipelineBoard({ applications }) {

    const statuses = [

        'Applied',
        'Shortlisted',
        'Interview',
        'Hired',
        'Rejected'

    ]

    return (

        <div className="grid lg:grid-cols-5 gap-6 mt-10">

            {
                statuses.map((status) => (

                    <div

                        key={status}

                        className="bg-slate-100 rounded-3xl p-4 min-h-[500px]"

                    >

                        <h2 className="text-xl font-bold text-slate-800 mb-6">

                            {status}

                        </h2>

                        <div className="space-y-4">

                            {
                                applications

                                    .filter(

                                        app =>

                                            app.status === status
                                    )

                                    .map((app) => (

                                        <div

                                            key={app._id}

                                            className="bg-white rounded-2xl p-4 shadow"

                                        >

                                            <h3 className="font-semibold text-slate-800">

                                                {
                                                    app.candidate?.name ||
                                                    'Candidate'
                                                }

                                            </h3>

                                            <p className="text-sm text-slate-500 mt-1">

                                                {
                                                    app.job?.title ||
                                                    'Job'
                                                }

                                            </p>

                                            <div className="mt-3">

                                                <span

                                                    className="
                                                    bg-blue-100
                                                    text-blue-700
                                                    px-3
                                                    py-1
                                                    rounded-full
                                                    text-sm
                                                    font-medium
                                                    "

                                                >
                                                    {
                                                        app.matchScore
                                                    }%
                                                </span>

                                            </div>

                                        </div>
                                    ))
                            }

                        </div>

                    </div>
                ))
            }

        </div>
    )
}

export default PipelineBoard