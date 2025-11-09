import { useEffect, useState } from 'react'
import { getLeaderboard, type LeaderboardRow } from '../lib/api'
import ball1 from '../assets/balls/ball-1.png'
import ball2 from '../assets/balls/ball-2.png'
import ball3 from '../assets/balls/ball-3.png'

const LiveLeaderboard = () => {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = () => {
    getLeaderboard()
      .then((data) => setRows(data))
      .catch((e) => setError(e?.message || 'Failed to load'))
  }

  useEffect(() => {
    fetchLeaderboard()
    // Refresh every 10 seconds
    const interval = setInterval(fetchLeaderboard, 10000)
    return () => clearInterval(interval)
  }, [])

  const ballIcons: Record<number, string> = { 1: ball1, 2: ball2, 3: ball3 }
  const topRows = (rows || []).slice(0, 5)

  return (
    <div className="h-full flex flex-col rounded-xl border border-cyan-400/30 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-400/40 px-3 py-2">
        <h3 className="text-cyan-300 font-extrabold text-sm tracking-wider flex items-center gap-2">
          <span className="text-lg">🏆</span>
          LIVE LEADERBOARD
        </h3>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-1.5">
        {!rows && !error && (
          <div className="text-center py-4 text-cyan-100/60 text-xs">Loading...</div>
        )}
        {error && (
          <div className="text-center py-4 text-red-300 text-xs">{error}</div>
        )}
        {topRows.map((row) => (
          <div 
            key={row.rank} 
            className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {row.rank <= 3 && ballIcons[row.rank] ? (
                <img src={ballIcons[row.rank]} alt={`#${row.rank}`} className="h-5 w-5 flex-shrink-0" />
              ) : (
                <span className="text-white/80 font-bold text-xs w-5 text-center flex-shrink-0">
                  {row.rank}
                </span>
              )}
              <span className="text-white/90 font-semibold text-xs truncate">
                {row.playerName || 'Anonymous'}
              </span>
            </div>
            <span className="text-cyan-300 font-bold text-xs ml-2 flex-shrink-0">
              {row.totalBallsPocketed}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LiveLeaderboard