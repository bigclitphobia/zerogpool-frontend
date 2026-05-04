import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LiveLeaderboard from '../components/LiveLeaderboard'
import PlayerStatsPanel from '../components/PlayerStatsPanel'
import { getToken, getWalletAddress } from '../lib/api'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const revokeRef = useRef<(() => void) | null>(null)
  const aliveRef = useRef(true)

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

  return (
    <div className="w-full h-full flex flex-col items-center px-2 py-2">
      <div className="w-full max-w-[1400px] h-full flex flex-col">
        <div className="mb-2 flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-400/20">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
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
            <span className="text-xs text-gray-500 truncate max-w-[min(100vw-8rem,28rem)]">
              {statusText}
            </span>
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

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[240px_1fr_240px] gap-3 min-h-0">
          <div className="hidden lg:block min-h-0">
            <LiveLeaderboard />
          </div>

          <div className="flex items-center justify-center min-h-0 flex-1">
            <div className="relative rounded-xl border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(0,178,255,0.3)] overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a0b2e] to-[#16003b]">
              <canvas
                ref={canvasRef}
                id="unity-canvas"
                width={960}
                height={540}
                className="block max-w-full bg-black"
              />
            </div>
          </div>

          <div className="hidden lg:block min-h-0">
            <PlayerStatsPanel />
          </div>

          <div className="lg:hidden grid grid-cols-2 gap-2 h-[200px]">
            <LiveLeaderboard />
            <PlayerStatsPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default GamePage
