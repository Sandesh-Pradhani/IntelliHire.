function Dashboard() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Recruiter Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-5 mt-10">
        <div className="shadow p-5 rounded">
          Total Candidates
        </div>

        <div className="shadow p-5 rounded">
          ATS Rankings
        </div>

        <div className="shadow p-5 rounded">
          Coding Scores
        </div>
      </div>
    </div>
  )
}

export default Dashboard