import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Maximize, Minimize } from 'lucide-react'
import LiveLeaderboard from '../components/LiveLeaderboard'
import PlayerStatsPanel from '../components/PlayerStatsPanel'
import NeuralInsightSidebar from '../components/NeuralInsightSidebar'
import { getToken, getWalletAddress, getDaSnapshot } from '../lib/api'
import { useBlockchainToast } from '../context/BlockchainToastContext'
import {
  mountUnityFrom0gBuild,
  startBuildPrefetchFromManifest,
} from '../lib/zeroGGameBuild'

const GamePage = () => {
  const navigate = useNavigate()
  const { showToast } = useBlockchainToast()
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [statusText, setStatusText] = useState<string>('Preparing…')
  const [errorText, setErrorText] = useState<string>('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [daHeartbeat, setDaHeartbeat] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const revokeRef = useRef<(() => void) | null>(null)
  const aliveRef = useRef(true)
  const lastDaEventIdRef = useRef<string | null>(null)

  useEffect(() => {
    const wallet = getWalletAddress()
    const token = getToken()
    const isConnected =
      Boolean(token) || localStorage.getItem('wallet_connected') === 'true'

    if (!wallet || !isConnected) {
      navigate('/')
      return
    }
    setWalletAddress(wallet)

    const canvas = canvasRef.current
    if (!canvas) return

    aliveRef.current = true
    console.info('[ZGP:0g-build] GamePage: mount effect, wallet=', wallet?.slice(0, 10) + '…')
    void (async () => {
      try {
        setErrorText('')
        setStatusText('Caching build from 0G (first visit may take a while)…')
        console.info('[ZGP:0g-build] GamePage: awaiting startBuildPrefetchFromManifest()')
        await startBuildPrefetchFromManifest()
        if (!aliveRef.current) {
          console.info('[ZGP:0g-build] GamePage: unmounted after prefetch (Strict Mode or leave)')
          return
        }
        console.info('[ZGP:0g-build] GamePage: prefetch finished, calling mountUnityFrom0gBuild')
        setStatusText('Starting game…')
        const { revoke } = await mountUnityFrom0gBuild(canvas, wallet, token, (s) => {
          if (aliveRef.current) setStatusText(s)
        })
        if (!aliveRef.current) {
          console.info('[ZGP:0g-build] GamePage: unmounted after mount, revoking blob URLs + bridge')
          revoke()
          return
        }
        revokeRef.current = revoke
        setStatusText('Ready')
        showToast({
          title: 'Secured on 0G',
          description: 'Game assets verified via 0G root hashes. Leaderboard saves are mirrored to 0G.',
          txHash: null,
          duration: 5000,
        })
        console.info('[ZGP:0g-build] GamePage: Unity ready')
      } catch (e) {
        if (!aliveRef.current) return
        const msg = e instanceof Error ? e.message : String(e)
        setErrorText(msg)
        setStatusText('Failed')
        console.error('[ZGP:0g-build] GamePage: FAILED', e)
      }
    })()

    return () => {
      aliveRef.current = false
      revokeRef.current?.()
      revokeRef.current = null
    }
  }, [navigate, showToast])

  // Poll DA snapshot every 30s while game is active — show toast when a new save is confirmed
  useEffect(() => {
    if (!walletAddress) return
    const interval = setInterval(async () => {
      const snap = await getDaSnapshot(walletAddress)
      const latest = snap?.snapshot
      if (!latest?.eventId) return
      const status = latest.daStatus
      if (
        latest.eventId !== lastDaEventIdRef.current &&
        (status === 'confirmed' || status === 'finalized')
      ) {
        lastDaEventIdRef.current = latest.eventId
        setDaHeartbeat(true)
        setTimeout(() => setDaHeartbeat(false), 3000)
        showToast({
          title: '✅ Match Saved on 0G DA',
          description: 'Your game progress was confirmed on 0G Data Availability layer',
          txHash: null,
          type: 'da',
          duration: 6000,
        })
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [walletAddress, showToast])

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
  }, [])

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center px-2 py-2">
      <div className="w-full max-w-[1400px] h-full flex flex-col">
        <div className="mb-2 flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-400/20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300">
                  Connected:{' '}
                  <span className="text-cyan-400 font-mono">
                    {walletAddress
                      ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
                      : '—'}
                  </span>
                </span>
              </div>
              
              {/* DA Heartbeat */}
              <div className="flex items-center gap-2 border-l border-white/20 pl-4 py-1">
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${daHeartbeat ? 'bg-emerald-400 shadow-[0_0_15px_#10b981] scale-125' : 'bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'}`} />
                <span className="text-[11px] font-black tracking-[0.1em] uppercase font-[Mohave] text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                  0G DA Active
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">Status:</span>
              <span className="text-[11px] text-cyan-300 font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                {statusText}
              </span>
            </div>
          </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-gray-400 hover:text-cyan-400 transition-colors shrink-0"
            >
              ← Back to Home
            </button>
        </div>

        {errorText ? (
          <div className="mb-2 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {errorText}
          </div>
        ) : null}

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[240px_1fr_240px] gap-3 min-h-0 overflow-hidden">
          <div className="hidden lg:flex lg:flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <LiveLeaderboard />
            </div>
            <div className="h-[300px] shrink-0">
              <NeuralInsightSidebar />
            </div>
          </div>

          <div className="flex items-center justify-center min-h-0 flex-1">
            <div 
              ref={containerRef}
              className={`relative rounded-xl border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(0,178,255,0.3)] overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a0b2e] to-[#16003b] flex items-center justify-center ${isFullScreen ? 'w-full h-full rounded-none border-none' : ''}`}
            >
              <canvas
                ref={canvasRef}
                id="unity-canvas"
                width={960}
                height={540}
                className="block max-w-full bg-black"
                style={isFullScreen ? { width: '100vw', height: '100vh', objectFit: 'contain' } : {}}
              />
              
              {/* Floating Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={toggleFullScreen}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white rounded-lg border border-white/20 backdrop-blur-md transition-all z-10 group opacity-0 hover:opacity-100 focus:opacity-100 sm:opacity-100"
                title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>

          <div className="hidden lg:block min-h-0">
            <PlayerStatsPanel />
          </div>

          <div className="lg:hidden grid grid-cols-2 gap-2 h-[200px]">
            <LiveLeaderboard />
            <PlayerStatsPanel />
          </div>
          <div className="lg:hidden h-[200px] mt-2">
            <NeuralInsightSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}

export default GamePage
