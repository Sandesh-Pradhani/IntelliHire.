import { useState } from 'react'
import axios from 'axios'

function App() {

  const [file, setFile] = useState(null)

  const [skills, setSkills] = useState([])

  const [score, setScore] = useState(null)

  const [loading, setLoading] = useState(false)

  const uploadResume = async () => {

    try {

      setLoading(true)

      const formData = new FormData()

      formData.append('resume', file)

      const response = await axios.post(

        'http://localhost:5000/api/ai/upload-resume',

        formData

      )

      setSkills(response.data.skills)

      setScore(response.data.ats_score)

      setLoading(false)

    } catch (error) {

      console.log(error)

      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen bg-slate-50">

      {/* HERO SECTION */}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-6 shadow-lg">

        <div className="max-w-6xl mx-auto">

          <h1 className="text-6xl font-bold tracking-tight">

            IntelliHire AI

          </h1>

          <p className="mt-4 text-xl text-blue-100 max-w-2xl">

            AI-powered intelligent recruitment platform for modern hiring workflows.

          </p>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* UPLOAD CARD */}

        <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-200">

          <h2 className="text-3xl font-semibold text-slate-800">

            Resume Analysis

          </h2>

          <p className="text-slate-500 mt-2">

            Upload candidate resume for AI skill extraction and ATS evaluation.

          </p>

          {/* FILE INPUT */}

          <div className="mt-8 border-2 border-dashed border-blue-300 rounded-2xl p-10 bg-blue-50 text-center">

            <input

              type="file"

              accept=".pdf"

              onChange={(e) => setFile(e.target.files[0])}

              className="block mx-auto text-slate-700"

            />

            <p className="mt-4 text-sm text-slate-500">

              Supported Format: PDF Resume

            </p>

          </div>

          {/* BUTTON */}

          <button

            onClick={uploadResume}

            className="mt-8 bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-lg"

          >

            Upload & Analyze Resume

          </button>

          {/* LOADING */}

          {
            loading && (

              <div className="mt-8">

                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">

                  <div className="bg-blue-600 h-3 animate-pulse w-3/4 rounded-full"></div>

                </div>

                <p className="mt-3 text-blue-700 font-medium">

                  AI is analyzing candidate resume...

                </p>

              </div>
            )
          }

        </div>

        {/* RESULTS SECTION */}

        <div className="grid md:grid-cols-2 gap-8 mt-10">

          {/* SKILLS CARD */}

          <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-200">

            <h2 className="text-2xl font-semibold text-slate-800">

              Extracted Skills

            </h2>

            <p className="text-slate-500 mt-2">

              NLP identified candidate technologies and competencies.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">

              {
                skills.length === 0

                ? (
                    <p className="text-slate-400">

                      No skills extracted yet

                    </p>
                  )

                : skills.map((skill, index) => (

                    <div

                      key={index}

                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium"

                    >

                      {skill}

                    </div>
                  ))
              }

            </div>

          </div>

          {/* ATS CARD */}

          <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-200">

            <h2 className="text-2xl font-semibold text-slate-800">

              ATS Evaluation

            </h2>

            <p className="text-slate-500 mt-2">

              AI-generated resume evaluation score.
            </p>

            <div className="mt-10 flex items-center justify-center">

              <div className="w-52 h-52 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex flex-col items-center justify-center shadow-2xl">

                <h1 className="text-6xl font-bold text-white">

                  {
                    score !== null
                    ? score
                    : '--'
                  }

                </h1>

                <p className="text-blue-100 mt-2">

                  ATS Score

                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default App