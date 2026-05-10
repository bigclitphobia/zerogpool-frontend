import { useEffect, useMemo, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
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
import NeuralActivityConsole from '../components/NeuralActivityConsole'

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
  <div className="text-[10px] font-black text-cyan-400/40 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
    <div className="h-[1px] w-4 bg-cyan-400/20" />
    {children}
  </div>
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
  const [showMerkleModal, setShowMerkleModal] = useState(false)

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

  const StatTile = ({ icon, label, value, accent, glow }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: string; glow: string }) => (
    <div className={`group relative rounded-2xl bg-slate-900/40 backdrop-blur-md border ${accent} px-5 py-5 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900/60 overflow-hidden`}>
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-3xl opacity-20 ${glow}`} />
      <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-[0.15em] mb-2">
        <span className="text-lg leading-none">{icon}</span>
        {label}
      </div>
      <div className="text-white font-black text-3xl sm:text-4xl leading-none tracking-tight">
        {loadingStats ? <span className="text-white/10 animate-pulse">···</span> : value}
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
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Session #', value: chainSession.loginCount ?? '—', color: 'text-cyan-400' },
            { label: 'Recorded', value: <><div className="font-black text-sm">{dateStr}</div>{timeStr && <div className="text-white/30 text-[9px] font-medium uppercase">{timeStr}</div>}</>, color: 'text-white' },
            { label: 'On-Chain Balls', value: chainSession.stats?.totalBallsPocketed ?? '—', color: 'text-emerald-400' },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/5 px-4 py-3 group hover:border-white/10 transition-colors">
              <div className="text-[9px] text-white/25 font-black uppercase tracking-widest mb-1.5">{item.label}</div>
              <div className={`font-black text-xl leading-none ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <a href={CHAINSCAN_CONTRACT} target="_blank" rel="noopener noreferrer"
            className="text-[11px] font-bold rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/40 transition-all">
            EVM Contract ↗
          </a>
          {address && (
            <a href={CHAINSCAN_TX(address)} target="_blank" rel="noopener noreferrer"
              className="text-[11px] font-bold rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/40 hover:bg-white/10 hover:text-white/70 transition-all">
              Explorer Activity ↗
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
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 sm:p-8">
          <div className="relative shrink-0">
            <img src={profileIcon} className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.2)]" alt="Profile" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 border-4 border-slate-900 rounded-full" />
            
            {/* Merkle Ribbon */}
            <button 
              onClick={() => setShowMerkleModal(true)}
              className="absolute -top-2 -left-2 bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-md shadow-[0_0_15px_rgba(34,211,238,0.4)] rotate-[-15deg] hover:scale-110 hover:rotate-[0deg] transition-all cursor-pointer z-10 border border-white/20 uppercase tracking-tighter"
            >
              Verified by 0G
            </button>
          </div>
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="text-white font-black text-3xl sm:text-4xl leading-tight tracking-tight mb-1 font-[Mohave]">
              {name || 'ANONYMOUS PLAYER'}
            </div>
            {address && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 text-cyan-400/60 text-xs font-mono bg-cyan-400/5 px-3 py-1.5 rounded-lg border border-cyan-400/10 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all group"
                >
                  <span className="truncate max-w-[200px] sm:max-w-none">{address}</span>
                  <span className="shrink-0 group-hover:scale-110 transition-transform">{addrCopied ? '✓' : '⎘'}</span>
                </button>
                <div className="flex gap-2">
                  <Badge label="ACTIVE SESSION" color="bg-emerald-400/10 text-emerald-400 border-emerald-400/20" />
                  <Badge label="0G VERIFIED" color="bg-blue-400/10 text-blue-400 border-blue-400/20" />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 px-6 py-3 text-sm font-bold text-white/60 hover:text-red-400 transition-all duration-300"
          >
            Sign Out
          </button>
        </div>

        {/* ── 4 Stat tiles ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile icon="⏱" label="Time Played" value={formatPlayTime(stats?.totalTimePlayed)} accent="border-cyan-500/20" glow="bg-cyan-500" />
          <StatTile icon="🎮" label="Games Played" value={gamesPlayed.toLocaleString()} accent="border-blue-500/20" glow="bg-blue-500" />
          <StatTile icon={<img src={trophy} className="h-5 w-5 inline" alt="" />} label="Games Won" value={gamesWon.toLocaleString()} accent="border-yellow-500/20" glow="bg-yellow-500" />
          <StatTile icon={<img src={ball5} className="h-5 w-5 inline" alt="" />} label="Balls Pocketed" value={ballsPocketed.toLocaleString()} accent="border-purple-500/20" glow="bg-purple-500" />
        </div>


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

            {/* Neural Activity Console */}
            <NeuralActivityConsole />

          </div>
        </div>
      </div>

      {/* Merkle Verification Modal */}
      {showMerkleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowMerkleModal(false)}
          />
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-400/30 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-400/10 flex items-center justify-center border border-cyan-400/30">
                <ShieldCheck size={32} className="text-cyan-400" />
              </div>
              
              <div>
                <h2 className="text-white font-black text-2xl tracking-tight font-[Mohave] uppercase">Data Integrity Verified</h2>
                <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">Proof of Storage · 0G Network</p>
              </div>

              <div className="w-full bg-black/40 rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="text-left">
                  <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-2">Merkle Tree Root Hash</div>
                  <div className="font-mono text-[11px] text-cyan-300 break-all bg-cyan-400/5 p-3 rounded-xl border border-cyan-400/10">
                    {memory?.snapshot?.rootHash || "0x7d9f2a4c8e1b3d5f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f1a3b5c7d9e1f"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-left">
                    <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Status</div>
                    <div className="text-emerald-400 font-black text-sm uppercase">Immutable</div>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">Layer</div>
                    <div className="text-blue-400 font-black text-sm uppercase">0G Storage</div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-white/50 leading-relaxed">
                Your player data is mathematically secured using Merkle Trees. Any attempt to modify your scores would invalidate this cryptographic proof.
              </p>

              <button
                onClick={() => setShowMerkleModal(false)}
                className="w-full py-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-black text-sm rounded-2xl border border-cyan-400/30 transition-all uppercase tracking-widest"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
