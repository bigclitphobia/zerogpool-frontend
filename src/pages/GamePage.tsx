import LiveLeaderboard from '../components/LiveLeaderboard'
import PlayerStatsPanel from '../components/PlayerStatsPanel'

const GamePage = () => {
  const UNITY_GAME_URL = import.meta.env.VITE_UNITY_GAME_URL || 'https://pub-c57fda34f99145fc8d97b0a6b6faa237.r2.dev/index.html'

  return (
    <div className="w-full h-full flex flex-col items-center px-2 py-2">
      <div className="w-full max-w-[1400px] h-full flex flex-col">
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