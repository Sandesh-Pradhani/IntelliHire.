function ApplicationCard({

    application,

    onStatusChange,

    isUpdating

}) {

    return (

        <div className="bg-white rounded-3xl shadow-lg p-6">

            <div className="flex justify-between">

                <div>

                    <h2 className="text-xl font-semibold">

                        {application.candidate?.name}

                    </h2>

                    <p className="text-slate-500">

                        {application.job?.title}
                    </p>

                </div>

                <div>

                    <h2 className="text-3xl font-bold text-blue-600">

                        {application.matchScore}%
                    </h2>

                </div>

            </div>

            <div className="mt-6">

                <select

                    value={application.status}

                    onChange={(e) =>

                        onStatusChange(

                            application._id,

                            e.target.value
                        )
                    }

                    className="border rounded-xl p-3"
                    disabled={isUpdating}

                >

                    <option>Applied</option>

                    <option>Shortlisted</option>

                    <option>Interview</option>

                    <option>Rejected</option>

                    <option>Hired</option>

                </select>

            </div>

        </div>
    )
}

export default ApplicationCard
