/**
 * AcademicStats — KPI summary cards for academic profile analytics.
 *
 * Problem: Users need a quick glance at key academic metrics.
 * Why this approach: Extracts aggregate stats from profile data + AI score.
 * Alternatives considered: Embedding stats inside AcademicCard (mixes detail with summary).
 */
import { GraduationCap, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react'

/**
 * Build stat cards from a profile object.
 * Returns an array of { label, value, icon, color } items.
 */
function computeStats(profile, aiScore) {
  const stats = []

  if (profile?.cgpa) {
    const cgpaNum = Number(profile.cgpa)
    stats.push({
      label: 'CGPA',
      value: `${cgpaNum.toFixed(2)} / 10`,
      icon: GraduationCap,
      color: cgpaNum >= 8 ? 'emerald' : cgpaNum >= 6 ? 'amber' : 'rose',
    })
  }

  if (aiScore !== undefined) {
    stats.push({
      label: 'Academic Score',
      value: `${aiScore}/100`,
      icon: TrendingUp,
      color: aiScore >= 80 ? 'emerald' : aiScore >= 50 ? 'amber' : 'rose',
    })
  }

  if (profile?.backlogs !== undefined && profile?.backlogs !== null) {
    const b = Number(profile.backlogs)
    stats.push({
      label: 'Backlogs',
      value: b === 0 ? 'None' : `${b} active`,
      icon: AlertTriangle,
      color: b === 0 ? 'emerald' : 'rose',
    })
  }

  if (profile?.currentSemester) {
    stats.push({
      label: 'Current Semester',
      value: `${profile.currentSemester}`,
      icon: BookOpen,
      color: 'blue',
    })
  }

  return stats
}

const COLOR_STYLES = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    value: 'text-emerald-800',
    label: 'text-emerald-600',
    ring: 'ring-emerald-200',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    value: 'text-amber-800',
    label: 'text-amber-600',
    ring: 'ring-amber-200',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    value: 'text-rose-800',
    label: 'text-rose-600',
    ring: 'ring-rose-200',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    value: 'text-blue-800',
    label: 'text-blue-600',
    ring: 'ring-blue-200',
  },
}

export default function AcademicStats({ profile, aiScore }) {
  const stats = computeStats(profile, aiScore)

  if (stats.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const colors = COLOR_STYLES[stat.color]
        return (
          <div
            key={stat.label}
            className={`${colors.bg} rounded-2xl p-4 ring-1 ${colors.ring} flex flex-col gap-2`}
          >
            <Icon className={`h-5 w-5 ${colors.icon}`} />
            <div>
              <p className={`text-2xl font-bold ${colors.value}`}>{stat.value}</p>
              <p className={`text-xs font-semibold ${colors.label} uppercase tracking-wide mt-0.5`}>
                {stat.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}