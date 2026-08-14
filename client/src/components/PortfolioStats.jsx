/**
 * PortfolioStats - Displays portfolio statistics summary
 *
 * Problem solved: Provides an at-a-glance overview of the candidate's
 * portfolio with key metrics like total projects, average score, and
 * technology count.
 *
 * Reason: Stats are used in both the Portfolio page header and the
 * Candidate Dashboard widget, so extracting them into a component
 * avoids duplication.
 *
 * Alternative: Inline stats in each page — rejected because it leads to
 * code duplication and inconsistent styling.
 */

import { FolderKanban, Star, Code2, TrendingUp } from 'lucide-react'

function PortfolioStats({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  const items = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: FolderKanban,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg Portfolio Score',
      value: stats?.averageScore ? `${stats.averageScore}` : '--',
      icon: Star,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Technologies Used',
      value: stats?.technologiesUsed?.length || 0,
      icon: Code2,
      tone: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Categories',
      value: stats?.categories ? Object.keys(stats.categories).length : 0,
      icon: TrendingUp,
      tone: 'bg-emerald-50 text-emerald-600',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                <p className="text-2xl font-extrabold text-slate-800">{item.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PortfolioStats
