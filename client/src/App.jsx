import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {

  const [message, setMessage] = useState('Loading...')

  useEffect(() => {

    axios.get('http://localhost:5000')

    .then((res) => {
      setMessage(res.data)
    })

    .catch((err) => {
      console.log(err)
    })

  }, [])

  return (
    <div style={{ padding: "40px" }}>

      <h1>IntelliHire AI</h1>

      <h2>{message}</h2>

    </div>
  )
}

export default App