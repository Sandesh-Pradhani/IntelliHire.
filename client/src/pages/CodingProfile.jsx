/**
 * CodingProfile - Candidate's coding profile management page
 *
 * WHY THIS FILE:
 * Main page where candidates connect their GitHub, LeetCode, and HackerRank
 * usernames, sync their data, and see their AI-powered coding score.
 *
 * WHY THIS APPROACH:
 * - Uses the service layer (codingProfileService) for all API calls
 * - Shows loading states (Fetching..., Syncing...) and error alerts
 * - Statistic cards in the IntelliHire design language
 * - Responsive grid layout for desktop/tablet/mobile
 *
 * ALTERNATIVES CONSIDERED:
 * - Inline axios calls: violates the service layer rule
 * - Modal-based editing: inline forms are more discoverable
 */
import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Code2, X } from 'lucide-react'
import codingProfileService from '../services/codingProfileService'
import GithubCard from '../components/coding/GithubCard'
import LeetCodeCard from '../components/coding/LeetCodeCard'
import HackerRankCard from '../components/coding/HackerRankCard'
import CodingScoreCard from '../components/coding/CodingScoreCard'
import SyncButton from '../components/coding/SyncButton'

function CodingProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [score, setScore] = useState(null)
  const [form, setForm] = useState({
    githubUsername: '',
    leetcodeUsername: '',
    hackerrankUsername: '',
  })

  // Fetch the existing profile on mount
  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await codingProfileService.getProfile()
      setProfile(data)
      setForm({
        githubUsername: data.githubUsername || '',
        leetcodeUsername: data.leetcodeUsername || '',
        hackerrankUsername: data.hackerrankUsername || '',
      })
    } catch (err) {
      // 404 means no profile yet - that's fine
      if (err.status !== 404) {
        setError(err.message || 'Failed to fetch coding profile')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Calculate the coding score from synced data
  const calculateScore = useCallback(async (currentProfile) => {
    if (!currentProfile || (!currentProfile.githubData && !currentProfile.leetcodeData && !currentProfile.hackerrankData)) {
      setScore(null)
      return
    }
    setScoreLoading(true)
    try {
      const result = await codingProfileService.getCodingScore(currentProfile)
      setScore(result)
    } catch (err) {
      setError(err.message || 'Failed to calculate coding score')
    } finally {
      setScoreLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile?.githubData || profile?.leetcodeData || profile?.hackerrankData) {
      calculateScore(profile)
    }
  }, [profile?.githubData, profile?.leetcodeData, profile?.hackerrankData, profile, calculateScore])

  /**
   * Save the profile (create or update depending on existence).
   * Validates that at least one username is provided.
   */
  const handleSave = async () => {
    const hasAny = form.githubUsername.trim() || form.leetcodeUsername.trim() || form.hackerrankUsername.trim()
    if (!hasAny) {
      setError('Enter at least one coding platform username')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const data = profile
        ? await codingProfileService.updateProfile(form)
        : await codingProfileService.createProfile(form)
      setProfile(data)
      setSuccess(profile ? 'Coding profile updated successfully' : 'Coding profile created successfully')
      // Auto-sync after saving
      setTimeout(() => handleSync(data), 300)
    } catch (err) {
      setError(err.message || 'Failed to save coding profile')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Sync profile data from all connected platforms.
   */
  const handleSync = async (existingProfile) => {
    setSyncing(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await codingProfileService.refreshProfile()
      const updatedProfile = result.profile || existingProfile
      setProfile(updatedProfile)
      if (result.errors?.length > 0) {
        setError(result.errors.join('. '))
      } else {
        setSuccess('Coding profiles synced successfully')
      }
      // Recalculate score after sync
      await calculateScore(updatedProfile)
    } catch (err) {
      setError(err.message || 'Failed to sync coding profiles')
    } finally {
      setSyncing(false)
    }
  }

  const handleInputChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Coding Profile</h1>
          <p className="mt-2 text-slate-500">
            Connect GitHub, LeetCode, and HackerRank to evaluate coding achievements.
          </p>
        </div>
        {profile && (
          <SyncButton onSync={() => handleSync()} syncing={syncing} disabled={!profile} />
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success alert */}
      {success && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
          <button type="button" onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Username form */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Code2 className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Platform Usernames</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              GitHub Username
            </label>
            <input
              value={form.githubUsername}
              onChange={handleInputChange('githubUsername')}
              placeholder="e.g. sandesh-pradhani"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-blue-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              LeetCode Username
            </label>
            <input
              value={form.leetcodeUsername}
              onChange={handleInputChange('leetcodeUsername')}
              placeholder="e.g. sandesh_pradhani"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-blue-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              HackerRank Username
            </label>
            <input
              value={form.hackerrankUsername}
              onChange={handleInputChange('hackerrankUsername')}
              placeholder="e.g. sandesh_pradhani"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-blue-400"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Updating...
              </>
            ) : (
              profile ? 'Update Profile' : 'Save Profile'
            )}
          </button>
          {profile?.lastSynced && (
            <p className="text-xs text-slate-500">
              Last synced: {new Date(profile.lastSynced).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      {/* Platform cards */}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <GithubCard loading data={null} />
          <LeetCodeCard loading data={null} />
          <HackerRankCard loading data={null} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <GithubCard data={profile?.githubData} loading={false} />
          <LeetCodeCard data={profile?.leetcodeData} loading={false} />
          <HackerRankCard data={profile?.hackerrankData} loading={false} />
        </div>
      )}

      {/* Coding score */}
      <CodingScoreCard
        score={score?.codingScore}
        recommendation={score?.recommendation}
        breakdown={score?.breakdown}
        loading={scoreLoading}
      />
    </div>
  )
}

export default CodingProfile