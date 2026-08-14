import { useState } from 'react'
import { Bot, ChevronRight, Search, Sparkles, UserRound } from 'lucide-react'
import http from '../services/http.service'

const prompts = ['Find candidates with React and Docker', 'Show candidates with FastAPI project experience', 'Find strong frontend developers with GitHub evidence']

function RecruiterCopilot() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function ask(prompt = query) {
    if (!prompt.trim()) return
    setQuery(prompt)
    setLoading(true); setError('')
    try { setResponse((await http.post('/api/copilot/recruiter/query', { query: prompt })).data) } catch (requestError) { setError(requestError.message || 'The Copilot could not complete that search.') } finally { setLoading(false) }
  }

  return <main className="space-y-7 pb-12 animate-fade-in">
    <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-7 text-white shadow-xl sm:p-9"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300"><Bot className="h-4 w-4" /> Recruiter AI Copilot</p><h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Ask for the talent you need.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Search candidate evidence, not just profile fields. Every result shows the skills, projects, and experience behind its ranking.</p><form className="mt-6 flex gap-2" onSubmit={(event) => { event.preventDefault(); ask() }}><div className="relative flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Find candidates with React and Docker" className="w-full rounded-2xl border border-white/15 bg-white px-11 py-3.5 text-sm text-slate-800 outline-none ring-0" /></div><button className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300" disabled={loading}>{loading ? 'Searching…' : 'Ask Copilot'}</button></form><div className="mt-4 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">{prompt}</button>)}</div></section>
    {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {response && <section className="space-y-5"><div className="flex items-center gap-2 text-sm text-slate-500"><Sparkles className="h-4 w-4 text-indigo-600" />{response.explanation}</div>{response.results.length ? response.results.map((result, index) => <article key={result.candidateId} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><UserRound className="h-5 w-5" /></div><div><p className="font-bold text-slate-900">#{index + 1} {result.name}</p><p className="text-xs text-slate-400">{result.email}</p></div></div><div className="rounded-2xl bg-indigo-600 px-4 py-2 text-center text-white"><p className="text-xl font-black">{result.score}%</p><p className="text-[10px] font-bold uppercase tracking-wide text-indigo-100">Evidence fit</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-2"><Evidence title="Why this candidate" items={result.evidence} tone="emerald" /><Evidence title="Matched skills" items={result.matchedSkills} tone="indigo" /></div>{result.missingSkills.length > 0 && <p className="mt-3 text-xs text-slate-500">Not yet evidenced: <span className="font-semibold text-amber-700">{result.missingSkills.join(', ')}</span></p>}<button className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600">View Digital Twin <ChevronRight className="h-3.5 w-3.5" /></button></article>) : <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">No evidence-backed matches yet. Try a broader skill or add candidate portfolio data.</div>}</section>}
  </main>
}

function Evidence({ title, items, tone }) { const color = tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'; return <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p><div className="flex flex-wrap gap-2">{items.length ? items.map((item) => <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{item}</span>) : <span className="text-xs text-slate-400">No direct evidence found</span>}</div></div> }
export default RecruiterCopilot
