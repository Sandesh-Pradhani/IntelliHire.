/**
 * AcademicCard — Displays a candidate's academic profile as a polished card.
 *
 * Problem: Saved profile data needs a clean read-only view.
 * Why this approach: Re-uses the same field mapping as the form, shows AI-scored insights.
 * Alternatives considered: Inline display in the form itself (mixes edit/view concerns).
 */
import { GraduationCap, Calendar, BookOpen, Building2, AlertTriangle } from 'lucide-react'

const FIELD_META = {
  cgpa:            { label: 'CGPA', icon: GraduationCap, format: (v) => `${v} / 10` },
  branch:          { label: 'Branch', icon: BookOpen },
  college:         { label: 'College / Institution', icon: Building2 },
  university:      { label: 'University', icon: Building2 },
  graduationYear:  { label: 'Graduation Year', icon: Calendar },
  currentSemester: { label: 'Current Semester', icon: Calendar },
  backlogs:        { label: 'Active Backlogs', icon: AlertTriangle, format: (v) => `${v}` },
}

export default function AcademicCard({ profile, onEdit, aiScore }) {
  if (!profile) return null

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* AI Score Banner */}
      {aiScore !== undefined && (
        <div className={`px-6 py-3 text-sm font-semibold flex items-center gap-2 ${
          aiScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
          aiScore >= 50 ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
        }`}>
          <GraduationCap className="h-4 w-4" />
          Academic Score: {aiScore}/100
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(FIELD_META).map(([key, meta]) => {
            const Icon = meta.icon
            const value = profile[key]
            if (value === undefined || value === null || value === '') return null

            return (
              <div key={key} className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {meta.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                    {meta.format ? meta.format(value) : value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {profile.academicAchievements && profile.academicAchievements.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Academic Achievements
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.academicAchievements.map((achievement, idx) => (
                <span key={idx} className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  {achievement}
                </span>
              ))}
            </div>
          </div>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className="mt-6 w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  )
}