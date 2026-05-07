import { useEffect, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import profileIcon from '../assets/profileIcon.png'
import frameLg from '../assets/leaderboardFrame.png'
import trophy from '../assets/trophy.png'
import ball5 from '../assets/balls/ball-5.png'
import {
  getPlayerData,
  getPlayerStats,
  getToken,
  getWalletAddress,
  clearClientAuthSession,
  getPlayerMemory,
  getPlayerDifficulty,
  getPlayerCoaching,
  getPlayerInsight,
  getBlockchainSession,
} from '../lib/api'

const CONTRACT_ADDRESS = '0x3Cf93517c30D9C6078C7A16454bd482908619523'
const CHAINSCAN_CONTRACT = `https://chainscan.0g.ai/address/${CONTRACT_ADDRESS}`
const CHAINSCAN_TX = (wallet: string) => `https://chainscan.0g.ai/address/${wallet}`

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

const SKILL_COLORS: Record<string, string> = {
  Pro:          'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
  Advanced:     'bg-purple-400/20 text-purple-300 border-purple-400/40',
  Intermediate: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
  Beginner:     'bg-white/10 text-white/60 border-white/20',
}

const Badge = ({ label, color }: { label: string; color?: string }) => (
  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide ${color ?? 'bg-white/10 text-white/70 border-white/20'}`}>
    {label}
  </span>
)

const ProfilePage = () => {
  const { authenticated, user, logout } = usePrivy()
  const { wallets } = useWallets()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [stats, setStats] = useState<any | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Player intelligence (auto-loaded from 0G DA)
  const [memory, setMemory] = useState<any | null>(null)

  // On-chain session (0G EVM contract)
  const [chainSession, setChainSession] = useState<any | null>(null)
  const [chainLoading, setChainLoading] = useState(false)
  const [chainLoaded, setChainLoaded] = useState(false)
  const [chainError, setChainError] = useState<string | null>(null)

  // AI Insights (rate-limited, load on demand)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [coaching, setCoaching] = useState<any | null>(null)
  const [insight, setInsight] = useState<any | null>(null)
  const [difficulty, setDifficulty] = useState<any | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const token = getToken()
  const isAuthenticated = authenticated || Boolean(token)

  const address = useMemo(
    () =>
      (user as any)?.wallet?.address ||
      (user as any)?.embeddedWallets?.[0]?.address ||
      wallets.find((w) => !!w.address)?.address ||
      getWalletAddress() ||
      '',
    [user, wallets]
  )

  useEffect(() => {
    if (!isAuthenticated || !getToken()) return
    let active = true
    getPlayerData()
      .then((data) => {
        if (!active) return
        setName((data && (data as any).playerNames0) || '')
      })
      .catch(() => {})
    return () => { active = false }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !getToken()) return
    setLoadingStats(true)
    getPlayerStats()
      .then((data) => setStats(data || {}))
      .catch(() => setStats({}))
      .finally(() => setLoadingStats(false))
  }, [isAuthenticated])

  // Auto-load player intelligence from 0G DA (no rate limit)
  useEffect(() => {
    if (!address) return
    getPlayerMemory(address)
      .then((data) => setMemory(data || null))
      .catch(() => {})
  }, [address])

  const short = useMemo(() => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''), [address])

  const CopyAddressButton = ({ className = '' }: { className?: string }) => {
    if (!address) return null
    async function handleCopy() {
      try { await navigator.clipboard.writeText(address) } catch { /* ignore */ }
    }
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={`ml-2 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 p-1 ${className}`}
        title="Copy address"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
          <rect x="7" y="3" width="9" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <rect x="4" y="6" width="9" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
    )
  }

  async function handleLogout() {
    try { await logout().catch(() => {}) } finally {
      clearClientAuthSession()
      navigate('/', { replace: true })
      window.location.reload()
    }
  }

  async function loadChainSession() {
    if (chainLoading || chainLoaded || !address) return
    setChainLoading(true)
    setChainError(null)
    try {
      const session = await getBlockchainSession(address)
      setChainSession(session)
      setChainLoaded(true)
    } catch {
      setChainError('No on-chain session found yet — play a game first.')
      setChainLoaded(true)
    } finally {
      setChainLoading(false)
    }
  }

  async function loadAiInsights() {
    if (aiLoading || aiLoaded || !address) return
    setAiLoading(true)
    setAiError(null)
    try {
      const [coachRes, insightRes, diffRes] = await Promise.allSettled([
        getPlayerCoaching(address),
        getPlayerInsight(address, 1),
        getPlayerDifficulty(address),
      ])
      if (coachRes.status === 'fulfilled')   setCoaching(coachRes.value)
      if (insightRes.status === 'fulfilled') setInsight(insightRes.value)
      if (diffRes.status === 'fulfilled')    setDifficulty(diffRes.value)
      setAiLoaded(true)
    } catch {
      setAiError('Failed to load AI insights. Try again shortly.')
    } finally {
      setAiLoading(false)
    }
  }

  const gamesPlayed = (stats?.totalGamesPlayedVsCPU || 0) + (stats?.totalGamesPlayedVsHuman || 0)
  const gamesWon = (stats?.totalGamesWonVsCPU || 0) + (stats?.totalGamesWonVsHuman || 0)
  const ballsPocketed = stats?.totalBallsPocketed || 0

  const intel = memory?.intelligence?.current
  const skillColor = intel?.skillLevel ? SKILL_COLORS[intel.skillLevel] ?? SKILL_COLORS.Beginner : null

  const IntelSection = () => {
    if (!intel) return null
    return (
      <div className="mt-4 rounded-[14px] bg-black/30 border border-white/10 p-4">
        <div className="text-xs font-bold text-white/40 tracking-widest mb-3 uppercase">Player Intelligence · 0G DA</div>
        <div className="flex flex-wrap gap-2 items-center">
          {intel.skillLevel && <Badge label={intel.skillLevel} color={skillColor!} />}
          {intel.playStyle && (
            <Badge
              label={`${intel.playStyle.charAt(0).toUpperCase() + intel.playStyle.slice(1)} style`}
              color="bg-blue-400/15 text-blue-300 border-blue-400/30"
            />
          )}
          {intel.reactionSpeed && (
            <Badge
              label={`${intel.reactionSpeed.charAt(0).toUpperCase() + intel.reactionSpeed.slice(1)} reaction`}
              color="bg-green-400/15 text-green-300 border-green-400/30"
            />
          )}
          {typeof intel.consistency === 'number' && (
            <Badge
              label={`${intel.consistency}% consistency`}
              color="bg-orange-400/15 text-orange-300 border-orange-400/30"
            />
          )}
        </div>
      </div>
    )
  }

  const OnChainSessionCard = () => {
    if (!chainLoaded) {
      return (
        <div className="mt-4">
          <button
            onClick={loadChainSession}
            disabled={chainLoading || !address}
            className="w-full rounded-[14px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {chainLoading ? 'Fetching on-chain session…' : '⛓ View On-Chain Session (0G EVM)'}
          </button>
          {chainError && <p className="mt-2 text-xs text-red-400 text-center">{chainError}</p>}
        </div>
      )
    }

    if (!chainSession) {
      return (
        <div className="mt-4 rounded-[14px] bg-black/30 border border-white/10 p-4 text-center text-xs text-white/40">
          {chainError || 'No on-chain session recorded yet.'}
        </div>
      )
    }

    const ts = chainSession.timestamp ? new Date(chainSession.timestamp * 1000) : null
    const dateStr = ts ? ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    const timeStr = ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

    return (
      <div className="mt-4 rounded-[14px] bg-black/30 border border-emerald-400/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-white/40 tracking-widest uppercase">On-Chain Session · 0G EVM</div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            LIVE
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <div className="rounded-[10px] bg-white/5 px-3 py-2">
            <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Session #</div>
            <div className="text-white font-extrabold text-xl leading-none">{chainSession.loginCount ?? '—'}</div>
          </div>
          <div className="rounded-[10px] bg-white/5 px-3 py-2">
            <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Recorded</div>
            <div className="text-white font-bold text-sm leading-snug">{dateStr}</div>
            {timeStr && <div className="text-white/50 text-[10px]">{timeStr}</div>}
          </div>
          <div className="rounded-[10px] bg-white/5 px-3 py-2 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Balls On-Chain</div>
            <div className="text-white font-extrabold text-xl leading-none">{chainSession.stats?.totalBallsPocketed ?? '—'}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={CHAINSCAN_CONTRACT}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            Contract ↗
          </a>
          {address && (
            <a
              href={CHAINSCAN_TX(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 transition-colors"
            >
              My Activity ↗
            </a>
          )}
          <span className="ml-auto text-[10px] text-emerald-400/40 font-mono hidden sm:inline">
            {CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)}
          </span>
        </div>
      </div>
    )
  }

  const AiInsightsSection = () => (
    <div className="mt-4">
      {!aiLoaded && (
        <button
          onClick={loadAiInsights}
          disabled={aiLoading || !address}
          className="w-full rounded-[14px] border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
        >
          {aiLoading ? 'Loading AI Insights…' : '✦ Get AI Insights (0G Compute)'}
        </button>
      )}
      {aiError && <p className="mt-2 text-xs text-red-400 text-center">{aiError}</p>}

      {aiLoaded && (
        <div className="space-y-3">
          {/* Difficulty */}
          {difficulty?.recommendation && (
            <div className="rounded-[14px] bg-black/30 border border-white/10 p-4">
              <div className="text-xs font-bold text-white/40 tracking-widest mb-2 uppercase">Difficulty Recommendation</div>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {difficulty.recommendation.difficulty && (
                  <Badge label={difficulty.recommendation.difficulty} color="bg-purple-400/20 text-purple-300 border-purple-400/40" />
                )}
                {difficulty.recommendation.cpuSkillLevel != null && (
                  <Badge label={`CPU Skill ${difficulty.recommendation.cpuSkillLevel}`} color="bg-white/10 text-white/60 border-white/20" />
                )}
                {difficulty.recommendation.shouldIntroducePvP && (
                  <Badge label="PvP Ready" color="bg-green-400/20 text-green-300 border-green-400/40" />
                )}
              </div>
              {difficulty.recommendation.reasoning && (
                <p className="text-xs text-white/60 leading-relaxed">{difficulty.recommendation.reasoning}</p>
              )}
              {difficulty._meta?.teeVerified && (
                <div className="mt-2 text-[10px] text-cyan-400/60 font-mono">TEE-verified · 0G Compute</div>
              )}
            </div>
          )}

          {/* Insight */}
          {insight?.insight && (
            <div className="rounded-[14px] bg-black/30 border border-white/10 p-4">
              <div className="text-xs font-bold text-white/40 tracking-widest mb-2 uppercase">Performance Insight</div>
              <p className="text-sm text-white/85 leading-relaxed">{insight.insight}</p>
              {insight._meta?.teeVerified && (
                <div className="mt-2 text-[10px] text-cyan-400/60 font-mono">TEE-verified · 0G Compute</div>
              )}
            </div>
          )}

          {/* Coaching */}
          {coaching?.tips && coaching.tips.length > 0 && (
            <div className="rounded-[14px] bg-black/30 border border-white/10 p-4">
              <div className="text-xs font-bold text-white/40 tracking-widest mb-3 uppercase">Coaching Tips</div>
              <ul className="space-y-2">
                {coaching.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-white/80 leading-snug">
                    <span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              {coaching._meta?.teeVerified && (
                <div className="mt-3 text-[10px] text-cyan-400/60 font-mono">TEE-verified · 0G Compute</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full h-full flex items-start justify-center px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-6xl mt-2 sm:mt-4">
        {/* Desktop/Tablet frame with overlay */}
        <div className="relative mx-auto hidden md:block">
          <img src={frameLg} alt="Profile frame" className="relative block w-full h-auto pointer-events-none mx-auto max-h-[calc(100vh-10rem)]" />
          <div className="absolute left-[10%] right-[6%] top-[12%] bottom-[14%] z-20 overflow-hidden">
            <div className="h-full w-full overflow-auto p-4 pr-2">
              {/* Header */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <img src={profileIcon} className="h-16 w-16 rounded-full ring-2 ring-white/40" alt="Profile" />
                  <div>
                    <div className="text-white text-3xl font-extrabold tracking-wide">{name || 'Your username'}</div>
                    {address && (
                      <div className="flex items-center text-white/80 text-sm font-mono">
                        <span className="truncate max-w-[220px] sm:max-w-none">{address}</span>
                        <CopyAddressButton />
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={handleLogout} className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white">
                  Logout
                </button>
              </div>

              {/* Core stats */}
              <div className="rounded-[16px] bg-black/30 border border-white/10 divide-y divide-white/10">
                <Row icon={<span className="text-cyan-300">⏱</span>} label="TOTAL TIME PLAYED" value={formatPlayTime(stats?.totalTimePlayed)} />
                <Row icon={<span className="text-pink-300">🎮</span>} label="GAMES PLAYED" value={loadingStats ? '—' : gamesPlayed.toLocaleString()} />
                <Row icon={<img src={trophy} className="h-5 w-5" alt="Wins" />} label="GAMES WON" value={loadingStats ? '—' : gamesWon.toLocaleString()} />
                <Row icon={<img src={ball5} className="h-5 w-5" alt="Balls" />} label="BALLS POCKETED" value={loadingStats ? '—' : ballsPocketed.toLocaleString()} />
              </div>

              {/* Intelligence badges */}
              <IntelSection />

              {/* On-chain session */}
              <OnChainSessionCard />

              {/* AI Insights */}
              <AiInsightsSection />
            </div>
          </div>
        </div>

        {/* Mobile simple layout */}
        <div className="md:hidden w-full mt-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <img src={profileIcon} className="h-14 w-14 rounded-full ring-2 ring-white/40" alt="Profile" />
              <div>
                <div className="text-white text-2xl font-extrabold tracking-wide">{name || 'Your username'}</div>
                {address && (
                  <div className="flex items-center text-white/80 text-sm font-mono">
                    <span>{short}</span>
                    <CopyAddressButton />
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleLogout} className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white">
              Logout
            </button>
          </div>

          {/* Core stats */}
          <div className="rounded-[16px] bg-black/30 border border-white/10 divide-y divide-white/10">
            <Row icon={<span className="text-cyan-300">⏱</span>} label="TOTAL TIME PLAYED" value={formatPlayTime(stats?.totalTimePlayed)} />
            <Row icon={<span className="text-pink-300">🎮</span>} label="GAMES PLAYED" value={loadingStats ? '—' : gamesPlayed.toLocaleString()} />
            <Row icon={<img src={trophy} className="h-5 w-5" alt="Wins" />} label="GAMES WON" value={loadingStats ? '—' : gamesWon.toLocaleString()} />
            <Row icon={<img src={ball5} className="h-5 w-5" alt="Balls" />} label="BALLS POCKETED" value={loadingStats ? '—' : ballsPocketed.toLocaleString()} />
          </div>

          {/* Intelligence badges */}
          <IntelSection />

          {/* On-chain session */}
          <OnChainSessionCard />

          {/* AI Insights */}
          <AiInsightsSection />
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
