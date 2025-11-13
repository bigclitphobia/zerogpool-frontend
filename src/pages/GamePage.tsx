import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LiveLeaderboard from '../components/LiveLeaderboard'
import PlayerStatsPanel from '../components/PlayerStatsPanel'

const GamePage = () => {
  const navigate = useNavigate()
  const [gameUrl, setGameUrl] = useState<string>('')
  const [walletAddress, setWalletAddress] = useState<string>('')
  
  const UNITY_GAME_BASE_URL = import.meta.env.VITE_UNITY_GAME_URL || 'https://pub-c57fda34f99145fc8d97b0a6b6faa237.r2.dev/index.html'

  useEffect(() => {
    // Get wallet address from localStorage
    const wallet = localStorage.getItem('walletAddress')
    const isConnected = localStorage.getItem('wallet_connected') === 'true'
    
    // Debug logs
    console.log('🔍 Checking wallet connection...')
    console.log('Wallet:', wallet)
    console.log('Connected:', isConnected)
    
    if (!wallet || !isConnected) {
      console.warn('⚠️ No wallet connected, redirecting to home...')
      // Redirect to home if no wallet
      navigate('/')
      return
    }
    
    setWalletAddress(wallet)
    
    // Build game URL with wallet parameter
    const urlWithWallet = `${UNITY_GAME_BASE_URL}?wallet=${wallet}`
    console.log('✅ Game URL with wallet:', urlWithWallet)
    setGameUrl(urlWithWallet)
    
  }, [navigate, UNITY_GAME_BASE_URL])

  // Show loading while checking wallet
  if (!gameUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">Loading game...</p>
          <p className="text-gray-400 text-sm mt-2">Verifying wallet connection</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center px-2 py-2">
      <div className="w-full max-w-[1400px] h-full flex flex-col">
        {/* Optional: Show connected wallet at top */}
        <div className="mb-2 flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-400/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              Connected: <span className="text-cyan-400 font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[240px_1fr_240px] gap-3 min-h-0">
          {/* Left: Live Leaderboard */}
          <div className="hidden lg:block min-h-0">
            <LiveLeaderboard />
          </div>

          {/* Center: Game Canvas */}
          <div className="flex items-center justify-center min-h-0 flex-1">
            <div className="relative rounded-xl border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(0,178,255,0.3)] overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#1a0b2e] to-[#16003b]">
              {/* Unity WebGL iframe - has its own custom loader inside */}
              <iframe
                src={gameUrl}
                title="Zero G Pool Game"
                className="block"
                style={{
                  width: '900px',
                  height: '600px',
                  border: 'none',
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                allow="autoplay; fullscreen; gamepad; microphone; clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>

          {/* Right: Player Stats */}
          <div className="hidden lg:block min-h-0">
            <PlayerStatsPanel />
          </div>

          {/* Mobile: Stats and Leaderboard below game */}
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