import { useState } from 'react'
import axios from 'axios'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    })

    alert(res.data.message)
  }

  return (
    <div className="p-10">
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 m-2"
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 m-2"
      />

      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-5 py-2"
      >
        Login
      </button>
    </div>
  )
}

export default Login