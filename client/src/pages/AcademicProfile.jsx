import { useEffect, useState } from 'react'

import { getAcademicProfile, createAcademicProfile, updateAcademicProfile } from '../services/academicService'

function AcademicProfile() {
  const [profile, setProfile] = useState({
    cgpa: '',
    branch: '',
    college: '',
    graduationYear: '',
    currentSemester: '',
    backlogs: 0
  })

  const [loading, setLoading] = useState(false)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const data = await getAcademicProfile()
      if (data) {
        setProfile(data)
        setExists(true)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const saveProfile = async () => {
    try {
      const semesterStr = String(profile.currentSemester || '').trim()
      if (!/^\d+$/.test(semesterStr)) {
        alert('Current Semester must be a number (e.g., 7 instead of 7th)')
        return
      }

      setLoading(true)

      const sanitized = {
        ...profile,
        cgpa: Number(profile.cgpa) || 0,
        branch: profile.branch.trim(),
        college: profile.college.trim(),
        graduationYear: parseInt(profile.graduationYear, 10) || new Date().getFullYear(),
        currentSemester: parseInt(semesterStr, 10),
        backlogs: parseInt(profile.backlogs, 10) || 0
      }

      if (exists) {
        await updateAcademicProfile(sanitized)
      } else {
        await createAcademicProfile(sanitized)
        setExists(true)
      }

      alert('Academic Profile Saved')
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-5xl font-bold text-slate-800">Academic Profile</h1>
      <p className="text-slate-500 mt-3">Build your academic identity for recruiters.</p>

      <div className="bg-white rounded-3xl shadow-lg p-8 mt-10">
        <div className="grid md:grid-cols-2 gap-6">
          <input name="cgpa" placeholder="CGPA" value={profile.cgpa} onChange={handleChange} className="border rounded-xl p-4" />
          <input name="branch" placeholder="Branch" value={profile.branch} onChange={handleChange} className="border rounded-xl p-4" />
          <input name="college" placeholder="College" value={profile.college} onChange={handleChange} className="border rounded-xl p-4" />
          <input name="graduationYear" placeholder="Graduation Year" value={profile.graduationYear} onChange={handleChange} className="border rounded-xl p-4" />
          <input name="currentSemester" placeholder="Current Semester" value={profile.currentSemester} onChange={handleChange} className="border rounded-xl p-4" />
          <input name="backlogs" placeholder="Backlogs" value={profile.backlogs} onChange={handleChange} className="border rounded-xl p-4" />
        </div>

        <button
          onClick={saveProfile}
          disabled={loading}
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}

export default AcademicProfile