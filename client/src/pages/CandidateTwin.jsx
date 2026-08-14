import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, Lightbulb, Network, Radar, Sparkles, TrendingUp } from 'lucide-react'
import http from '../services/http.service'

const scoreLabels = {
  ats: 'ATS', technical: 'Technical', communication: 'Communication', project: 'Projects',
  learning: 'Learning', growth: 'Growth', confidence: 'Confidence', employability: 'Employability',
}

function CandidateTwin() {
  const [twin, setTwin] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    http.get('/api/intelligence/me').then((response) => setTwin(response.data)).catch((requestError) => setError(requestError.message || 'Unable to load your digital twin.'))
  }, [])

  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
  if (!twin) return <div className="space-y-5 animate-pulse"><div className="h-48 rounded-3xl bg-slate-200" /><div className="h-64 rounded-3xl bg-slate-100" /></div>

  return (
    <main className="space-y-7 pb-12 animate-fade-in">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-900 p-7 text-white shadow-xl sm:p-9">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300"><Sparkles className="h-4 w-4" /> Candidate Digital Twin</p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div><h1 className="text-3xl font-extrabold sm:text-4xl">Your career intelligence, connected.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A transparent view of the evidence in your resume, portfolio, academics, and career activity.</p></div>
            <div className="rounded-2xl border border-cyan-300/20 bg-white/10 px-6 py-4 text-center backdrop-blur"><p className="text-4xl font-black text-cyan-300">{twin.scores.employability}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-300">Employability signal</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(twin.scores).map(([key, score]) => <ScoreCard key={key} label={scoreLabels[key]} score={score} highlight={key === 'employability'} />)}
      </section>

      <section className="grid gap-7 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center gap-2"><Radar className="h-5 w-5 text-indigo-600" /><div><h2 className="font-bold text-slate-900">Evidence graph</h2><p className="text-xs text-slate-400">Skills and sources powering your profile</p></div></div>
          <div className="mt-6 flex flex-wrap gap-2">{twin.graph.skills.length ? twin.graph.skills.map((skill) => <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{skill}</span>) : <p className="text-sm text-slate-400">Add a resume or project to start your skill graph.</p>}</div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(twin.graph.counts).map(([key, count]) => <div key={key} className="rounded-2xl bg-slate-50 p-3"><p className="text-xl font-extrabold text-slate-800">{count}</p><p className="text-xs capitalize text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p></div>)}</div>
          <div className="mt-7 border-t border-slate-100 pt-5"><div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Network className="h-4 w-4 text-indigo-600" /> Knowledge graph relationships <span className="ml-auto text-xs font-medium text-slate-400">{twin.knowledgeGraph.summary.relationshipCount} connected</span></div><div className="mt-3 space-y-2">{twin.knowledgeGraph.edges.filter((edge) => ['uses', 'applied', 'documents'].includes(edge.relation)).slice(0, 4).map((edge, index) => <div key={`${edge.from}-${edge.to}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"><span className="truncate font-medium text-slate-600">{edge.relation} · {edge.evidence.join(', ')}</span><span className="ml-3 shrink-0 font-bold text-indigo-600">{edge.confidence}% confidence</span></div>)}{!twin.knowledgeGraph.edges.length && <p className="text-sm text-slate-400">Connections appear as you add career evidence.</p>}</div></div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2"><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-slate-900">Resume growth</h2></div><div className="mt-5 space-y-4">{twin.resumeTimeline.length ? twin.resumeTimeline.map((resume) => <div key={resume.id} className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">v{resume.version}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-sm font-semibold text-slate-700"><span className="truncate">{resume.name}</span><span>{resume.score}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${resume.score}%` }} /></div></div></div>) : <p className="py-8 text-sm text-slate-400">Your score history will appear after you upload a resume.</p>}</div></div>
      </section>

      <section className="grid gap-7 lg:grid-cols-2">
        <InsightCard icon={CheckCircle2} title="Recognized strengths" items={twin.insights.strengths} empty="Add more verified evidence to surface strengths." tone="emerald" />
        <InsightCard icon={Lightbulb} title="Next best actions" items={twin.insights.improvements} empty="Your profile has strong coverage. Keep it current." tone="amber" />
      </section>
      <p className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{twin.purpose}</p>
    </main>
  )
}

function ScoreCard({ label, score, highlight }) { return <div className={`rounded-2xl border p-5 shadow-sm ${highlight ? 'border-indigo-200 bg-indigo-600 text-white' : 'border-slate-100 bg-white'}`}><p className={`text-xs font-bold uppercase tracking-wider ${highlight ? 'text-indigo-100' : 'text-slate-400'}`}>{label}</p><div className="mt-2 flex items-end justify-between"><p className="text-3xl font-black">{score}<span className="text-base">%</span></p><div className={`h-2 w-16 rounded-full ${highlight ? 'bg-white/25' : 'bg-slate-100'}`}><div className={`h-2 rounded-full ${highlight ? 'bg-cyan-300' : 'bg-indigo-500'}`} style={{ width: `${score}%` }} /></div></div></div> }
function InsightCard({ icon: Icon, title, items, empty, tone }) { const color = tone === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'; return <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><div className={`rounded-xl p-2 ${color}`}><Icon className="h-5 w-5" /></div><h2 className="font-bold text-slate-900">{title}</h2></div><div className="mt-5 space-y-3">{items.length ? items.map((item) => <p key={item} className="rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">{item}</p>) : <p className="py-4 text-sm text-slate-400">{empty}</p>}</div></section> }
export default CandidateTwin
