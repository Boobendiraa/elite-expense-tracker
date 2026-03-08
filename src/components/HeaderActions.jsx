import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loadProfile,
  loadInsights,
  saveInsights,
  exportAllData,
} from '../storage/index.js'
import { generateInsights, INSIGHT_TYPES } from '../utils/insights.js'

const HeaderActions = ({
  onOpenSettings,
  onOpenProfile,
  activePage,
  onSelectPage,
}) => {
  const [profile, setProfile] = useState(() => loadProfile())
  const [insights, setInsights] = useState(() => loadInsights())
  const [profileOpen, setProfileOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const profileRef = useRef(null)
  const insightsRef = useRef(null)

  useEffect(() => {
    setProfile(loadProfile())
  }, [activePage])

  useEffect(() => {
    setInsights(loadInsights())
  }, [activePage])

  const refreshInsights = useCallback(() => {
    const stored = loadInsights()
    const generated = generateInsights()
    const existingMessages = new Set(stored.map((i) => i.message))
    const newOnes = generated.filter((i) => !existingMessages.has(i.message))
    const merged = [...stored, ...newOnes].slice(-25)
    saveInsights(merged)
    setInsights(merged)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target) &&
        insightsRef.current &&
        !insightsRef.current.contains(e.target)
      ) {
        setProfileOpen(false)
        setInsightsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const unreadCount = insights.filter((i) => !i.read).length

  const markRead = useCallback((id) => {
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, read: true } : i)),
    )
    saveInsights(
      loadInsights().map((i) => (i.id === id ? { ...i, read: true } : i)),
    )
  }, [])

  const deleteInsight = useCallback((id) => {
    const next = insights.filter((i) => i.id !== id)
    setInsights(next)
    saveInsights(next)
  }, [insights])

  const clearAllInsights = useCallback(() => {
    setInsights([])
    saveInsights([])
    setInsightsOpen(false)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <div className="relative z-[100]" ref={insightsRef}>
        <button
          type="button"
          onClick={() => {
            setInsightsOpen((o) => !o)
            if (!insightsOpen) refreshInsights()
          }}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          title="Insights"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[0.65rem] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {insightsOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden z-[10000] dropdown-enter">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-semibold text-slate-100">
                Insights
              </span>
              {insights.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllInsights}
                  className="text-xs text-slate-400 hover:text-rose-300"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {insights.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">
                  No insights yet. Add transactions to get smart insights.
                </p>
              ) : (
                insights.map((i) => (
                  <div
                    key={i.id}
                    className={
                      'px-4 py-3 border-b border-slate-800/80 hover:bg-slate-800/50 transition ' +
                      (i.read ? 'opacity-75' : '')
                    }
                  >
                    {i.type && (
                      <span className="inline-block text-[0.65rem] font-medium uppercase tracking-wider text-teal-400/90 mb-1">
                        {INSIGHT_TYPES[i.type] || i.type}
                      </span>
                    )}
                    <p className="text-sm text-slate-200">{i.message}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => markRead(i.id)}
                        className="text-xs text-slate-400 hover:text-teal-300"
                      >
                        {i.read ? 'Read' : 'Mark read'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInsight(i.id)}
                        className="text-xs text-slate-400 hover:text-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-[100]" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition ring-2 ring-slate-700/50"
          title="Profile"
        >
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold">
              {profile.name ? profile.name[0].toUpperCase() : '?'}
            </span>
          )}
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl py-2 z-[10000] dropdown-enter">
            <div className="px-4 py-2 border-b border-slate-800">
              <p className="text-sm font-medium text-slate-100">
                {profile.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {profile.email || 'No email'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenProfile?.()
                setProfileOpen(false)
              }}
              className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
            >
              User Profile
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectPage?.('settings')
                onOpenSettings?.()
                setProfileOpen(false)
              }}
              className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => {
                const data = exportAllData()
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: 'application/json',
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`
                a.click()
                URL.revokeObjectURL(url)
                setProfileOpen(false)
              }}
              className="block w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
            >
              Backup Data
            </button>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-slate-500 cursor-not-allowed"
              disabled
            >
              Logout (coming soon)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeaderActions
