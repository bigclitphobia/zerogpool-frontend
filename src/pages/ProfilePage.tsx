import { useEffect, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import profileIcon from '../assets/profileIcon.png'
import frameLg from '../assets/leaderboardFrame.png'
import trophy from '../assets/trophy.png'
import ball5 from '../assets/balls/ball-5.png'
import { getPlayerData, updatePlayerName, getPlayerStats, getToken, setToken } from '../lib/api'

function formatPlayTime(totalMinutes: number | undefined) {
  if (!totalMinutes || totalMinutes <= 0) return '—'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 last:border-0">
    <div className="flex items-center gap-3 sm:gap-4 text-cyan-200">
      <span className="inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7">{icon}</span>
      <span className="font-semibold tracking-wide text-sm sm:text-base">{label}</span>
    </div>
    <div className="text-right text-white font-extrabold text-sm sm:text-base">{value}</div>
  </div>
)


const ProfilePage = () => {
  const { authenticated, user, logout } = usePrivy()
  const { wallets } = useWallets()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<any | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const address = useMemo(
    () =>
      (user as any)?.wallet?.address ||
      (user as any)?.embeddedWallets?.[0]?.address ||
      wallets.find((w) => !!w.address)?.address ||
      '',
    [user, wallets]
  )

  useEffect(() => {
    if (!authenticated || !getToken()) return
    let active = true
    getPlayerData()
      .then((data) => {
        if (!active) return
        const initial = (data && (data as any).playerNames0) || ''
        setName(initial)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [authenticated])

  useEffect(() => {
    if (!authenticated || !getToken()) return
    setLoadingStats(true)
    getPlayerStats()
      .then((data) => setStats(data || {}))
      .catch(() => setStats({}))
      .finally(() => setLoadingStats(false))
  }, [authenticated])

  const short = useMemo(() => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''), [address])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      // Clear backend JWT and any local wallet connection flag
      setToken(null)
      try {
        localStorage.removeItem("walletAddress")
        localStorage.removeItem('wallet_connected')
      } catch {}
    }
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updatePlayerName(name.trim())
    } finally {
      setSaving(false)
    }
  }

  const gamesPlayed = (stats?.totalGamesPlayedVsCPU || 0) + (stats?.totalGamesPlayedVsHuman || 0)
  const gamesWon = (stats?.totalGamesWonVsCPU || 0) + (stats?.totalGamesWonVsHuman || 0)
  const ballsPocketed = stats?.totalBallsPocketed || 0

  return (
    <div className="w-full h-full flex items-start justify-center px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-6xl mt-2 sm:mt-4">
        {/* Desktop/Tablet frame with overlay */}
        <div className="relative mx-auto hidden md:block">
          <img src={frameLg} alt="Profile frame" className="relative block w-full h-auto pointer-events-none mx-auto max-h-[calc(100vh-10rem)]" />
          <div className="absolute left-[10%] right-[6%] top-[12%] bottom-[14%] z-20 overflow-hidden">
            <div className="h-full w-full overflow-auto p-4 pr-2">
              {/* Header: avatar + name + address + input */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <img src={profileIcon} className="h-16 w-16 rounded-full ring-2 ring-white/40" alt="Profile" />
                  <div>
                    <div className="text-white text-3xl font-extrabold tracking-wide">{name || 'Your username'}</div>
                    {address && <div className="text-white/80 text-sm font-mono">{short}</div>}
                  </div>
                </div>
                <button onClick={handleLogout} className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white">
                  Logout
                </button>
              </div>

              {/* Stats list */}
              <div className="rounded-[16px] bg-black/30 border border-white/10 divide-y divide-white/10">
                <Row icon={<span className="text-cyan-300">⏱</span>} label="TOTAL TIME PLAYED" value={formatPlayTime(stats?.totalTimePlayed)} />
                <Row icon={<span className="text-pink-300">🎮</span>} label="GAMES PLAYED" value={loadingStats ? '—' : gamesPlayed.toLocaleString()} />
                <Row icon={<img src={trophy} className="h-5 w-5" alt="Wins" />} label="GAMES WON" value={loadingStats ? '—' : gamesWon.toLocaleString()} />
                <Row icon={<img src={ball5} className="h-5 w-5" alt="Balls" />} label="BALLS POCKETED" value={loadingStats ? '—' : ballsPocketed.toLocaleString()} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile simple layout (no frame) */}
        <div className="md:hidden w-full mt-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <img src={profileIcon} className="h-14 w-14 rounded-full ring-2 ring-white/40" alt="Profile" />
              <div>
                <div className="text-white text-2xl font-extrabold tracking-wide">{name || 'Your username'}</div>
                {address && <div className="text-white/80 text-sm font-mono">{short}</div>}
              </div>
            </div>
            <button onClick={handleLogout} className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white">
              Logout
            </button>
          </div>
          {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <label className="block text-sm text-white/80 mb-2">Update Username</label>
            <div className="flex items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter username"
                className="flex-1 rounded-xl bg-black/30 border border-white/15 px-4 py-2.5 text-white/90 outline-none focus:border-cyan-400"
              />
              <button onClick={save} disabled={!name.trim() || saving} className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div> */}
          <div className="mt-4 rounded-[16px] bg-black/30 border border-white/10 divide-y divide-white/10">
            <Row icon={<span className="text-cyan-300">⏱</span>} label="TOTAL TIME PLAYED" value={formatPlayTime(stats?.totalTimePlayed)} />
            <Row icon={<span className="text-pink-300">🎮</span>} label="GAMES PLAYED" value={loadingStats ? '—' : gamesPlayed.toLocaleString()} />
            <Row icon={<img src={trophy} className="h-5 w-5" alt="Wins" />} label="GAMES WON" value={loadingStats ? '—' : gamesWon.toLocaleString()} />
            <Row icon={<img src={ball5} className="h-5 w-5" alt="Balls" />} label="BALLS POCKETED" value={loadingStats ? '—' : ballsPocketed.toLocaleString()} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
