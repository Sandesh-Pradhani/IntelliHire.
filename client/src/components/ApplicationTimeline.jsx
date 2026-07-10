import { format } from 'date-fns';

const STATUS_COLORS = {
  Applied: { dot: 'bg-blue-500', ring: 'ring-blue-100' },
  Screening: { dot: 'bg-amber-500', ring: 'ring-amber-100' },
  Shortlisted: { dot: 'bg-emerald-500', ring: 'ring-emerald-100' },
  Assessment: { dot: 'bg-indigo-500', ring: 'ring-indigo-100' },
  Interview: { dot: 'bg-violet-500', ring: 'ring-violet-100' },
  'Technical Round': { dot: 'bg-cyan-500', ring: 'ring-cyan-100' },
  'HR Round': { dot: 'bg-pink-500', ring: 'ring-pink-100' },
  Offered: { dot: 'bg-emerald-500', ring: 'ring-emerald-100' },
  Accepted: { dot: 'bg-green-500', ring: 'ring-green-100' },
  Rejected: { dot: 'bg-rose-500', ring: 'ring-rose-100' },
  Hired: { dot: 'bg-green-500', ring: 'ring-green-100' },
};

const DEFAULT_COLOR = { dot: 'bg-gray-400', ring: 'ring-gray-100' };

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
  } catch {
    return dateStr;
  }
}

function ChangedByBadge({ changedBy }) {
  if (!changedBy) return null;

  const isCandidate = changedBy.toLowerCase() === 'candidate';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isCandidate
          ? 'bg-blue-50 text-blue-700'
          : 'bg-violet-50 text-violet-700'
      }`}
    >
      {changedBy}
    </span>
  );
}

export default function ApplicationTimeline({ application }) {
  if (!application) return null;

  const timeline = application.timeline || [];

  if (timeline.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No timeline entries available.
      </div>
    );
  }

  const sorted = [...timeline].sort(
    (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
  );

  return (
    <div className="relative">
      {sorted.map((entry, idx) => {
        const status = entry.status || 'Unknown';
        const colors = STATUS_COLORS[status] || DEFAULT_COLOR;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={entry._id || entry.id || idx} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Status dot */}
            <div className="relative z-10 shrink-0">
              <div className={`w-8 h-8 rounded-full ring-4 ${colors.ring} flex items-center justify-center`}>
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="text-sm font-semibold text-gray-900">{status}</h4>
                <ChangedByBadge changedBy={entry.changedBy} />
              </div>
              {entry.note && (
                <p className="text-sm text-gray-600 mb-1">{entry.note}</p>
              )}
              <span className="text-xs text-gray-400">
                {formatDate(entry.date || entry.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
