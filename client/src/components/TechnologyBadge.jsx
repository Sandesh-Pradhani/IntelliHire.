/**
 * TechnologyBadge - Renders a styled technology tag
 *
 * Problem solved: Provides consistent visual representation of technology
 * tags across all project-related components.
 *
 * Reason: Single source of truth for tech badge styling. Ensures consistent
 * colors and spacing throughout the portfolio UI.
 *
 * Alternative: Inline spans in each component — rejected because it leads to
 * duplicated styling and inconsistency.
 */

const TECH_COLORS = {
  react: 'bg-cyan-100 text-cyan-700',
  vue: 'bg-emerald-100 text-emerald-700',
  angular: 'bg-rose-100 text-rose-700',
  nextjs: 'bg-slate-100 text-slate-700',
  nodejs: 'bg-green-100 text-green-700',
  python: 'bg-blue-100 text-blue-700',
  javascript: 'bg-amber-100 text-amber-700',
  typescript: 'bg-blue-100 text-blue-700',
  java: 'bg-orange-100 text-orange-700',
  go: 'bg-cyan-100 text-cyan-700',
  rust: 'bg-orange-100 text-orange-700',
  fastapi: 'bg-teal-100 text-teal-700',
  django: 'bg-green-100 text-green-700',
  flask: 'bg-slate-100 text-slate-700',
  express: 'bg-slate-100 text-slate-700',
  postgresql: 'bg-blue-100 text-blue-700',
  mongodb: 'bg-green-100 text-green-700',
  redis: 'bg-rose-100 text-rose-700',
  docker: 'bg-blue-100 text-blue-700',
  kubernetes: 'bg-blue-100 text-blue-700',
  aws: 'bg-amber-100 text-amber-700',
  tensorflow: 'bg-amber-100 text-amber-700',
  pytorch: 'bg-rose-100 text-rose-700',
  tailwindcss: 'bg-cyan-100 text-cyan-700',
  graphql: 'bg-pink-100 text-pink-700',
  'machine-learning': 'bg-violet-100 text-violet-700',
  'deep-learning': 'bg-violet-100 text-violet-700',
  nlp: 'bg-violet-100 text-violet-700',
}

const DEFAULT_COLOR = 'bg-blue-100 text-blue-700'

function TechnologyBadge({ name, size = 'sm' }) {
  const normalized = name.toLowerCase().replace(/[\s-]/g, '')
  const colorClass = Object.entries(TECH_COLORS).find(
    ([key]) => key.replace(/[\s-]/g, '') === normalized
  )?.[1] || DEFAULT_COLOR

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span className={`inline-flex items-center rounded-lg font-medium ${colorClass} ${sizeClasses[size] || sizeClasses.sm}`}>
      {name}
    </span>
  )
}

export default TechnologyBadge
