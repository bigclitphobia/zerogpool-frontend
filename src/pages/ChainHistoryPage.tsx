import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { getBlockchainHistory, getBlockchainLoginCount, getToken, getWalletAddress } from '../lib/api'

const CHAINSCAN_TX   = (hash: string)   => `https://chainscan.0g.ai/tx/${hash}`
const CHAINSCAN_ADDR = (addr: string)   => `https://chainscan.0g.ai/address/${addr}`
const CONTRACT       = '0x3Cf93517c30D9C6078C7A16454bd482908619523'

function fmt(ts: number) {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

type Session = {
  loginCount: number
  timestamp: number
  totalBallsPocketed: number
  txHash: string
  blockNumber: number
}

const ChainHistoryPage = () => {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const navigate = useNavigate()

  const address = useMemo(
    () =>
      (user as any)?.wallet?.address ||
      (user as any)?.embeddedWallets?.[0]?.address ||
      wallets.find(w => !!w.address)?.address ||
      getWalletAddress() || '',
    [user, wallets],
  )

  const [history, setHistory]       = useState<Session[]>([])
  const [loginCount, setLoginCount] = useState<number | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [copied, setCopied]         = useState<string | null>(null)

  const isAuthenticated = authenticated || Boolean(getToken())

  useEffect(() => {
    if (!isAuthenticated || !address) { setLoading(false); return }
    setLoading(true)
    Promise.allSettled([
      getBlockchainHistory(address),
      getBlockchainLoginCount(address),
    ]).then(([histRes, countRes]) => {
      if (histRes.status === 'fulfilled') setHistory(histRes.value)
      else setError('Could not load on-chain history — blockchain service may be unavailable.')
      if (countRes.status === 'fulfilled') setLoginCount(countRes.value)
    }).finally(() => setLoading(false))
  }, [address, isAuthenticated])

  function copyHash(hash: string) {
    navigator.clipboard.writeText(hash).catch(() => {})
    setCopied(hash)
    setTimeout(() => setCopied(null), 2000)
  }

  const short = (s: string) => s ? `${s.slice(0, 6)}…${s.slice(-4)}` : ''

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/profile')}
            className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm font-semibold text-white/80 transition-colors"
          >
            ← Profile
          </button>
          <h1 className="text-white font-extrabold text-xl tracking-wide">On-Chain Login History</h1>
          <span className="ml-auto text-[10px] font-mono text-emerald-400/60 hidden sm:inline">
            {CONTRACT.slice(0, 10)}…{CONTRACT.slice(-6)}
          </span>
        </div>

        {/* Wallet + count summary */}
        {address && (
          <div className="rounded-[16px] bg-black/40 border border-emerald-400/20 px-5 py-4 mb-5 flex flex-wrap items-center gap-3">
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Wallet</div>
              <div className="flex items-center gap-2 font-mono text-sm text-white/80">
                <span className="hidden sm:inline">{address}</span>
                <span className="sm:hidden">{short(address)}</span>
                <button
                  onClick={() => copyHash(address)}
                  className="text-white/40 hover:text-white transition-colors text-xs"
                  title="Copy address"
                >
                  {copied === address ? '✓' : '⎘'}
                </button>
                <a
                  href={CHAINSCAN_ADDR(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400/70 hover:text-emerald-400 text-xs"
                >
                  ↗
                </a>
              </div>
            </div>
            {loginCount !== null && (
              <div className="ml-auto text-right">
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Total Sessions</div>
                <div className="text-white font-extrabold text-2xl leading-none">{loginCount}</div>
              </div>
            )}
          </div>
        )}

        {/* Source of truth badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Source of truth: 0G EVM — SessionRecorded events
          </span>
          <a
            href={CHAINSCAN_ADDR(CONTRACT)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Contract ↗
          </a>
        </div>

        {/* States */}
        {loading && (
          <div className="text-center py-12 text-white/40 text-sm animate-pulse">
            Fetching events from 0G chain…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[14px] bg-red-500/10 border border-red-500/30 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="rounded-[14px] bg-black/30 border border-white/10 px-5 py-8 text-center text-white/40 text-sm">
            No on-chain sessions yet — play a game and your first login will appear here.
          </div>
        )}

        {/* Session list */}
        {!loading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((s) => (
              <div
                key={s.txHash}
                className="rounded-[14px] bg-black/40 border border-white/10 hover:border-emerald-400/30 transition-colors px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-white font-extrabold text-lg leading-none">Session #{s.loginCount}</span>
                    <div className="text-white/40 text-xs mt-0.5">{fmt(s.timestamp)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-white/40 uppercase tracking-wide">Balls on-chain</div>
                    <div className="text-white font-extrabold text-lg leading-none">{s.totalBallsPocketed.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-white/40">
                    {s.txHash.slice(0, 10)}…{s.txHash.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyHash(s.txHash)}
                    className="text-[11px] rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-white/50 hover:bg-white/10 transition-colors"
                  >
                    {copied === s.txHash ? '✓ Copied' : 'Copy tx'}
                  </button>
                  <a
                    href={CHAINSCAN_TX(s.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    View on chain ↗
                  </a>
                  <span className="ml-auto text-[10px] text-white/20 font-mono hidden sm:inline">
                    block {s.blockNumber.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChainHistoryPage
