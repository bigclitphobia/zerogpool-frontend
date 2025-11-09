import LiveLeaderboard from '../components/LiveLeaderboard'
import PlayerStatsPanel from '../components/PlayerStatsPanel'

const GamePage = () => {
  // Cloudflare R2 bucket URL for Unity WebGL build
  // Format: https://pub-{bucket-id}.r2.dev/index.html
  // Or custom domain: https://game.yourdomain.com/index.html
  const UNITY_GAME_URL = import.meta.env.VITE_UNITY_GAME_URL || 'https://pub-c57fda34f99145fc8d97b0a6b6faa237.r2.dev/index.html'

  return (
    <div className="w-full h-full flex flex-col items-center px-2 py-2">
      <div className="w-full max-w-[1400px] h-full flex flex-col">
        {/* Main game layout: 3 columns on desktop, stacked on mobile */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[240px_1fr_240px] gap-3 min-h-0">
          {/* Left: Live Leaderboard */}
          <div className="hidden lg:block min-h-0">
            <LiveLeaderboard />
          </div>

          {/* Center: Game Canvas */}
          <div className="flex items-center justify-center min-h-0 flex-1">
            <div className="relative rounded-xl border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(0,178,255,0.3)] overflow-hidden bg-black">
              {/* Unity WebGL iframe loading from Cloudflare R2 */}
              <iframe
                src={UNITY_GAME_URL}
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
                // Important: Add these for cross-origin loading
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
              
              {/* Loading indicator */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-none" id="game-loader">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mb-4"></div>
                  <div className="text-cyan-300 text-sm font-semibold">Loading game from CDN...</div>
                </div>
              </div>
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