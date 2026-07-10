import { useContext, useEffect, useState, useMemo } from 'react'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  Target,
  Award,
  FileText,
  Sparkles,
  Calendar,
  ArrowUpRight,
  Layers,
  Zap,
  Activity,
  Inbox,
  Send
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL

const STATUS_COLORS = {
  Applied: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-200' },
  Screening: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-200' },
  Shortlisted: { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-600', ring: 'ring-indigo-200' },
  Interview: { bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-200' },
  Offered: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  Hired: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', ring: 'ring-green-200' },
  Rejected: { bg: 'bg-rose-500', light: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-200' },
}

const SKILL_BAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-violet-500 to-violet-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
  'from-teal-500 to-teal-600',
  'from-pink-500 to-pink-600',
  'from-sky-500 to-sky-600',
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-100 rounded-xl h-10 w-10" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-20" />
          <div className="h-6 bg-slate-100 rounded w-12" />
        </div>
      </div>
    </div>
  )
}

function SkeletonBar({ width }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-16" />
        <div className="h-3 bg-slate-100 rounded w-8" />
      </div>
      <div className="h-4 bg-slate-100 rounded-full" style={{ width: width || '100%' }} />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="flex items-end gap-3 h-40 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-1 bg-slate-100 rounded-t-lg" style={{ height: `${20 + Math.random() * 60}%` }} />
      ))}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-slate-50 rounded-2xl mb-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
    green: 'bg-green-50 text-green-600 ring-green-100',
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 ${colors[color] || colors.blue} rounded-xl ring-1`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-extrabold text-slate-800">{value}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function HorizontalBarChart({ data, maxValue, labelKey, valueKey, colorKey }) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 w-24 text-right shrink-0 truncate" title={item[labelKey]}>
            {item[labelKey]}
          </span>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${item[colorKey] || SKILL_BAR_COLORS[idx % SKILL_BAR_COLORS.length]} h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
              style={{ width: `${item[valueKey] === 0 ? 0 : Math.max((item[valueKey] / maxValue) * 100, 8)}%` }}
            >
              {item[valueKey] > 0 && (
                <span className="text-[10px] font-bold text-white">{item[valueKey]}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FunnelChart({ stages }) {
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const pct = stage.count === 0 ? 0 : Math.max((stage.count / maxCount) * 100, 8)
        const convRate = idx > 0 && stages[idx - 1].count > 0
          ? Math.round((stage.count / stages[idx - 1].count) * 100)
          : 100

        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-600">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{stage.count}</span>
                {idx > 0 && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    ({convRate}% conv.)
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden">
              <div
                className={`${stage.color || 'bg-blue-500'} h-full rounded-full transition-all duration-700 ease-out flex items-center px-3`}
                style={{ width: `${pct}%` }}
              >
                {pct > 25 && (
                  <span className="text-[10px] font-bold text-white whitespace-nowrap">
                    {idx > 0 ? `${convRate}%` : `${stage.count}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ segments, size = 160 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  let cumulative = 0

  const gradientParts = segments.map((seg) => {
    const start = (cumulative / total) * 360
    cumulative += seg.value
    const end = (cumulative / total) * 360
    return `${seg.color} ${start}deg ${end}deg`
  })

  const gradient = `conic-gradient(${gradientParts.join(', ')})`

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: gradient,
        }}
      >
        <div
          className="absolute bg-white rounded-full flex items-center justify-center"
          style={{
            top: '25%',
            left: '25%',
            width: '50%',
            height: '50%',
          }}
        >
          <div className="text-center">
            <p className="text-xl font-extrabold text-slate-800">{total}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Total</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs font-semibold text-slate-600">{seg.label}</span>
            <span className="text-xs text-slate-400">({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecruiterAnalytics({ applications }) {
  const metrics = useMemo(() => {
    const totalApps = applications.length
    const hiredCount = applications.filter(a => a.status === 'Hired').length
    const successRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0

    const atsScores = applications.map(a => a.atsScore).filter(s => typeof s === 'number')
    const avgAts = atsScores.length > 0
      ? Math.round(atsScores.reduce((s, v) => s + v, 0) / atsScores.length)
      : 0

    const matchScores = applications.map(a => a.matchScore).filter(s => typeof s === 'number')
    const avgMatch = matchScores.length > 0
      ? Math.round(matchScores.reduce((s, v) => s + v, 0) / matchScores.length)
      : 0

    const interviewCount = applications.filter(a => a.status === 'Interview').length
    const avgHiringTime = (() => {
      const hired = applications.filter(a => a.status === 'Hired' && a.createdAt)
      if (hired.length === 0) return '--'
      const totalDays = hired.reduce((sum, a) => {
        const created = new Date(a.createdAt)
        const updated = new Date(a.updatedAt || a.createdAt)
        return sum + Math.ceil((updated - created) / (1000 * 60 * 60 * 24))
      }, 0)
      return Math.round(totalDays / hired.length)
    })()

    return [
      { label: 'Avg ATS Score', value: `${avgAts}%`, icon: BarChart3, color: 'blue', sub: `Across ${atsScores.length} scored` },
      { label: 'Avg Match Score', value: `${avgMatch}%`, icon: Target, color: 'indigo', sub: `Across ${matchScores.length} matched` },
      { label: 'Total Hired', value: hiredCount, icon: CheckCircle2, color: 'green', sub: `${successRate}% success rate` },
      { label: 'Avg Hiring Time', value: typeof avgHiringTime === 'number' ? `${avgHiringTime}d` : avgHiringTime, icon: Clock, color: 'amber', sub: 'Days to hire' },
    ]
  }, [applications])

  const funnelStages = useMemo(() => {
    return [
      { label: 'Applied', count: applications.length, color: 'bg-blue-500' },
      { label: 'Screening', count: applications.filter(a => a.status === 'Screening').length, color: 'bg-amber-500' },
      { label: 'Shortlisted', count: applications.filter(a => a.status === 'Shortlisted').length, color: 'bg-indigo-500' },
      { label: 'Interview', count: applications.filter(a => a.status === 'Interview').length, color: 'bg-violet-500' },
      { label: 'Offered', count: applications.filter(a => a.status === 'Offered').length, color: 'bg-emerald-500' },
      { label: 'Hired', count: applications.filter(a => a.status === 'Hired').length, color: 'bg-green-500' },
    ]
  }, [applications])

  const topSkills = useMemo(() => {
    const counts = {}
    applications.forEach(a => {
      const skills = a.extractedSkills || a.matchedSkills || a.skills || []
      if (Array.isArray(skills)) {
        skills.forEach(s => {
          const name = typeof s === 'string' ? s.trim() : s?.name || ''
          if (name) counts[name] = (counts[name] || 0) + 1
        })
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [applications])

  const monthlyApps = useMemo(() => {
    const monthCounts = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      monthCounts[key] = { label, count: 0 }
    }
    applications.forEach(a => {
      if (a.createdAt) {
        const d = new Date(a.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (monthCounts[key]) monthCounts[key].count++
      }
    })
    return Object.values(monthCounts)
  }, [applications])

  const skillDistribution = useMemo(() => {
    const counts = {}
    applications.forEach(a => {
      const skills = a.extractedSkills || a.matchedSkills || a.skills || []
      if (Array.isArray(skills)) {
        skills.forEach(s => {
          const name = typeof s === 'string' ? s.trim() : s?.name || ''
          if (name) counts[name] = (counts[name] || 0) + 1
        })
      }
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [applications])

  const maxSkillCount = Math.max(...skillDistribution.map(s => s.count), 1)
  const maxMonthCount = Math.max(...monthlyApps.map(m => m.count), 1)

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </section>

      {/* Funnel + Skills */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pipeline Conversion</h3>
              <p className="text-xs text-slate-400 mt-0.5">Funnel from application to hire</p>
            </div>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <FunnelChart stages={funnelStages} />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Skills</h3>
              <p className="text-xs text-slate-400 mt-0.5">Most in-demand skills across applications</p>
            </div>
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
              Top 10
            </span>
          </div>
          {topSkills.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No skills data"
              description="Skills will appear as candidates apply"
            />
          ) : (
            <HorizontalBarChart
              data={topSkills.map((s, i) => ({
                name: s.name,
                count: s.count,
                color: SKILL_BAR_COLORS[i % SKILL_BAR_COLORS.length],
              }))}
              maxValue={maxSkillCount}
              labelKey="name"
              valueKey="count"
              colorKey="color"
            />
          )}
        </div>
      </section>

      {/* Monthly + Status */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Applications</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
            </div>
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-end gap-2 sm:gap-3 h-44 px-1">
            {monthlyApps.map((month, idx) => {
              const pct = month.count === 0 ? 0 : Math.max((month.count / maxMonthCount) * 100, 5)
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700">{month.count}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div
                      className="bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-lg transition-all duration-700 ease-out w-full"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{month.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Application Sources</h3>
              <p className="text-xs text-slate-400 mt-0.5">Skill-based distribution of candidates</p>
            </div>
            <Zap className="h-4 w-4 text-slate-400" />
          </div>
          {skillDistribution.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No data yet"
              description="Data will appear once candidates apply"
            />
          ) : (
            <div className="space-y-3">
              {skillDistribution.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 w-20 text-right shrink-0 truncate" title={skill.name}>
                    {skill.name}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${SKILL_BAR_COLORS[idx % SKILL_BAR_COLORS.length]} h-full rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max((skill.count / maxSkillCount) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{skill.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function CandidateAnalytics({ applications, resumes }) {
  const metrics = useMemo(() => {
    const totalApps = applications.length
    const hiredCount = applications.filter(a => a.status?.toLowerCase() === 'hired').length
    const interviewCount = applications.filter(a =>
      ['interview', 'technical round', 'hr round'].includes(a.status?.toLowerCase())
    ).length
    const successRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0
    const interviewRate = totalApps > 0 ? Math.round((interviewCount / totalApps) * 100) : 0

    const atsScores = resumes.map(r => r.atsScore).filter(s => typeof s === 'number')
    const avgAts = atsScores.length > 0
      ? Math.round(atsScores.reduce((s, v) => s + v, 0) / atsScores.length)
      : 0

    return [
      { label: 'Total Applications', value: totalApps, icon: Send, color: 'blue', sub: 'Jobs applied to' },
      { label: 'Success Rate', value: `${successRate}%`, icon: CheckCircle2, color: 'green', sub: `${hiredCount} hired` },
      { label: 'Interview Rate', value: `${interviewRate}%`, icon: Target, color: 'violet', sub: `${interviewCount} interviews` },
      { label: 'Avg ATS Score', value: `${avgAts}%`, icon: BarChart3, color: 'amber', sub: `From ${atsScores.length} resumes` },
    ]
  }, [applications, resumes])

  const statusDonut = useMemo(() => {
    const counts = {}
    applications.forEach(a => {
      const status = a.status || 'Applied'
      counts[status] = (counts[status] || 0) + 1
    })
    const colorMap = {
      Applied: '#3b82f6',
      Screening: '#f59e0b',
      Shortlisted: '#6366f1',
      Interview: '#8b5cf6',
      Offered: '#10b981',
      Hired: '#22c55e',
      Rejected: '#f43f5e',
      'Technical Round': '#06b6d4',
      'HR Round': '#ec4899',
    }
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      color: colorMap[label] || '#94a3b8',
    }))
  }, [applications])

  const skillProgress = useMemo(() => {
    if (resumes.length === 0) return []
    const latestResume = resumes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    const skills = latestResume.extractedSkills || latestResume.skills || []
    return skills.slice(0, 8).map(skill => {
      const name = typeof skill === 'string' ? skill : skill?.name || ''
      let matchCount = 0
      applications.forEach(a => {
        const appSkills = a.matchedSkills || a.extractedSkills || a.skills || []
        if (Array.isArray(appSkills) && appSkills.some(s => {
          const sName = typeof s === 'string' ? s : s?.name || ''
          return sName.toLowerCase() === name.toLowerCase()
        })) {
          matchCount++
        }
      })
      const rate = applications.length > 0 ? Math.round((matchCount / applications.length) * 100) : 0
      return { name, matchRate: rate, matchCount }
    }).sort((a, b) => b.matchRate - a.matchRate)
  }, [applications, resumes])

  const monthlyApps = useMemo(() => {
    const monthCounts = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      monthCounts[key] = { label, count: 0 }
    }
    applications.forEach(a => {
      if (a.createdAt) {
        const d = new Date(a.createdAt)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (monthCounts[key]) monthCounts[key].count++
      }
    })
    return Object.values(monthCounts)
  }, [applications])

  const maxMonthCount = Math.max(...monthlyApps.map(m => m.count), 1)
  const maxSkillMatch = Math.max(...skillProgress.map(s => s.matchRate), 1)

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </section>

      {/* Donut + Skills */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Applications by Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution across pipeline stages</p>
            </div>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          {statusDonut.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No applications"
              description="Apply to jobs to see your status distribution"
            />
          ) : (
            <DonutChart segments={statusDonut} />
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Skill Progress</h3>
              <p className="text-xs text-slate-400 mt-0.5">Match rate across your applications</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Latest Resume
            </span>
          </div>
          {skillProgress.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No skills data"
              description="Upload a resume to see your skill match rates"
            />
          ) : (
            <div className="space-y-3">
              {skillProgress.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 w-20 text-right shrink-0 truncate" title={skill.name}>
                    {skill.name}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${SKILL_BAR_COLORS[idx % SKILL_BAR_COLORS.length]} h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                      style={{ width: `${skill.matchRate === 0 ? 0 : Math.max((skill.matchRate / maxSkillMatch) * 100, 8)}%` }}
                    >
                      {skill.matchRate > 0 && (
                        <span className="text-[10px] font-bold text-white">{skill.matchRate}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Monthly Timeline */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Application Timeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">Month-by-month applications submitted</p>
          </div>
          <Calendar className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex items-end gap-2 sm:gap-3 h-44 px-1">
          {monthlyApps.map((month, idx) => {
            const pct = month.count === 0 ? 0 : Math.max((month.count / maxMonthCount) * 100, 5)
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">{month.count}</span>
                <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                  <div
                    className="bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-lg transition-all duration-700 ease-out w-full"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{month.label}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Analytics() {
  const { user } = useContext(AuthContext)
  const [applications, setApplications] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isRecruiter = user?.role === 'recruiter' || user?.role === 'admin'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const endpoint = isRecruiter
          ? '/api/applications/recruiter'
          : '/api/applications/candidate'

        const [appsRes, analyticsRes] = await Promise.allSettled([
          axios.get(`${API_URL}${endpoint}`, { headers }),
          axios.get(`${API_URL}${isRecruiter ? '/api/analytics/recruiter' : '/api/analytics/candidate'}`, { headers }),
        ])

        if (appsRes.status === 'fulfilled') {
          setApplications(appsRes.value.data || [])
        }

        if (!isRecruiter && analyticsRes.status === 'fulfilled') {
          const data = analyticsRes.value.data
          if (data?.resumes) setResumes(data.resumes)
        }

        if (!isRecruiter) {
          const historyRes = await axios.get(`${API_URL}/api/ai/history`, { headers }).catch(() => null)
          if (historyRes?.data) setResumes(prev => prev.length > 0 ? prev : historyRes.data || [])
        }
      } catch (err) {
        console.error('Analytics fetch error:', err)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isRecruiter])

  return (
    <main className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Analytics
          </h1>
          <p className="text-slate-500 mt-2">
            {isRecruiter
              ? 'Insights and metrics for your recruitment pipeline.'
              : 'Track your application performance and skill progress.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-semibold">
            {isRecruiter ? 'Recruiter' : 'Candidate'} View
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="h-5 bg-slate-100 rounded w-32 mb-5 animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonBar key={i} />)}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="h-5 bg-slate-100 rounded w-32 mb-5 animate-pulse" />
              <SkeletonChart />
            </div>
          </div>
        </div>
      ) : applications.length === 0 && !error ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-600">No data yet</h3>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">
            {isRecruiter
              ? 'Analytics will appear once candidates start applying to your jobs.'
              : 'Apply to jobs and upload resumes to see your analytics here.'}
          </p>
        </div>
      ) : isRecruiter ? (
        <RecruiterAnalytics applications={applications} />
      ) : (
        <CandidateAnalytics applications={applications} resumes={resumes} />
      )}
    </main>
  )
}

export default Analytics
