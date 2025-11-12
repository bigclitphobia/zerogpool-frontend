    import { useEffect, useState } from 'react'
import { getPlayerStats } from '../lib/api'
import trophy from '../assets/trophy.png'
import ball5 from '../assets/balls/ball-5.png'

function formatPlayTime(totalMinutes: number | undefined) {
  if (!totalMinutes || totalMinutes <= 0) return '—'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

const StatRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 last:border-0">
    <div className="flex items-center gap-3 text-cyan-200">
      <span className="inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7">{icon}</span>
      <span className="font-bold text-sm sm:text-base tracking-wide">{label}</span>
    </div>
    <div className="text-white font-extrabold text-sm sm:text-base">{value}</div>
  </div>
)

const PlayerStatsPanel = () => {
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = () => {
    getPlayerStats()
      .then((data) => setStats(data || {}))
      .catch(() => setStats({}))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const gamesPlayed = (stats?.totalGamesPlayedVsCPU || 0) + (stats?.totalGamesPlayedVsHuman || 0)
  const gamesWon = (stats?.totalGamesWonVsCPU || 0) + (stats?.totalGamesWonVsHuman || 0)
  const ballsPocketed = stats?.totalBallsPocketed || 0

  return (
    <div className="h-full flex flex-col rounded-xl border border-blue-400/30 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500/25 to-purple-500/25 border-b border-blue-400/40 px-4 py-3">
        <h3 className="text-blue-200 font-extrabold text-base sm:text-lg tracking-wider flex items-center gap-2">
          <span className="text-xl">📊</span>
          YOUR STATS
        </h3>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-4 text-blue-100/60 text-xs">Loading stats...</div>
        ) : (
          <div className="divide-y divide-white/10">
            <StatRow 
              icon={<span className="text-cyan-300">⏱</span>} 
              label="TIME PLAYED" 
              value={formatPlayTime(stats?.totalTimePlayed)} 
            />
            <StatRow 
              icon={<span className="text-pink-300">🎮</span>} 
              label="GAMES PLAYED" 
              value={gamesPlayed.toLocaleString()} 
            />
            <StatRow 
              icon={<img src={trophy} className="h-5 w-5" alt="Wins" />} 
              label="GAMES WON" 
              value={gamesWon.toLocaleString()} 
            />
            <StatRow 
              icon={<img src={ball5} className="h-5 w-5" alt="Balls" />} 
              label="BALLS POCKETED" 
              value={ballsPocketed.toLocaleString()} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerStatsPanel
