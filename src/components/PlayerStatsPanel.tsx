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
  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 last:border-0">
    <div className="flex items-center gap-2 text-cyan-200">
      <span className="inline-flex items-center justify-center h-5 w-5">{icon}</span>
      <span className="font-semibold text-xs">{label}</span>
    </div>
    <div className="text-white font-bold text-xs">{value}</div>
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
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-blue-400/40 px-3 py-2">
        <h3 className="text-blue-300 font-extrabold text-sm tracking-wider flex items-center gap-2">
          <span className="text-lg">📊</span>
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
              label="GAMES" 
              value={gamesPlayed.toLocaleString()} 
            />
            <StatRow 
              icon={<img src={trophy} className="h-4 w-4" alt="Wins" />} 
              label="WINS" 
              value={gamesWon.toLocaleString()} 
            />
            <StatRow 
              icon={<img src={ball5} className="h-4 w-4" alt="Balls" />} 
              label="BALLS" 
              value={ballsPocketed.toLocaleString()} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PlayerStatsPanel