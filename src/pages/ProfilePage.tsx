import { useEffect, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import profileIcon from '../assets/profileIcon.png'
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
  getBlockchainHistory,
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

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-bold text-white/35 tracking-widest uppercase mb-3">{children}</div>
)

const ProfilePage = () => {
  const { authenticated, user, logout } = usePrivy()
  const { wallets } = useWallets()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [stats, setStats] = useState<any | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [memory, setMemory] = useState<any | null>(null)
  const [chainSession, setChainSession] = useState<any | null>(null)
  const [chainLoading, setChainLoading] = useState(false)
  const [chainLoaded, setChainLoaded] = useState(false)
  const [chainError, setChainError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [coaching, setCoaching] = useState<any | null>(null)
  const [insight, setInsight] = useState<any | null>(null)
  const [difficulty, setDifficulty] = useState<any | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [addrCopied, setAddrCopied] = useState(false)
  const [txCopied, setTxCopied] = useState<string | null>(null)
  const [chainHistory, setChainHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const token = getToken()
  const isAuthenticated = authenticated || Boolean(token)

  const address = useMemo(
    () =>
      (user as any)?.wallet?.address ||
      (user as any)?.embeddedWallets?.[0]?.address ||
      wallets.find((w) => !!w.address)?.address ||
      getWalletAddress() || '',
    [user, wallets],
  )
  const short = useMemo(() => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''), [address])

  useEffect(() => {
    if (!isAuthenticated || !getToken()) return
    let active = true
    getPlayerData().then((d) => { if (active) setName((d as any)?.playerNames0 || '') }).catch(() => {})
    return () => { active = false }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !getToken()) return
    setLoadingStats(true)
    getPlayerStats().then((d) => setStats(d || {})).catch(() => setStats({})).finally(() => setLoadingStats(false))
  }, [isAuthenticated])

  useEffect(() => {
    if (!address) return
    getPlayerMemory(address).then((d) => setMemory(d || null)).catch(() => {})
  }, [address])

  useEffect(() => {
    if (!address || !getToken() || historyLoaded) return
    setHistoryLoading(true)
    getBlockchainHistory(address)
      .then((d) => setChainHistory(d || []))
      .catch(() => {})
      .finally(() => { setHistoryLoading(false); setHistoryLoaded(true) })
  }, [address, historyLoaded])

  useEffect(() => {
    if (!address || !getToken() || chainLoaded || chainLoading) return
    setChainLoading(true); setChainError(null)
    getBlockchainSession(address)
      .then((s) => { setChainSession(s); setChainLoaded(true) })
      .catch(() => { setChainError('No on-chain session found yet — play a game first.'); setChainLoaded(true) })
      .finally(() => setChainLoading(false))
  }, [address, chainLoaded, chainLoading])

  async function handleLogout() {
    try { await logout().catch(() => {}) } finally {
      clearClientAuthSession()
      navigate('/', { replace: true })
      window.location.reload()
    }
  }

  async function copyAddress() {
    if (!address) return
    await navigator.clipboard.writeText(address).catch(() => {})
    setAddrCopied(true)
    setTimeout(() => setAddrCopied(false), 2000)
  }

  async function loadAiInsights() {
    if (aiLoading || aiLoaded || !address) return
    setAiLoading(true); setAiError(null)
    try {
      const [c, i, d] = await Promise.allSettled([
        getPlayerCoaching(address),
        getPlayerInsight(address, 1),
        getPlayerDifficulty(address),
      ])
      if (c.status === 'fulfilled') setCoaching(c.value)
      if (i.status === 'fulfilled') setInsight(i.value)
      if (d.status === 'fulfilled') setDifficulty(d.value)
      setAiLoaded(true)
    } catch { setAiError('Failed to load AI insights. Try again shortly.') }
    finally { setAiLoading(false) }
  }

  const gamesPlayed = (stats?.totalGamesPlayedVsCPU || 0) + (stats?.totalGamesPlayedVsHuman || 0)
  const gamesWon    = (stats?.totalGamesWonVsCPU   || 0) + (stats?.totalGamesWonVsHuman   || 0)
  const ballsPocketed = stats?.totalBallsPocketed || 0
  const intel = memory?.intelligence?.current
  const skillColor = intel?.skillLevel ? SKILL_COLORS[intel.skillLevel] ?? SKILL_COLORS.Beginner : null

  // ─── Sub-components ───────────────────────────────────────────────────────────

  const StatTile = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: string }) => (
    <div className={`rounded-2xl bg-slate-900/80 backdrop-blur-sm border ${accent} px-4 py-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold uppercase tracking-widest">
        <span className="text-base leading-none">{icon}</span>
        {label}
      </div>
      <div className="text-white font-extrabold text-2xl sm:text-3xl leading-none">
        {loadingStats ? <span className="text-white/30 text-lg animate-pulse">—</span> : value}
      </div>
    </div>
  )

  const OnChainCard = () => {
    if (!chainLoaded) return (
      <p className="text-xs text-white/30 animate-pulse py-2">Fetching on-chain session…</p>
    )
    if (!chainSession) return (
      <p className="text-xs text-white/30 py-2">{chainError || 'No session recorded yet.'}</p>
    )
    const ts = chainSession.timestamp ? new Date(chainSession.timestamp * 1000) : null
    const dateStr = ts ? ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    const timeStr = ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Session #', value: chainSession.loginCount ?? '—' },
            { label: 'Recorded', value: <><div className="font-bold text-sm">{dateStr}</div>{timeStr && <div className="text-white/40 text-[10px]">{timeStr}</div>}</> },
            { label: 'Balls on-chain', value: chainSession.stats?.totalBallsPocketed ?? '—' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl bg-white/10 px-3 py-2">
              <div className="text-[10px] text-white/35 uppercase tracking-wide mb-1">{item.label}</div>
              <div className="text-white font-extrabold text-lg leading-none">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={CHAINSCAN_CONTRACT} target="_blank" rel="noopener noreferrer"
            className="text-[11px] rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300 hover:bg-emerald-500/20 transition-colors">
            Contract ↗
          </a>
          {address && (
            <a href={CHAINSCAN_TX(address)} target="_blank" rel="noopener noreferrer"
              className="text-[11px] rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-white/50 hover:bg-white/10 transition-colors">
              My Activity ↗
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="profile-scroll w-full overflow-y-auto px-4 sm:px-6 md:px-8 py-4 pb-10">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <img src={profileIcon} className="h-14 w-14 rounded-full ring-2 ring-white/30 shrink-0" alt="Profile" />
          <div className="flex-1 min-w-0">
            <div className="text-white font-extrabold text-xl sm:text-2xl leading-tight truncate">
              {name || 'Your Username'}
            </div>
            {address && (
              <button
                onClick={copyAddress}
                className="flex items-center gap-1.5 text-white/50 text-xs font-mono hover:text-white/80 transition-colors mt-0.5"
              >
                <span className="truncate max-w-[200px] sm:max-w-none">{short}</span>
                <span className="shrink-0">{addrCopied ? '✓' : '⎘'}</span>
              </button>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            Logout
          </button>
        </div>

        {/* ── 4 Stat tiles ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon="⏱" label="Time Played" value={formatPlayTime(stats?.totalTimePlayed)} accent="border-cyan-500/25" />
          <StatTile icon="🎮" label="Games Played" value={gamesPlayed.toLocaleString()} accent="border-blue-500/25" />
          <StatTile icon={<img src={trophy} className="h-5 w-5 inline" alt="" />} label="Games Won" value={gamesWon.toLocaleString()} accent="border-yellow-500/25" />
          <StatTile icon={<img src={ball5} className="h-5 w-5 inline" alt="" />} label="Balls Pocketed" value={ballsPocketed.toLocaleString()} accent="border-purple-500/25" />
        </div>

        {/* ── Stats breakdown ────────────────────────────────────────── */}
        {!loadingStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'CPU Win Rate',
                value: stats?.totalGamesPlayedVsCPU > 0
                  ? `${Math.round((stats.totalGamesWonVsCPU / stats.totalGamesPlayedVsCPU) * 100)}%`
                  : '—',
                sub: stats?.totalGamesPlayedVsCPU > 0
                  ? `${stats.totalGamesWonVsCPU}W / ${stats.totalGamesPlayedVsCPU - stats.totalGamesWonVsCPU}L`
                  : 'No games yet',
                accent: 'border-indigo-500/25',
              },
              {
                label: 'Human Win Rate',
                value: stats?.totalGamesPlayedVsHuman > 0
                  ? `${Math.round((stats.totalGamesWonVsHuman / stats.totalGamesPlayedVsHuman) * 100)}%`
                  : '—',
                sub: stats?.totalGamesPlayedVsHuman > 0
                  ? `${stats.totalGamesWonVsHuman}W / ${stats.totalGamesPlayedVsHuman - stats.totalGamesWonVsHuman}L`
                  : 'No games yet',
                accent: 'border-pink-500/25',
              },
              {
                label: 'TT Best Score',
                value: stats?.ttBestScore > 0 ? stats.ttBestScore.toLocaleString() : '—',
                sub: 'Time Trial',
                accent: 'border-orange-500/25',
              },
              {
                label: 'Matrix Best',
                value: stats?.matrixBestScore > 0 ? stats.matrixBestScore.toLocaleString() : '—',
                sub: 'Matrix mode',
                accent: 'border-teal-500/25',
              },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className={`rounded-2xl bg-slate-900/80 backdrop-blur-sm border ${accent} px-4 py-3 flex flex-col gap-1`}>
                <div className="text-[10px] font-bold text-white/35 tracking-widest uppercase">{label}</div>
                <div className="text-white font-extrabold text-xl sm:text-2xl leading-none">{value}</div>
                <div className="text-[10px] text-white/30">{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Two-column body ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          {/* Left col (3/5) */}
          <div className="md:col-span-3 space-y-4">

            {/* Player Intelligence */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-white/15 p-5">
              <SectionLabel>Player Intelligence · 0G DA</SectionLabel>
              {intel ? (
                <div className="flex flex-wrap gap-2">
                  {intel.skillLevel && <Badge label={intel.skillLevel} color={skillColor!} />}
                  {intel.playStyle && <Badge label={`${intel.playStyle.charAt(0).toUpperCase() + intel.playStyle.slice(1)} style`} color="bg-blue-400/15 text-blue-300 border-blue-400/30" />}
                  {intel.reactionSpeed && <Badge label={`${intel.reactionSpeed.charAt(0).toUpperCase() + intel.reactionSpeed.slice(1)} reaction`} color="bg-green-400/15 text-green-300 border-green-400/30" />}
                  {typeof intel.consistency === 'number' && <Badge label={`${intel.consistency}% consistency`} color="bg-orange-400/15 text-orange-300 border-orange-400/30" />}
                  {memory?.skillEvents?.length > 0 && (
                    <Badge label={`${memory.skillEvents.length} DA events`} color="bg-white/5 text-white/40 border-white/10" />
                  )}
                </div>
              ) : (
                <p className="text-xs text-white/30">Loading intelligence from 0G DA…</p>
              )}
            </div>

            {/* On-Chain Session */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-emerald-500/35 p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>On-Chain Session · 0G EVM</SectionLabel>
                {chainLoaded && chainSession && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 rounded-full px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> LIVE
                  </span>
                )}
              </div>
              <OnChainCard />
            </div>

            {/* Inline Chain History */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-emerald-400/35 p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>On-Chain Login History · 0G EVM</SectionLabel>
                {chainHistory.length > 0 && (
                  <span className="text-[10px] text-emerald-400/60 font-mono shrink-0">{chainHistory.length} sessions</span>
                )}
              </div>
              {historyLoading && (
                <p className="text-xs text-white/30 animate-pulse py-2">Fetching events from chain…</p>
              )}
              {!historyLoading && historyLoaded && chainHistory.length === 0 && (
                <p className="text-xs text-white/30 py-2">No sessions recorded yet — play a game first.</p>
              )}
              {!historyLoading && chainHistory.length > 0 && (
                <div className="profile-scroll overflow-y-auto max-h-56 space-y-2 pr-1">
                  {chainHistory.map((s: any) => {
                    const ts = s.timestamp ? new Date(s.timestamp * 1000) : null
                    const dateStr = ts ? ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
                    const timeStr = ts ? ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
                    return (
                      <div key={s.txHash} className="rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 flex items-center gap-3">
                        <div className="shrink-0 text-center min-w-[36px]">
                          <div className="text-white font-extrabold text-sm leading-none">#{s.loginCount}</div>
                          <div className="text-white/30 text-[9px] mt-0.5">{dateStr}</div>
                          {timeStr && <div className="text-white/20 text-[9px]">{timeStr}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-white/35 truncate">{s.txHash.slice(0, 8)}…{s.txHash.slice(-6)}</span>
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(s.txHash).catch(() => {})
                                setTxCopied(s.txHash)
                                setTimeout(() => setTxCopied(null), 2000)
                              }}
                              className="text-white/30 hover:text-white/60 transition-colors text-[10px] shrink-0"
                            >
                              {txCopied === s.txHash ? '✓' : '⎘'}
                            </button>
                          </div>
                          <div className="text-[10px] text-white/30 mt-0.5">{s.totalBallsPocketed} balls on-chain</div>
                        </div>
                        <a
                          href={`https://chainscan.0g.ai/tx/${s.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[10px] rounded-lg border border-emerald-400/25 bg-emerald-500/8 px-2 py-1 text-emerald-300/70 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                        >
                          ↗
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* DA Proof status */}
            {memory?.skillEvents?.length > 0 && (
              <div className="rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-white/15 p-5">
                <SectionLabel>Recent DA Events · 0G DA</SectionLabel>
                <div className="space-y-1.5">
                  {memory.skillEvents.slice(0, 5).map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-white/50">{e.eventType}</span>
                      <span className={`font-bold ${e.daStatus === 'confirmed' || e.daStatus === 'finalized' ? 'text-emerald-400' : 'text-yellow-400/70'}`}>
                        {e.daStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right col (2/5) */}
          <div className="md:col-span-2 space-y-4">

            {/* AI Insights panel */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-cyan-500/35 p-5">
              <SectionLabel>AI Insights · 0G Compute TEE</SectionLabel>

              {!aiLoaded && (
                <div className="space-y-2">
                  <button
                    onClick={loadAiInsights}
                    disabled={aiLoading || !address}
                    className="w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-40"
                  >
                    {aiLoading ? 'Loading…' : aiError ? '↺ Retry AI Insights' : '✦ Get AI Insights'}
                  </button>
                  {aiError && <p className="text-xs text-red-400/80">{aiError}</p>}
                </div>
              )}

              {aiLoaded && (
                <div className="space-y-4">
                  {difficulty?.recommendation && (
                    <div>
                      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Difficulty</div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {difficulty.recommendation.difficulty && <Badge label={difficulty.recommendation.difficulty} color="bg-purple-400/20 text-purple-300 border-purple-400/40" />}
                        {difficulty.recommendation.cpuSkillLevel != null && <Badge label={`CPU ${difficulty.recommendation.cpuSkillLevel}`} color="bg-white/10 text-white/60 border-white/20" />}
                        {difficulty.recommendation.shouldIntroducePvP && <Badge label="PvP Ready" color="bg-green-400/20 text-green-300 border-green-400/40" />}
                      </div>
                      {difficulty.recommendation.reasoning && <p className="text-xs text-white/50 leading-relaxed">{difficulty.recommendation.reasoning}</p>}
                      {difficulty._meta?.teeVerified && <div className="mt-1.5 text-[10px] text-cyan-400/50 font-mono">TEE-verified</div>}
                    </div>
                  )}

                  {insight?.insight && (
                    <div className="pt-3 border-t border-white/8">
                      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Performance Insight</div>
                      <p className="text-sm text-white/75 leading-relaxed">{insight.insight}</p>
                      {insight._meta?.teeVerified && <div className="mt-1.5 text-[10px] text-cyan-400/50 font-mono">TEE-verified</div>}
                    </div>
                  )}

                  {coaching?.tips?.length > 0 && (
                    <div className="pt-3 border-t border-white/8">
                      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Coaching Tips</div>
                      <ul className="space-y-2">
                        {coaching.tips.map((tip: string, i: number) => (
                          <li key={i} className="flex gap-2 text-xs text-white/70 leading-snug">
                            <span className="text-cyan-400 font-bold shrink-0">{i + 1}.</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                      {coaching._meta?.teeVerified && <div className="mt-2 text-[10px] text-cyan-400/50 font-mono">TEE-verified</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 0G Contract info */}
            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-white/15 p-5">
              <SectionLabel>0G Network</SectionLabel>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'EVM Contract', color: 'text-emerald-400', href: CHAINSCAN_CONTRACT },
                  { label: 'DA Layer', color: 'text-blue-400', href: null },
                  { label: 'Compute TEE', color: 'text-cyan-400', href: null },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full inline-block ${item.color.replace('text-', 'bg-')}`} />
                      <span className="text-white/50">{item.label}</span>
                    </div>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className={`${item.color} hover:underline`}>active ↗</a>
                    ) : (
                      <span className={item.color}>active</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
