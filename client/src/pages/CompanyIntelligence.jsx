import { useEffect, useState } from 'react'
import { Building2, ChartNoAxesCombined, Plus, Users } from 'lucide-react'
import http from '../services/http.service'

function CompanyIntelligence() {
  const [organization, setOrganization] = useState(null)
  const [intelligence, setIntelligence] = useState(null)
  const [name, setName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('recruiter')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const org = (await http.get('/api/organizations/me')).data
      setOrganization(org)
      if (org) {
        try {
          setIntelligence((await http.get('/api/organizations/intelligence')).data)
        } catch (intelErr) {
          setError(intelErr.message || 'Unable to load company intelligence.')
          setIntelligence(null)
        }
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to load workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function create(event) {
    event.preventDefault()
    try {
      await http.post('/api/organizations', { name })
      setName('')
      await load()
    } catch (requestError) {
      setError(requestError.message || 'Unable to create organization.')
    }
  }

  async function addMember(event) {
    event.preventDefault()
    try {
      await http.post('/api/organizations/members', { email: memberEmail, role: memberRole })
      setMemberEmail('')
      await load()
    } catch (requestError) {
      setError(requestError.message || 'Unable to add member.')
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />

  if (!organization) {
    return (
      <main className="mx-auto max-w-xl pb-12">
        <section className="rounded-3xl bg-gradient-to-br from-slate-950 to-blue-950 p-8 text-white shadow-xl">
          <Building2 className="h-8 w-8 text-cyan-300" />
          <h1 className="mt-5 text-3xl font-extrabold">Create your company workspace</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Bring departments, recruiters, managers, interviewers, and hiring intelligence into one governed workspace.
          </p>
          <form onSubmit={create} className="mt-6 flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Company or organization name"
              className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm text-slate-800"
            />
            <button className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950">
              Create
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </section>
      </main>
    )
  }

  const members = organization.members || []

  return (
    <main className="space-y-7 pb-12 animate-fade-in">
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-7 text-white shadow-xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-300">
          <ChartNoAxesCombined className="h-4 w-4" /> Company Intelligence
        </p>
        <h1 className="mt-4 text-3xl font-extrabold">{organization.name}</h1>
        <p className="mt-2 text-sm text-slate-300">
          A governed view of your hiring funnel, talent pool, and skill demand.
        </p>
      </section>

      {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {intelligence && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Active jobs" value={intelligence.overview?.activeJobs} />
            <Metric label="Candidate pool" value={intelligence.overview?.candidatePool} />
            <Metric label="Pipeline health" value={intelligence.overview?.pipelineHealth} />
            <Metric label="Progression rate" value={intelligence.overview?.progressionRate != null ? `${intelligence.overview.progressionRate}%` : '—'} />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Bars title="Hiring funnel" data={intelligence.funnel} color="bg-blue-500" />
            <Bars title="Most requested skills" data={intelligence.skillDemand} color="bg-indigo-500" />
            <Bars title="Candidate skill supply" data={intelligence.skillSupply} color="bg-emerald-500" />
            <Bars title="College distribution" data={intelligence.collegeDistribution} color="bg-violet-500" />
          </section>
        </>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Workspace members</h2>
          </div>
          <div className="mt-4 space-y-2">
            {members.length > 0 ? members.map((member) => {
              const memberId = member.userId?._id || member.userId
              const memberName = member.userId?.name || 'Member'
              return (
                <div key={String(memberId)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">{memberName}</span>
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold capitalize text-indigo-700">
                    {member.role} · {member.department}
                  </span>
                </div>
              )
            }) : (
              <p className="py-4 text-center text-sm text-slate-400">No members yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Add recruiter teammate</h2>
          </div>
          <form onSubmit={addMember} className="mt-4 space-y-3">
            <input
              value={memberEmail}
              onChange={(event) => setMemberEmail(event.target.value)}
              type="email"
              placeholder="Recruiter email"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            />
            <select
              value={memberRole}
              onChange={(event) => setMemberRole(event.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
            >
              {['recruiter', 'manager', 'interviewer', 'hr', 'admin'].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
            <button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">
              Invite member
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-800">{value ?? '—'}</p>
    </div>
  )
}

function Bars({ title, data, color }) {
  const items = data || []
  const highest = Math.max(...items.map((item) => item.value), 1)
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-slate-900">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="truncate font-medium text-slate-600">{item.label}</span>
                <span className="font-bold text-slate-700">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${(item.value / highest) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">No data yet.</p>
      )}
    </section>
  )
}

export default CompanyIntelligence