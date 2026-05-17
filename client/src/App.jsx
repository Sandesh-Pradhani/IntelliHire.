import { useState } from 'react'
import axios from 'axios'

function App() {

  /*
  STATE

  React re-renders UI whenever state changes.
  */

  const [resumeText, setResumeText] = useState('')
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [atsScore, setAtsScore] = useState(null)

  /*
  WHY async?

  API requests take time.
  JavaScript continues execution asynchronously.
  */

  const extractSkills = async () => {

    try {

      setLoading(true)

      /*
      FRONTEND
      ↓
      EXPRESS BACKEND
      */

      const response = await axios.post(
        'http://localhost:5000/api/ai/extract-skills',
        {
          text: resumeText
        }
      )

      /*
      response.data:

      {
         skills: [...]
      }
      */

      const extractedSkills = response.data.skills

      setSkills(extractedSkills)

      /*
      SIMPLE ATS LOGIC

      WHY?

      Real systems score candidates.
      */

      const score = extractedSkills.length * 10

      setAtsScore(score)

      setLoading(false)

    } catch (error) {

      console.log(error)

      setLoading(false)
    }
  }

  return (

    <div style={styles.container}>

      <h1 style={styles.heading}>
        IntelliHire AI
      </h1>

      <p style={styles.subHeading}>
        AI Powered Recruitment System
      </p>

      <textarea
        rows="12"
        cols="70"
        placeholder="Paste Resume Text Here..."
        style={styles.textarea}
        onChange={(e) => setResumeText(e.target.value)}
      />

      <br />

      <button
        style={styles.button}
        onClick={extractSkills}
      >
        Extract Skills
      </button>

      {
        loading && (
          <h3>Analyzing Resume...</h3>
        )
      }

      <div style={styles.resultBox}>

        <h2>Extracted Skills</h2>

        {
          skills.length === 0
          ? <p>No Skills Extracted</p>
          : (
              <ul>
                {
                  skills.map((skill, index) => (
                    <li key={index}>
                      {skill}
                    </li>
                  ))
                }
              </ul>
            )
        }

      </div>

      {
        atsScore !== null && (
          <div style={styles.scoreBox}>

            <h2>
              ATS Score: {atsScore}
            </h2>

          </div>
        )
      }

    </div>
  )
}

/*
WHY styles object?

Inline styling keeps V1 simple.

Later:
Tailwind CSS
*/

const styles = {

  container: {
    padding: '40px',
    fontFamily: 'Arial'
  },

  heading: {
    fontSize: '50px',
    color: '#2563eb'
  },

  subHeading: {
    fontSize: '20px',
    marginBottom: '20px'
  },

  textarea: {
    padding: '15px',
    fontSize: '16px',
    borderRadius: '10px',
    border: '1px solid gray'
  },

  button: {
    marginTop: '20px',
    padding: '12px 25px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px'
  },

  resultBox: {
    marginTop: '30px',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '10px'
  },

  scoreBox: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#eff6ff',
    borderRadius: '10px'
  }
}

export default App