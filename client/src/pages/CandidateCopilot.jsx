import { useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import http from '../services/http.service'

const prompts = ['How do I improve my ATS?', 'Which project should I build next?', 'Which certificate would strengthen my profile?', 'Which companies or roles should I target?']

function CandidateCopilot() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function ask(prompt = question) {
    if (!prompt.trim()) return
    setQuestion(prompt); setLoading(true); setError('')
    try { setAnswer((await http.post('/api/copilot/candidate/query', { question: prompt })).data) } catch (requestError) { setError(requestError.message || 'Your AI Coach could not answer that right now.') } finally { setLoading(false) }
  }
  return <main className="space-y-7 pb-12 animate-fade-in"><section className="rounded-3xl bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 p-7 text-white shadow-xl sm:p-9"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-300"><Sparkles className="h-4 w-4" /> AI Career Coach</p><h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Career advice grounded in your evidence.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Ask about ATS, projects, skills, certificates, or target roles. Your coach reads your Digital Twin rather than giving generic advice.</p><form className="mt-6 flex gap-2" onSubmit={(event) => { event.preventDefault(); ask() }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="How can I improve my ATS?" className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3.5 text-sm text-slate-800 outline-none" /><button className="rounded-2xl bg-violet-400 px-4 text-violet-950 hover:bg-violet-300" disabled={loading}><Send className="h-4 w-4" /></button></form><div className="mt-4 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">{prompt}</button>)}</div></section>{error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{answer && <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-2xl bg-violet-50 p-3 text-violet-600"><Bot className="h-6 w-6" /></div><div><h2 className="font-bold text-slate-900">Your evidence-based answer</h2><p className="text-xs text-slate-400">Grounded in your Digital Twin</p></div></div><p className="mt-6 text-sm leading-7 text-slate-700">{answer.answer}</p><div className="mt-6 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Recommended next actions</p><ol className="mt-3 space-y-2">{answer.actions.map((action, index) => <li key={action} className="flex gap-3 text-sm text-slate-600"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{index + 1}</span>{action}</li>)}</ol></div></section>}</main>
}
export default CandidateCopilot
