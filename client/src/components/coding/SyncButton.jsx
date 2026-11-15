/**
 * SyncButton - Triggers profile refresh from all connected platforms
 *
 * WHY THIS FILE:
 * Reusable button that syncs coding data from GitHub, LeetCode, and HackerRank.
 * Shows a loading spinner while syncing and handles error states.
 *
 * WHY THIS APPROACH:
 * - Loading state with "Syncing..." text gives clear feedback
 * - Disabled while syncing prevents duplicate requests
 * - Uses the RefreshCw icon from lucide for modern UI
 */
import { RefreshCw, Loader2 } from 'lucide-react'

function SyncButton({ onSync, syncing, disabled }) {
  return (
    <button
      type="button"
      onClick={onSync}
      disabled={syncing || disabled}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {syncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Sync Profile
        </>
      )}
    </button>
  )
}

export default SyncButton